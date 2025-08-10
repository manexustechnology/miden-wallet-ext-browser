// lib/accountExportImport.ts
// Account export and import functionality for Miden wallet
// Client-side only module - all Miden SDK operations happen in the browser
// No static imports of Miden SDK to avoid server-side issues

import type { MidenInfo } from './createMintConsume';

// Helper function to ensure client-side execution
function ensureClientSide(): void {
  if (typeof window === "undefined" || typeof window.fetch === "undefined") {
    throw new Error("This module can only run in the browser with fetch support");
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let midenSDKCache: any = null;

async function getMidenSDK() {
  if (!midenSDKCache) {
    ensureClientSide();
    midenSDKCache = await import("@demox-labs/miden-sdk");
  }
  return midenSDKCache;
}

// Get Miden SDK instance with dynamic import
async function getMidenSDKInstance() {
  const { WebClient } = await getMidenSDK();
  return await WebClient.createClient();
}

export interface ExportResult {
  success: boolean;
  data?: Uint8Array;
  error?: string;
}

export interface ImportResult {
  success: boolean;
  accountId?: string;
  error?: string;
}

/**
 * Extract wallet data from various backup file formats
 * @param parsedData - Parsed JSON data from backup file
 * @returns MidenInfo object if valid, null otherwise
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function extractWalletData(parsedData: any): MidenInfo | null {
  if (!parsedData || typeof parsedData !== 'object') {
    return null;
  }
  
  // Direct wallet data format (like test-wallet-backup.json)
  if (parsedData.aliceId || parsedData.faucetId || parsedData.aliceMidenAddress) {
    console.log('Detected direct wallet data format');
    return parsedData as MidenInfo;
  }
  
  // Exported wallet format (from Export Wallet menu)
  if (parsedData.walletInfo && typeof parsedData.walletInfo === 'object') {
    console.log('Detected exported wallet format, extracting walletInfo');
    const extractedWallet = parsedData.walletInfo;
    
    if (extractedWallet.aliceId || extractedWallet.faucetId || extractedWallet.aliceMidenAddress) {
      console.log('Extracted wallet data is valid');
      return extractedWallet as MidenInfo;
    }
  }
  
  // Legacy format or other variations
  if (parsedData.wallet || parsedData.account || parsedData.accountData) {
    const possibleWallet = parsedData.wallet || parsedData.account || parsedData.accountData;
    if (possibleWallet && typeof possibleWallet === 'object') {
      if (possibleWallet.aliceId || possibleWallet.faucetId || possibleWallet.aliceMidenAddress) {
        console.log('Detected legacy wallet format');
        return possibleWallet as MidenInfo;
      }
    }
  }
  
  console.log('No valid wallet data found in parsed data');
  return null;
}

/**
 * Export account data
 * @param accountId - The account ID to export
 * @returns ExportResult with account data or error
 */
export async function exportAccount(accountId: string): Promise<ExportResult> {
  try {
    ensureClientSide();
    const webClient = await getMidenSDKInstance();
    
    // Get the account
    const account = await webClient.getAccount(accountId);
    if (!account) {
      return {
        success: false,
        error: 'Account not found'
      };
    }
    
    // Export the account
    const accountBytes = await webClient.exportAccount(account);
    
    return {
      success: true,
      data: accountBytes
    };
    
  } catch (error) {
    console.error('Error exporting account:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Import account from exported data
 * @param accountBytes - The exported account data
 * @returns ImportResult with account ID or error
 */
export async function importAccount(accountBytes: Uint8Array): Promise<ImportResult> {
  try {
    ensureClientSide();
    const webClient = await getMidenSDKInstance();
    
    // Import the account
    const result = await webClient.importAccount(accountBytes);
    
    return {
      success: true,
      accountId: result.toString()
    };
    
  } catch (error) {
    console.error('Error importing account:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Import public account from seed
 * @param initSeed - Initialization seed for the account
 * @param mutable - Whether the account should be mutable
 * @returns ImportResult with account ID or error
 */
export async function importPublicAccountFromSeed(
  initSeed: Uint8Array, 
  mutable: boolean = true
): Promise<ImportResult> {
  try {
    ensureClientSide();
    const webClient = await getMidenSDKInstance();
    
    // Import public account from seed
    const account = await webClient.importPublicAccountFromSeed(initSeed, mutable);
    
    return {
      success: true,
      accountId: account.id().toString()
    };
    
  } catch (error) {
    console.error('Error importing public account from seed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Export store data (complete wallet backup)
 * @returns ExportResult with store data or error
 */
export async function exportStore(): Promise<ExportResult> {
  try {
    ensureClientSide();
    const webClient = await getMidenSDKInstance();
    
    // Export the entire store
    const storeExport = await webClient.exportStore();
    
    // Ensure we have valid data
    if (!storeExport) {
      return {
        success: false,
        error: 'Failed to export store data'
      };
    }
    
    return {
      success: true,
      data: storeExport
    };
    
  } catch (error) {
    console.error('Error exporting store:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Import store data with better validation and error handling
 * @param storeDump - The store data to import (string or Uint8Array)
 * @returns ImportResult with success status or error
 */
export async function importStore(storeDump: Uint8Array | string): Promise<ImportResult> {
  try {
    ensureClientSide();
    const webClient = await getMidenSDKInstance();
    
    let jsonString: string;
    
    // Handle different input formats
    if (typeof storeDump === 'string') {
      jsonString = storeDump;
    } else {
      try {
        jsonString = new TextDecoder().decode(storeDump);
      } catch (decodeError) {
        console.error('Error decoding file data:', decodeError);
        return {
          success: false,
          error: 'Invalid file format. Expected a JSON text file.'
        };
      }
    }
    
    // Validate JSON format
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let parsedData: any;
    try {
      parsedData = JSON.parse(jsonString);
    } catch (jsonError) {
      console.error('Invalid JSON format:', jsonError);
      return {
        success: false,
        error: 'Invalid JSON format. Please check the file content.'
      };
    }
    
    // Check if this is a wallet backup file (MidenInfo format)
    if (parsedData && typeof parsedData === 'object') {
      // Check for wallet-specific fields
      if (parsedData.aliceId || parsedData.faucetId || parsedData.aliceMidenAddress) {
        console.log('Detected wallet backup format, not store data');
        return {
          success: false,
          error: 'This appears to be a wallet backup file, not store data. Use "Import Wallet" instead.'
        };
      }
      
      // Check if it's a valid store export format
      // Store exports should have specific structure, not just any JSON
      if (!parsedData.accounts && !parsedData.notes && !parsedData.assets) {
        console.log('Data does not appear to be valid store export format');
        return {
          success: false,
          error: 'Invalid store export format. This file does not contain valid Miden store data.'
        };
      }
    }
    
    console.log('Attempting to import store data...');
    const result = await webClient.forceImportStore(jsonString);
    
    return {
      success: true,
      accountId: result.toString()
    };
    
  } catch (error) {
    console.error('Error importing store:', error);
    
    // Provide more specific error messages based on error type
    let errorMessage = 'Unknown error occurred';
    
    if (error instanceof Error) {
      const errorStr = error.message;
      
      if (errorStr.includes('InvalidTableError')) {
        errorMessage = 'Invalid store data format. The file does not contain valid Miden store structure.';
      } else if (errorStr.includes('database-related')) {
        errorMessage = 'Database error occurred. The store data format is incompatible.';
      } else if (errorStr.includes('Table timestamp does not exist')) {
        errorMessage = 'Invalid store format. This file is not a valid Miden store export.';
      } else {
        errorMessage = errorStr;
      }
    }
    
    return {
      success: false,
      error: errorMessage
    };
  }
}

/**
 * Get wallet data from Miden SDK and save to localStorage after import
 * This function should be called after a successful importStore operation
 * @returns Promise<boolean> - true if wallet data was found and saved
 */
export async function loadWalletDataAfterImport(): Promise<boolean> {
  try {
    ensureClientSide();
    const webClient = await getMidenSDKInstance();
    
    // Try to get account IDs from the imported store
    // We'll need to check what accounts are available
    console.log('Attempting to load wallet data after import...');
    
    // For now, let's try to get the first available account
    // This is a simplified approach - in a real scenario, you might want to
    // parse the imported data to get specific account IDs
    try {
      // Try to get some basic info from the SDK
      // This is experimental and may need adjustment based on actual SDK capabilities
      console.log('Checking if wallet data is available in Miden SDK...');
      
      // Since we can't directly query account IDs without knowing them,
      // we'll return false and let the calling code handle it
      // The wallet data should be available in localStorage if it was properly exported
      
      return false;
    } catch (error) {
      console.error('Error checking Miden SDK for wallet data:', error);
      return false;
    }
    
  } catch (error) {
    console.error('Error in loadWalletDataAfterImport:', error);
    return false;
  }
}

/**
 * Import wallet with private keys using importAccount method
 * This is more secure than just importing wallet metadata
 * @param accountBytes - The exported account bytes containing private keys
 * @returns ImportResult with success status or error
 */
export async function importWalletWithPrivateKeys(accountBytes: Uint8Array): Promise<ImportResult> {
  try {
    ensureClientSide();
    const webClient = await getMidenSDKInstance();
    
    console.log('Importing wallet with private keys...');
    
    // Import the account using the secure importAccount method
    const result = await webClient.importAccount(accountBytes);
    
    console.log('Account imported successfully:', result);
    
    return {
      success: true,
      accountId: result.toString()
    };
    
  } catch (error) {
    console.error('Error importing wallet with private keys:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Export wallet with private keys using exportAccount method
 * This exports the complete account data including private keys
 * @param accountId - The account ID to export
 * @returns ExportResult with account bytes or error
 */
export async function exportWalletWithPrivateKeys(accountId: string): Promise<ExportResult> {
  try {
    ensureClientSide();
    const webClient = await getMidenSDKInstance();
    
    console.log('Exporting wallet with private keys for account:', accountId);
    
    // Export the account using the secure exportAccount method
    const accountBytes = await webClient.exportAccount(accountId);
    
    if (!accountBytes) {
      return {
        success: false,
        error: 'Failed to export account data'
      };
    }
    
    return {
      success: true,
      data: accountBytes
    };
    
  } catch (error) {
    console.error('Error exporting wallet with private keys:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Import wallet backup file safely (wallet metadata only)
 * This function does not affect the Miden store database
 * @param walletData - The wallet data to import
 * @returns ImportResult with success status or error
 */
export async function importWalletBackup(walletData: MidenInfo): Promise<ImportResult> {
  try {
    console.log('Importing wallet backup data:', walletData);
    
    // Validate wallet data structure
    if (!walletData.aliceId && !walletData.faucetId) {
      return {
        success: false,
        error: 'Invalid wallet data. Missing required account information.'
      };
    }
    
    // This function only handles wallet metadata import
    // It doesn't interact with the Miden store database
    // The actual wallet data will be saved to localStorage by the calling function
    
    return {
      success: true,
      accountId: walletData.aliceId || walletData.faucetId || 'unknown'
    };
    
  } catch (error) {
    console.error('Error importing wallet backup:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Download data as a file
 * @param data - The data to download
 * @param filename - The filename for the download
 * @param mimeType - The MIME type for the file
 */
export function downloadFile(data: Uint8Array | ArrayBuffer, filename: string, mimeType: string = 'application/octet-stream') {
  try {
    const blob = new Blob([data as BlobPart], { type: mimeType });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading file:', error);
    throw error;
  }
}

/**
 * Download text data as a file (for JSON exports)
 * @param text - The text data to download
 * @param filename - The filename for the download
 * @param mimeType - The MIME type for the file (defaults to application/json)
 */
export function downloadTextFile(text: string, filename: string, mimeType: string = 'application/json') {
  try {
    const blob = new Blob([text], { type: mimeType });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading text file:', error);
    throw error;
  }
}

/**
 * Read file from input element as text
 * @param file - The file from input element
 * @returns Promise with file data as string
 */
export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to read file as text'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsText(file);
  });
}

/**
 * Read file from input element as bytes
 * @param file - The file from input element
 * @returns Promise with file data as Uint8Array
 */
export function readFileAsBytes(file: File): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) {
        resolve(new Uint8Array(reader.result));
      } else {
        reject(new Error('Failed to read file as ArrayBuffer'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsArrayBuffer(file);
  });
}
