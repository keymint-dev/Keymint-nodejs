// Type-level checks, compiled by `npm run typecheck:tests` (nothing is emitted).
import { KeyMint } from '../../src';
import type { InstallationIdError, InstallationIdOptions } from '../../src';

// getOrCreateInstallationId still returns a string; requirePersisted is opt-in.
export function installationIdCalls(): string[] {
  const options: InstallationIdOptions = { requirePersisted: true };
  return [
    KeyMint.getOrCreateInstallationId(),
    KeyMint.getOrCreateInstallationId('/data/installation-id'),
    KeyMint.getOrCreateInstallationId('/data/installation-id', options),
    KeyMint.getOrCreateInstallationId({ requirePersisted: true }),
    KeyMint.getOrCreateInstallationId({ storagePath: '/data/installation-id', requirePersisted: false }),
    // @ts-expect-error requirePersisted is a boolean
    KeyMint.getOrCreateInstallationId({ requirePersisted: 'yes' }),
  ];
}

export function errorPath(err: InstallationIdError): string {
  return err.path;
}
