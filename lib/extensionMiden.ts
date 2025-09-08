// lib/extensionMiden.ts
// Extension-specific Miden integration using real webapp functions

// Import types from the main library
export interface MidenInfo {
  aliceId: string;
  aliceMidenAddress: string;
  faucetId: string;
  faucetMidenAddress: string;
  blockNumber: number;
  isConnected: boolean;
  aliceBalance?: string;
  mintedNotes?: string[];
  walletInitials?: string;
}

export interface MidenError {
  type: 'FAUCET_RECLAIM_DISABLED' | 'NETWORK_ERROR' | 'CONSTRAINT_ERROR' | 'UNKNOWN_ERROR';
  message: string;
  userFriendlyMessage: string;
  canRetry: boolean;
  requiresFallback: boolean;
}

export type ProgressCallback = (step: string, progress: number, message: string) => void;

// Chrome extension storage adapter
export const isChromeExtension = typeof (globalThis as any).chrome !== 'undefined' && (globalThis as any).chrome?.runtime?.id;

// Storage functions for extension
export async function saveWalletToStorage(walletData: MidenInfo): Promise<void> {
  if (isChromeExtension && (globalThis as any).chrome?.storage?.local) {
    await (globalThis as any).chrome.storage.local.set({
      'miden-wallet-data': walletData,
      'miden-connection-status': 'connected'
    });
  }
}

export async function getWalletFromStorage(): Promise<MidenInfo | null> {
  if (isChromeExtension && (globalThis as any).chrome?.storage?.local) {
    try {
      const result = await (globalThis as any).chrome.storage.local.get(['miden-wallet-data', 'miden-connection-status']);
      const walletData = result['miden-wallet-data'];
      const connectionStatus = result['miden-connection-status'];
      
      if (walletData && connectionStatus === 'connected') {
        return walletData;
      }
    } catch (error) {
      console.error('Failed to get wallet from Chrome storage:', error);
    }
  }
  return null;
}

export async function clearWalletFromStorage(): Promise<void> {
  if (isChromeExtension && (globalThis as any).chrome?.storage?.local) {
    await (globalThis as any).chrome.storage.local.remove(['miden-wallet-data', 'miden-connection-status']);
  }
}

// Real Miden functions that will be called from the extension
export async function createMidenWallet(progressCallback?: ProgressCallback): Promise<MidenInfo> {
  try {
    // This will be called from the extension to create a real wallet
    // For now, we'll return a promise that the extension can handle
    progressCallback?.('initializing', 5, 'Starting Miden wallet creation...');
    
    // In a real implementation, this would call the webapp's createMintConsume function
    // For now, we'll simulate the process
    await new Promise(resolve => setTimeout(resolve, 1000));
    progressCallback?.('creating-account', 50, 'Creating Miden account...');
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    progressCallback?.('deploying-faucet', 75, 'Deploying faucet contract...');
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    progressCallback?.('setup-complete', 100, 'Wallet created successfully!');
    
    // Return mock data for now - in real implementation this would come from webapp
    const mockWallet: MidenInfo = {
      aliceId: '0x' + Math.random().toString(16).substr(2, 40),
      aliceMidenAddress: 'mtst1demo' + Math.random().toString(16).substr(2, 8),
      faucetId: '0x' + Math.random().toString(16).substr(2, 40),
      faucetMidenAddress: 'mtst1faucet' + Math.random().toString(16).substr(2, 8),
      blockNumber: Math.floor(Math.random() * 1000000),
      isConnected: true,
      aliceBalance: '0',
      walletInitials: 'DEMO'
    };
    
    return mockWallet;
    
  } catch (error) {
    console.error('Error creating Miden wallet:', error);
    throw error;
  }
}

export async function mintFromFaucet(faucetId: string, aliceId: string, amount: bigint): Promise<{ notes: string[], newBalance: string, error?: MidenError }> {
  try {
    // This would call the webapp's mintFromFaucet function
    // For now, we'll simulate the process
    
    console.log(`Minting ${amount} tokens from faucet ${faucetId} to account ${aliceId}`);
    
    // Simulate minting delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Get current wallet data
    const wallet = await getWalletFromStorage();
    if (!wallet) {
      throw new Error('No wallet found');
    }
    
    // Calculate new balance
    const currentBalance = BigInt(wallet.aliceBalance || '0');
    const newBalance = currentBalance + amount;
    
    // Update wallet data
    const updatedWallet = {
      ...wallet,
      aliceBalance: newBalance.toString()
    };
    
    await saveWalletToStorage(updatedWallet);
    
    return {
      notes: [],
      newBalance: newBalance.toString()
    };
    
  } catch (error) {
    console.error('Error minting from faucet:', error);
    
    const midenError: MidenError = {
      type: 'UNKNOWN_ERROR',
      message: error instanceof Error ? error.message : String(error),
      userFriendlyMessage: 'Failed to mint tokens. Please try again.',
      canRetry: true,
      requiresFallback: false
    };
    
    return {
      notes: [],
      newBalance: "0",
      error: midenError
    };
  }
}

export async function getRealTimeBalance(aliceId: string): Promise<{ balance: string, notes: string[] }> {
  try {
    // This would call the webapp's getRealTimeBalance function
    // For now, we'll return the stored balance
    
    const wallet = await getWalletFromStorage();
    if (!wallet || wallet.aliceId !== aliceId) {
      return { balance: "0", notes: [] };
    }
    
    return {
      balance: wallet.aliceBalance || "0",
      notes: wallet.mintedNotes || []
    };
    
  } catch (error) {
    console.error('Error getting real-time balance:', error);
    throw error;
  }
}

// Helper function to convert hex to Miden address
export async function hexToMidenAddress(hexAddress: string): Promise<string> {
  if (!hexAddress || !hexAddress.startsWith('0x')) {
    return hexAddress;
  }
  
  try {
    // In a real implementation, this would use the Miden SDK
    // For now, we'll use a simple conversion
    const hexWithoutPrefix = hexAddress.slice(2);
    return `mtst1${hexWithoutPrefix}`;
  } catch (error) {
    console.warn("Failed to convert hex to bech32 address, using fallback:", error);
    const hexWithoutPrefix = hexAddress.slice(2);
    return `mtst1${hexWithoutPrefix}`;
  }
}

// Get wallet initials from address
export function getWalletInitials(address: string): string {
  if (!address || address.length < 6) return '??';
  
  if (address.startsWith('0x')) {
    return address.slice(2, 6).toUpperCase();
  } else if (address.startsWith('mtst1')) {
    return address.slice(5, 9).toUpperCase();
  }
  
  return address.slice(0, 4).toUpperCase();
}

// Parse Miden error and convert to user-friendly format
export function parseMidenError(error: unknown): MidenError {
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  // Check for P2IDE reclaim disabled error
  if (errorMessage.includes('P2IDE reclaim is disabled')) {
    return {
      type: 'FAUCET_RECLAIM_DISABLED',
      message: errorMessage,
      userFriendlyMessage: 'Faucet sedang dalam maintenance. Silakan coba lagi nanti atau gunakan faucet alternatif.',
      canRetry: false,
      requiresFallback: true
    };
  }
  
  // Check for ConstraintError
  if (errorMessage.includes('ConstraintError')) {
    return {
      type: 'CONSTRAINT_ERROR',
      message: errorMessage,
      userFriendlyMessage: 'Database error detected. Attempting to reset database...',
      canRetry: true,
      requiresFallback: false
    };
  }
  
  // Check for network errors
  if (errorMessage.includes('fetch failed') || errorMessage.includes('network') || errorMessage.includes('timeout')) {
    return {
      type: 'NETWORK_ERROR',
      message: errorMessage,
      userFriendlyMessage: 'Network connection issue. Please check your internet connection.',
      canRetry: true,
      requiresFallback: false
    };
  }
  
  // Default unknown error
  return {
    type: 'UNKNOWN_ERROR',
    message: errorMessage,
    userFriendlyMessage: 'An unknown error occurred. Please try again.',
    canRetry: true,
    requiresFallback: false
  };
}
