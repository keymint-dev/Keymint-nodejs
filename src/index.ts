import { execSync } from 'child_process';
import { createHash, randomUUID } from 'crypto';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import axios, { AxiosInstance, AxiosError } from 'axios';
import { 
  CreateKeyParams, CreateKeyResponse, KeyMintApiError, 
  ActivateKeyParams, ActivateKeyResponse, DeactivateKeyParams, 
  DeactivateKeyResponse, GetKeyParams, GetKeyResponse, 
  BlockKeyParams, BlockKeyResponse, UnblockKeyParams, 
  UnblockKeyResponse, CreateCustomerParams, CreateCustomerResponse,
  GetAllCustomersResponse, GetCustomerWithKeysParams, GetCustomerWithKeysResponse,
  UpdateCustomerParams, UpdateCustomerResponse, DeleteCustomerParams, DeleteCustomerResponse,
  ToggleCustomerStatusParams, ToggleCustomerStatusResponse, GetCustomerByIdParams, GetCustomerByIdResponse,
  GetAllCustomersParams
} from './types';

// Export all types from types.ts to make them available to SDK users
export * from './types';

export class KeyMint {

  // ─── Identity Utilities ──────────────────────────────────────────────

  /**
   * Best-effort hardware fingerprint. Attempts to read the machine's
   * BIOS/System UUID, then falls back through OS-level IDs and network
   * interfaces. May return different values after hardware changes or
   * OS reinstalls. May fail or collide on cheap/virtualized hardware.
   *
   * Use this for logging, display, or secondary validation.
   * For activation hostId, prefer {@link getOrCreateInstallationId}.
   *
   * @returns A SHA-256 hashed 64-character hex string, or null if every layer failed.
   */
  static getMachineId(): string | null {
    const layers: Array<() => string | null> = [
      // Layer 1: BIOS / Hardware UUID (most stable, survives OS reinstalls)
      () => KeyMint._getBiosUUID(),
      // Layer 2: OS-level machine ID (survives app reinstalls, not OS reinstalls)
      () => KeyMint._getOSMachineId(),
      // Layer 3: Primary MAC address (generally stable, but can change with hardware)
      () => KeyMint._getPrimaryMAC(),
    ];

    for (const layer of layers) {
      try {
        const raw = layer();
        if (raw && raw.length > 4 && !KeyMint._isGarbageId(raw)) {
          return createHash('sha256').update(raw.toLowerCase().trim()).digest('hex');
        }
      } catch {
        continue;
      }
    }

    return null;
  }

  /**
   * Returns a guaranteed-unique, guaranteed-stable installation identifier.
   * On first call, it generates a UUIDv4 seeded with whatever hardware info
   * is available and persists it to disk. Every subsequent call returns the
   * same value — even across reboots, app updates, and hardware upgrades.
   *
   * This is the **recommended** value to pass as `hostId` when activating
   * a license key.
   *
   * @param storagePath - Optional custom path for the persistence file.
   *   Defaults to `~/.keymint/installation-id`.
   * @returns A SHA-256 hashed 64-character hex string.
   * @throws If the file cannot be read or written (e.g. read-only filesystem).
   */
  static getOrCreateInstallationId(storagePath?: string): string {
    const filePath = storagePath || join(homedir(), '.keymint', 'installation-id');

    // 1. If the file exists, trust it and return its contents
    if (existsSync(filePath)) {
      const stored = readFileSync(filePath, 'utf8').trim();
      if (stored.length > 0) {
        return createHash('sha256').update(stored).digest('hex');
      }
    }

    // 2. Generate a new installation ID, anchored to hardware when possible
    const hardwareAnchor = KeyMint.getMachineId() || '';
    const uuid = randomUUID();
    const compositeId = `${uuid}:${hardwareAnchor}:${Date.now()}`;

    // 3. Persist it
    const dir = filePath.substring(0, filePath.lastIndexOf('/'));
    if (dir && !existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    writeFileSync(filePath, compositeId, 'utf8');

    return createHash('sha256').update(compositeId).digest('hex');
  }

  // ─── Private: Fingerprint Layers ─────────────────────────────────────

  /** Layer 1: BIOS / Hardware UUID */
  private static _getBiosUUID(): string | null {
    const platform = process.platform;
    try {
      if (platform === 'win32') {
        return execSync(
          'powershell.exe -Command "(Get-CimInstance Win32_ComputerSystemProduct).UUID"',
          { encoding: 'utf8', timeout: 5000 }
        ).trim();
      } else if (platform === 'darwin') {
        return execSync(
          "ioreg -rd1 -c IOPlatformExpertDevice | grep IOPlatformUUID | awk -F'\"' '{print $4}'",
          { encoding: 'utf8', timeout: 5000 }
        ).trim();
      } else if (platform === 'linux') {
        // Requires root on most distros
        if (existsSync('/sys/class/dmi/id/product_uuid')) {
          return readFileSync('/sys/class/dmi/id/product_uuid', 'utf8').trim();
        }
      }
    } catch { /* fall through */ }
    return null;
  }

  /** Layer 2: OS-level persistent machine ID */
  private static _getOSMachineId(): string | null {
    const platform = process.platform;
    try {
      if (platform === 'win32') {
        // Windows MachineGuid — set at OS install, stable across reboots
        return execSync(
          'powershell.exe -Command "(Get-ItemProperty -Path \'HKLM:\\SOFTWARE\\Microsoft\\Cryptography\' -Name MachineGuid).MachineGuid"',
          { encoding: 'utf8', timeout: 5000 }
        ).trim();
      } else if (platform === 'darwin') {
        // macOS hardware serial — stable across OS reinstalls
        return execSync(
          "ioreg -rd1 -c IOPlatformExpertDevice | grep IOPlatformSerialNumber | awk -F'\"' '{print $4}'",
          { encoding: 'utf8', timeout: 5000 }
        ).trim();
      } else if (platform === 'linux') {
        // /etc/machine-id — no root required, set at OS install
        if (existsSync('/etc/machine-id')) {
          return readFileSync('/etc/machine-id', 'utf8').trim();
        }
        if (existsSync('/var/lib/dbus/machine-id')) {
          return readFileSync('/var/lib/dbus/machine-id', 'utf8').trim();
        }
      }
    } catch { /* fall through */ }
    return null;
  }

  /** Layer 3: Primary network interface MAC address */
  private static _getPrimaryMAC(): string | null {
    try {
      const os = require('os');
      const interfaces = os.networkInterfaces();
      for (const name of Object.keys(interfaces)) {
        // Skip loopback and virtual interfaces
        if (name.startsWith('lo') || name.startsWith('veth') || name.startsWith('docker')) continue;
        for (const iface of interfaces[name]!) {
          if (!iface.internal && iface.mac && iface.mac !== '00:00:00:00:00:00') {
            return iface.mac;
          }
        }
      }
    } catch { /* fall through */ }
    return null;
  }

  /** Detects garbage/default IDs that would cause collisions */
  private static _isGarbageId(id: string): boolean {
    const normalized = id.toLowerCase().replace(/[-:\s._]/g, '');
    const garbagePatterns = [
      /^0+$/,                    // All zeros
      /^f+$/,                    // All Fs
      'ffffffffffffffffffffffffffffffff',
      '03000200040005000006000700080009', // Common default BIOS UUID
      'defaultstring',
      'tobefilledbyoem',
      'notapplicable',
      'notspecified',
      'systemserialnum',
      'none',
    ];
    for (const pattern of garbagePatterns) {
      if (pattern instanceof RegExp) {
        if (pattern.test(normalized)) return true;
      } else {
        if (normalized === pattern || normalized.includes(pattern)) return true;
      }
    }
    return false;
  }

  private apiClient: AxiosInstance;

  constructor(accessToken: string, baseUrl = "https://api.keymint.dev") {
    if (!accessToken) {
      throw new Error("Access token is required to initialize the SDK.");
    }
    this.apiClient = axios.create({
      baseURL: baseUrl,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Generic method to handle POST requests.
   * @param endpoint - API endpoint
   * @param params - Request parameters
   * @returns A promise that resolves with the API response
   */
  private async handleRequest<T>(endpoint: string, params: object): Promise<T> {
    try {
      const response = await this.apiClient.post<T>(endpoint, params);
      return response.data;
    } catch (error) {
      throw this.handleError(error as AxiosError<KeyMintApiError>);
    }
  }

  /**
   * Generic method to handle GET requests.
   * @param endpoint - API endpoint
   * @param params - Query parameters
   * @returns A promise that resolves with the API response
   */
  private async handleGetRequest<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    try {
      const response = await this.apiClient.get<T>(endpoint, { params });
      return response.data;
    } catch (error) {
      throw this.handleError(error as AxiosError<KeyMintApiError>);
    }
  }

  /**
   * Generic method to handle DELETE requests.
   * @param endpoint - API endpoint
   * @param params - Query parameters
   * @returns A promise that resolves with the API response
   */
  private async handleDeleteRequest<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    try {
      const response = await this.apiClient.delete<T>(endpoint, { params });
      return response.data;
    } catch (error) {
      throw this.handleError(error as AxiosError<KeyMintApiError>);
    }
  }

  /**
   * Generic method to handle PUT requests.
   * @param endpoint - API endpoint
   * @param params - Request parameters
   * @returns A promise that resolves with the API response
   */
  private async handlePutRequest<T>(endpoint: string, params: object): Promise<T> {
    try {
      const response = await this.apiClient.put<T>(endpoint, params);
      return response.data;
    } catch (error) {
      throw this.handleError(error as AxiosError<KeyMintApiError>);
    }
  }

  /**
   * Creates a new license key.
   * @param params - Parameters for creating the key.
   * @returns A promise that resolves with the created key information or rejects with an error.
   */
  async createKey(params: CreateKeyParams): Promise<CreateKeyResponse> {
    return this.handleRequest<CreateKeyResponse>('/key', params);
  }

  /**
   * Activates a license key for a specific device.
   * 
   * **Note on hostId**: If `hostId` is omitted, Keymint will generate a random Device ID for this request. 
   * Because the generated ID is random, Keymint will treat every subsequent activation request 
   * from that same app without a `hostId` as a brand-new machine, consuming additional activation slots.
   * If you perform an anonymous activation, you MUST cache the result locally.
   * 
   * @param params - Parameters for activating the key.
   * @returns A promise that resolves with the activation status or rejects with an error.
   */
  async activateKey(params: ActivateKeyParams): Promise<ActivateKeyResponse> {
    return this.handleRequest<ActivateKeyResponse>('/key/activate', params);
  }

  /**
   * Deactivates a device from a license key.
   * @param params - Parameters for deactivating the key.
   * @returns A promise that resolves with the deactivation confirmation or rejects with an error.
   */
  async deactivateKey(params: DeactivateKeyParams): Promise<DeactivateKeyResponse> {
    return this.handleRequest<DeactivateKeyResponse>('/key/deactivate', params);
  }

  /**
   * Retrieves detailed information about a specific license key.
   * @param params - Parameters for fetching the key details.
   * @returns A promise that resolves with the license key details or rejects with an error.
   */
  async getKey(params: GetKeyParams): Promise<GetKeyResponse> {
    return this.handleGetRequest<GetKeyResponse>('/key', {
      productId: params.productId,
      licenseKey: params.licenseKey
    });
  }

  /**
   * Blocks a specific license key.
   * @param params - Parameters for blocking the key.
   * @returns A promise that resolves with the block confirmation or rejects with an error.
   */
  async blockKey(params: BlockKeyParams): Promise<BlockKeyResponse> {
    return this.handleRequest<BlockKeyResponse>('/key/block', params);
  }

  /**
   * Unblocks a previously blocked license key.
   * @param params - Parameters for unblocking the key.
   * @returns A promise that resolves with the unblock confirmation or rejects with an error.
   */
  async unblockKey(params: UnblockKeyParams): Promise<UnblockKeyResponse> {
    return this.handleRequest<UnblockKeyResponse>('/key/unblock', params);
  }

  /**
   * Creates a new customer.
   * @param params - Parameters for creating the customer.
   * @returns A promise that resolves with the created customer information or rejects with an error.
   */
  async createCustomer(params: CreateCustomerParams): Promise<CreateCustomerResponse> {
    return this.handleRequest<CreateCustomerResponse>('/customer', params);
  }

  /**
   * Retrieves all customers.
   * @param params - Optional parameters for pagination and filtering.
   * @returns A promise that resolves with the list of all customers or rejects with an error.
   */
  async getAllCustomers(params?: GetAllCustomersParams): Promise<GetAllCustomersResponse> {
    return this.handleGetRequest<GetAllCustomersResponse>('/customer', params);
  }

  /**
   * Retrieves a customer along with their associated license keys.
   * @param params - Parameters for fetching the customer with keys.
   * @returns A promise that resolves with the customer and their license keys or rejects with an error.
   */
  async getCustomerWithKeys(params: GetCustomerWithKeysParams): Promise<GetCustomerWithKeysResponse> {
    return this.handleGetRequest<GetCustomerWithKeysResponse>('/customer/keys', {
      customerId: params.customerId
    });
  }

  /**
   * Updates an existing customer.
   * @param params - Parameters for updating the customer.
   * @returns A promise that resolves with the updated customer information or rejects with an error.
   */
  async updateCustomer(params: UpdateCustomerParams): Promise<UpdateCustomerResponse> {
    return this.handlePutRequest<UpdateCustomerResponse>('/customer/by-id', params);
  }

  /**
   * Deletes a customer and all associated license keys permanently.
   * @param params - Parameters for deleting the customer.
   * @returns A promise that resolves with the deletion confirmation or rejects with an error.
   */
  async deleteCustomer(params: DeleteCustomerParams): Promise<DeleteCustomerResponse> {
    return this.handleDeleteRequest<DeleteCustomerResponse>('/customer/by-id', {
      customerId: params.customerId
    });
  }

  /**
   * Toggles the status of a customer (active/inactive).
   * @param params - Parameters for toggling the customer status.
   * @returns A promise that resolves with the updated customer status or rejects with an error.
   */
  async toggleCustomerStatus(params: ToggleCustomerStatusParams): Promise<ToggleCustomerStatusResponse> {
    return this.handleRequest<ToggleCustomerStatusResponse>('/customer/disable', {
      customerId: params.customerId
    });
  }

  /**
   * Retrieves detailed information about a specific customer by ID.
   * @param params - Parameters for fetching the customer details.
   * @returns A promise that resolves with the customer details or rejects with an error.
   */
  async getCustomerById(params: GetCustomerByIdParams): Promise<GetCustomerByIdResponse> {
    return this.handleGetRequest<GetCustomerByIdResponse>(`/customer/by-id`, {
      customerId: params.customerId
    });
  }

  private handleError(axiosError: AxiosError<KeyMintApiError>): KeyMintApiError {
    const defaultApiErrorMessage = 'An API error occurred during the request.';
    const defaultUnexpectedErrorMessage = 'An unexpected error occurred.';

    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    if (axiosError.isAxiosError && axiosError.response) {
      const responseData = axiosError.response.data;
      
      // The API returned a structured error message
      if (typeof responseData === 'object' && responseData !== null && 'message' in responseData) { 
        return {
          message: responseData.message || defaultApiErrorMessage,
          code: typeof responseData.code === 'number' ? responseData.code : -1,
          status: axiosError.response.status
        };
      } else {
        // The API responded, but the error format was unexpected
        return {
          message: defaultApiErrorMessage, 
          code: -1, 
          status: axiosError.response.status
        };
      }
    } else {
      // Something happened in setting up the request that triggered an Error
      // or there was no response from the server
      return {
        message: axiosError.message || defaultUnexpectedErrorMessage,
        code: -1,
        status: undefined
      };
    }
  }
}

export default KeyMint;
