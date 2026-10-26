import { createHash, createPublicKey, verify, KeyObject } from 'crypto';

/**
 * Why an offline license failed verification. The first failing check decides the code.
 */
export type OfflineLicenseErrorCode =
  | 'malformed'
  | 'unsupported_algorithm'
  | 'unknown_key'
  | 'bad_signature'
  | 'wrong_type'
  | 'wrong_product'
  | 'wrong_machine'
  | 'expired';

/**
 * Options for {@link verifyOfflineLicense}.
 */
export interface OfflineVerifyOptions {
  /** Trusted public keys (SPKI PEM) from Developer → Public Keys. At least one. */
  publicKeys: string[];
  /** Must equal the license's product ID. Required: one signing key covers every product in an org. */
  productId: string;
  /** Must equal the machine code the license was signed for. */
  machineCode: string;
  /** Time to check expiry against. Default: the system clock. Pass max(system time, last trusted time) to resist clock rollback. */
  now?: Date;
  /** Leeway on expiry in seconds, 0 to 3600. Default: 60. */
  clockSkewSeconds?: number;
}

/**
 * The verified contents of an offline license.
 */
export interface OfflineLicense {
  licenseKey: string;
  productId: string;
  machineCode: string;
  /** The `kid` of the trusted public key that signed the license. */
  keyId: string;
  issuedAt: Date | null;
  expiresAt: Date;
}

const ERROR_MESSAGES: Record<OfflineLicenseErrorCode, string> = {
  malformed: 'Offline license is malformed',
  unsupported_algorithm: 'Offline license uses an unsupported algorithm',
  unknown_key: 'Offline license was not signed by a trusted public key',
  bad_signature: 'Offline license signature is invalid',
  wrong_type: 'Token is not an offline license',
  wrong_product: 'Offline license is for a different product',
  wrong_machine: 'Offline license is for a different machine',
  expired: 'Offline license has expired',
};

/**
 * Thrown by {@link verifyOfflineLicense} when a license fails verification.
 * The message never contains the license key.
 */
export class OfflineLicenseError extends Error {
  readonly code: OfflineLicenseErrorCode;

  constructor(code: OfflineLicenseErrorCode) {
    super(ERROR_MESSAGES[code]);
    this.name = 'OfflineLicenseError';
    this.code = code;
    Object.setPrototypeOf(this, OfflineLicenseError.prototype);
  }
}

const SEGMENT = /^[A-Za-z0-9_-]*$/;
const DEFAULT_CLOCK_SKEW_SECONDS = 60;
const MAX_CLOCK_SKEW_SECONDS = 3600;

// Manual base64url so this works on Node versions without the 'base64url' encoding.
// Callers only pass strings that already matched SEGMENT.
function fromBase64Url(segment: string): Buffer {
  const base64 = segment.replace(/-/g, '+').replace(/_/g, '/');
  return Buffer.from(base64 + '='.repeat((4 - (base64.length % 4)) % 4), 'base64');
}

function toBase64Url(buffer: Buffer): string {
  return buffer.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

function decodeJson(segment: string): Record<string, unknown> | null {
  try {
    const value: unknown = JSON.parse(fromBase64Url(segment).toString('utf8'));
    return isObject(value) ? value : null;
  } catch {
    return null;
  }
}

function loadPublicKey(pem: unknown, index: number): [string, KeyObject] {
  // Only SPKI public keys: createPublicKey would also derive a public key from a
  // private key or certificate, which must never be bundled for this.
  if (typeof pem !== 'string' || !pem.trim().startsWith('-----BEGIN PUBLIC KEY-----')) {
    throw new TypeError(`publicKeys[${index}] must be an Ed25519 public key in SPKI PEM format`);
  }
  let key: KeyObject;
  try {
    key = createPublicKey(pem);
  } catch {
    throw new TypeError(`publicKeys[${index}] is not a valid public key PEM`);
  }
  if (key.asymmetricKeyType !== 'ed25519') {
    throw new TypeError(`publicKeys[${index}] must be an Ed25519 public key`);
  }
  const der = key.export({ type: 'spki', format: 'der' });
  return [toBase64Url(createHash('sha256').update(der).digest()), key];
}

/**
 * Verifies an offline license (`.lic` file contents or the bare token) locally,
 * without calling the Keymint API.
 *
 * @param license - The `.lic` file contents (JSON) returned by `signKey` or the dashboard, or the bare token.
 * @param options - Trusted public keys, the expected product ID and machine code, and optional time settings.
 * @returns The verified license.
 * @throws {OfflineLicenseError} When the license fails verification; `code` says why.
 * @throws {TypeError | RangeError} When the options are invalid (a programming error).
 */
export function verifyOfflineLicense(license: string, options: OfflineVerifyOptions): OfflineLicense {
  if (!options || typeof options !== 'object') throw new TypeError('options are required');
  const { publicKeys, productId, machineCode } = options;
  if (!Array.isArray(publicKeys) || publicKeys.length === 0) {
    throw new TypeError('publicKeys must contain at least one key');
  }
  if (typeof productId !== 'string' || productId.length === 0) throw new TypeError('productId is required');
  if (typeof machineCode !== 'string' || machineCode.length === 0) throw new TypeError('machineCode is required');
  const clockSkew = options.clockSkewSeconds ?? DEFAULT_CLOCK_SKEW_SECONDS;
  if (typeof clockSkew !== 'number' || !(clockSkew >= 0 && clockSkew <= MAX_CLOCK_SKEW_SECONDS)) {
    throw new RangeError('clockSkewSeconds must be between 0 and 3600');
  }
  let nowSeconds: number;
  if (options.now === undefined) {
    nowSeconds = Math.floor(Date.now() / 1000);
  } else {
    if (!(options.now instanceof Date) || isNaN(options.now.getTime())) {
      throw new TypeError('now must be a valid Date');
    }
    nowSeconds = Math.floor(options.now.getTime() / 1000);
  }
  const keys = new Map(publicKeys.map((pem, i) => loadPublicKey(pem, i)));
  if (typeof license !== 'string') throw new TypeError('license must be a string');

  const fail = (code: OfflineLicenseErrorCode): never => {
    throw new OfflineLicenseError(code);
  };

  // 1. Parse: a .lic file (JSON) or a bare token.
  let token = license.trim();
  if (token.startsWith('{')) {
    let file: unknown;
    try {
      file = JSON.parse(token);
    } catch {
      return fail('malformed');
    }
    if (!isObject(file) || typeof file.signedKey !== 'string') return fail('malformed');
    token = file.signedKey;
  }
  const parts = token.split('.');
  if (parts.length !== 3 || !parts.every((p) => SEGMENT.test(p))) return fail('malformed');
  const [headerB64, payloadB64, signatureB64] = parts;
  const header = decodeJson(headerB64);
  const payload = decodeJson(payloadB64);
  if (!header || !payload) return fail('malformed');

  // 2. Algorithm: exactly EdDSA, no critical extensions.
  if (header.alg !== 'EdDSA' || 'crit' in header) return fail('unsupported_algorithm');

  // 3. Key: the kid must name a trusted key.
  const kid = header.kid;
  const key = typeof kid === 'string' ? keys.get(kid) : undefined;
  if (!key) return fail('unknown_key');

  // 4. Signature over the segments exactly as received.
  const signature = fromBase64Url(signatureB64);
  if (signature.length !== 64 || !verify(null, Buffer.from(`${headerB64}.${payloadB64}`), key, signature)) {
    return fail('bad_signature');
  }

  // 5-7. Claims, compared exactly.
  if (payload.type !== 'offline') return fail('wrong_type');
  if (payload.productId !== productId) return fail('wrong_product');
  if (payload.machineCode !== machineCode) return fail('wrong_machine');

  // 8. Shape of the remaining claims, then 9. expiry.
  const { exp, iat, sub } = payload;
  if (typeof exp !== 'number' || !Number.isFinite(exp)) return fail('malformed');
  if (typeof sub !== 'string' || sub.length === 0) return fail('malformed');
  if (!(nowSeconds < exp + clockSkew)) return fail('expired');

  return {
    licenseKey: sub,
    productId,
    machineCode,
    keyId: kid as string,
    issuedAt: typeof iat === 'number' ? new Date(iat * 1000) : null,
    expiresAt: new Date(exp * 1000),
  };
}
