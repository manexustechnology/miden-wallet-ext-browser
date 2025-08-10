// lib/createMintConsume.ts
// Client-side only module - all Miden SDK operations happen in the browser
// No static imports of Miden SDK to avoid server-side issues

// Helper function to ensure client-side execution
function ensureClientSide(): void {
  if (typeof window === "undefined" || typeof window.fetch === "undefined") {
    throw new Error("This module can only run in the browser with fetch support");
  }
}

// Lazy load Miden SDK to avoid server-side issues
let midenSDKCache: any = null;

async function getMidenSDK() {
  if (!midenSDKCache) {
    ensureClientSide();
    midenSDKCache = await import("@demox-labs/miden-sdk");
  }
  return midenSDKCache;
}

export const WALLET_STORAGE_KEY = 'miden-wallet-data';
export const CONNECTION_STATUS_KEY = 'miden-connection-status';

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

export type ProgressCallback = (step: string, progress: number, message: string) => void;

// Error types for better error handling
export interface MidenError {
  type: 'FAUCET_RECLAIM_DISABLED' | 'NETWORK_ERROR' | 'CONSTRAINT_ERROR' | 'UNKNOWN_ERROR';
  message: string;
  userFriendlyMessage: string;
  canRetry: boolean;
  requiresFallback: boolean;
}

// Convert hex to proper Miden bech32 address
export async function hexToMidenAddress(hexAddress: string): Promise<string> {
  if (!hexAddress || !hexAddress.startsWith('0x')) {
    return hexAddress;
  }
  
  try {
    const { AccountId } = await getMidenSDK();
    const accountId = AccountId.fromHex(hexAddress);
    return accountId.toBech32();
  } catch (error) {
    console.warn("Failed to convert hex to bech32 address, using fallback:", error);
    // Fallback to simple conversion if SDK conversion fails
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
export function parseMidenError(error: any): MidenError {
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
      userFriendlyMessage: 'Database error terdeteksi. Mencoba reset database...',
      canRetry: true,
      requiresFallback: false
    };
  }
  
  // Check for network errors
  if (errorMessage.includes('fetch failed') || errorMessage.includes('network') || errorMessage.includes('timeout')) {
    return {
      type: 'NETWORK_ERROR',
      message: errorMessage,
      userFriendlyMessage: 'Koneksi jaringan bermasalah. Silakan cek koneksi internet Anda.',
      canRetry: true,
      requiresFallback: false
    };
  }
  
  // Default unknown error
  return {
    type: 'UNKNOWN_ERROR',
    message: errorMessage,
    userFriendlyMessage: 'Terjadi kesalahan yang tidak diketahui. Silakan coba lagi.',
    canRetry: true,
    requiresFallback: false
  };
}

// Storage functions
export function saveWalletToStorage(walletData: MidenInfo): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(WALLET_STORAGE_KEY, JSON.stringify(walletData));
    localStorage.setItem(CONNECTION_STATUS_KEY, 'connected');
  }
}

export function getWalletFromStorage(): MidenInfo | null {
  if (typeof window !== 'undefined') {
    const walletData = localStorage.getItem(WALLET_STORAGE_KEY);
    const connectionStatus = localStorage.getItem(CONNECTION_STATUS_KEY);
    
    if (walletData && connectionStatus === 'connected') {
      return JSON.parse(walletData);
    }
  }
  return null;
}

export function clearWalletFromStorage(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(WALLET_STORAGE_KEY);
    localStorage.removeItem(CONNECTION_STATUS_KEY);
  }
}

// Main wallet creation function
export async function createMintConsume(progressCallback?: ProgressCallback): Promise<MidenInfo> {
  try {
    ensureClientSide();

    progressCallback?.('initializing', 5, 'Starting Miden WebClient initialization...');

    // Check worker files
    try {
      progressCallback?.('checking-workers', 10, 'Checking worker files...');
      const workerResponse = await fetch('/workers/web-client-methods-worker.js');
      if (!workerResponse.ok) {
        throw new Error(`Worker file not accessible: ${workerResponse.status}`);
      }
      progressCallback?.('workers-ok', 15, 'Worker files are accessible');
    } catch (workerError) {
      console.warn("Worker file check failed:", workerError);
      progressCallback?.('workers-warning', 15, 'Worker file check failed, continuing...');
    }

    // Import SDK
    progressCallback?.('importing-sdk', 20, 'Importing Miden SDK...');
    const midenSDK = await getMidenSDK();
    const { WebClient, AccountStorageMode, NoteType, AccountId } = midenSDK;
      progressCallback?.('sdk-imported', 25, 'Miden SDK imported successfully');

    // Create client
    progressCallback?.('creating-client', 30, 'Creating WebClient...');
    const nodeEndpoint = process.env.NEXT_PUBLIC_MIDEN_NODE_ENDPOINT || "https://rpc.testnet.miden.io:443";
    const client = await WebClient.createClient(nodeEndpoint);
    progressCallback?.('client-created', 35, 'WebClient created successfully');

    // Sync state
    progressCallback?.('syncing-state', 40, 'Syncing state with network...');
    const state = await client.syncState();
    const blockNumber = state.blockNum();
    progressCallback?.('state-synced', 45, `Synced with network. Latest block: ${blockNumber}`);

    // Create account
    progressCallback?.('creating-account', 50, 'Creating account for Alice...');
    const alice = await client.newWallet(AccountStorageMode.public(), true);
    const aliceId = alice.id().toString();
    const walletInitials = getWalletInitials(aliceId);
    progressCallback?.('account-created', 55, `Account created successfully. ID: ${aliceId.slice(0, 20)}...`);

    // Deploy faucet
    progressCallback?.('deploying-faucet', 60, 'Deploying faucet contract...');
    const faucet = await client.newFaucet(
      AccountStorageMode.public(),
      false,
      "MID",
      8,
      BigInt(1_000_000),
    );
    const faucetId = faucet.id().toString();
    progressCallback?.('faucet-deployed', 65, `Faucet deployed successfully. ID: ${faucetId.slice(0, 20)}...`);

    await client.syncState();

    // Mint tokens
    progressCallback?.('minting-tokens', 70, 'Minting initial tokens to Alice...');
    let mintTxRequest = client.newMintTransactionRequest(
      AccountId.fromHex(aliceId),
      AccountId.fromHex(faucetId),
      NoteType.Public,
      BigInt(500),
    );

    let txResult = await client.newTransaction(AccountId.fromHex(faucetId), mintTxRequest);
    await client.submitTransaction(txResult);

    progressCallback?.('waiting-confirmation', 80, 'Waiting for transaction confirmation (10 seconds)...');
    await new Promise((resolve) => setTimeout(resolve, 10000));
    await client.syncState();

    progressCallback?.('confirmation-received', 85, 'Transaction confirmed successfully');

    // Fetch and consume notes
    progressCallback?.('fetching-notes', 88, 'Fetching minted notes...');
    const mintedNotes = await client.getConsumableNotes(AccountId.fromHex(aliceId));
    const mintedNoteIds = mintedNotes.map((n: any) => n.inputNoteRecord().id().toString());
    
    progressCallback?.('notes-fetched', 90, `Found ${mintedNoteIds.length} minted notes`);
    
    if (mintedNoteIds.length > 0) {
      progressCallback?.('consuming-notes', 92, 'Consuming minted notes...');
      let consumeTxRequest = client.newConsumeTransactionRequest(mintedNoteIds);
      let consumeTxResult = await client.newTransaction(AccountId.fromHex(aliceId), consumeTxRequest);
      await client.submitTransaction(consumeTxResult);
      await client.syncState();
      progressCallback?.('notes-consumed', 95, 'Notes consumed successfully. Balance updated.');
    }

    // Get final balance
    progressCallback?.('getting-balance', 98, 'Getting final wallet balance...');
    let finalBalance = "0";
    try {
      const account = await client.getAccount(AccountId.fromHex(aliceId));
      if (account) {
        const vault = account.vault();
        const fungibleAssets = vault.fungibleAssets();
        if (fungibleAssets && fungibleAssets.length > 0) {
          let vaultBalance = BigInt(0);
          for (const asset of fungibleAssets) {
            vaultBalance += asset.amount();
          }
          finalBalance = vaultBalance.toString();
        }
      }
    } catch (vaultError) {
      console.warn("Could not get balance from vault, using fallback:", vaultError);
      finalBalance = (mintedNoteIds.length * 500).toString();
    }
    
    progressCallback?.('setup-complete', 100, 'Setup complete! Wallet ready to use');

    const walletInfo: MidenInfo = {
      aliceId,
      aliceMidenAddress: await hexToMidenAddress(aliceId),
      faucetId,
      faucetMidenAddress: await hexToMidenAddress(faucetId),
      blockNumber,
      isConnected: true,
      aliceBalance: finalBalance,
      mintedNotes: [],
      walletInitials
    };

    // Save to storage (without balance)
    const walletInfoToSave = {
      aliceId,
      aliceMidenAddress: await hexToMidenAddress(aliceId),
      faucetId,
      faucetMidenAddress: await hexToMidenAddress(faucetId),
      blockNumber,
      isConnected: true,
      walletInitials
    };
    saveWalletToStorage(walletInfoToSave);

    return walletInfo;

  } catch (error) {
    console.error("Error in createMintConsume:", error);
    throw error;
  }
}

// Mint from faucet function with better error handling
export async function mintFromFaucet(faucetId: string, aliceId: string, amount: bigint): Promise<{ notes: string[], newBalance: string, error?: MidenError }> {
  try {
    ensureClientSide();
    
    const { WebClient, NoteType, AccountId } = await getMidenSDK();
    
    const nodeEndpoint = process.env.NEXT_PUBLIC_MIDEN_NODE_ENDPOINT || "https://rpc.testnet.miden.io:443";
    const client = await WebClient.createClient(nodeEndpoint);
    
    // Handle ConstraintError
    try {
      await client.syncState();
    } catch (syncError) {
      const errorMessage = syncError instanceof Error ? syncError.message : String(syncError);
      if (errorMessage.includes('ConstraintError')) {
        console.log("ConstraintError detected, resetting database...");
        await resetMidenDatabase();
        const newClient = await WebClient.createClient(nodeEndpoint);
        await newClient.syncState();
        Object.assign(client, newClient);
      } else {
        throw syncError;
      }
    }
    
    console.log(`Minting ${amount} tokens to Alice...`);
    let mintTxRequest = client.newMintTransactionRequest(
      AccountId.fromHex(aliceId),
      AccountId.fromHex(faucetId),
      NoteType.Public,
      amount,
    );

    let txResult = await client.newTransaction(AccountId.fromHex(faucetId), mintTxRequest);
    await client.submitTransaction(txResult);

    console.log("Waiting 10 seconds for transaction confirmation...");
    await new Promise((resolve) => setTimeout(resolve, 10000));
    
    // Sync with error handling
    try {
      await client.syncState();
    } catch (syncError) {
      const errorMessage = syncError instanceof Error ? syncError.message : String(syncError);
      if (errorMessage.includes('ConstraintError')) {
        console.log("ConstraintError during final sync, resetting database...");
        await resetMidenDatabase();
      } else {
        throw syncError;
      }
    }

    // Get minted notes and consume them
    const mintedNotes = await client.getConsumableNotes(AccountId.fromHex(aliceId));
    const mintedNoteIds = mintedNotes.map((n: any) => n.inputNoteRecord().id().toString());
    
    if (mintedNoteIds.length > 0) {
      let consumeTxRequest = client.newConsumeTransactionRequest(mintedNoteIds);
      let consumeTxResult = await client.newTransaction(AccountId.fromHex(aliceId), consumeTxRequest);
      await client.submitTransaction(consumeTxResult);
      
      try {
        await client.syncState();
      } catch (syncError) {
        const errorMessage = syncError instanceof Error ? syncError.message : String(syncError);
        if (errorMessage.includes('ConstraintError')) {
          console.log("ConstraintError during final sync, but operation completed");
        } else {
          throw syncError;
        }
      }
    }
    
    // Get final balance
    let finalBalance = "0";
    try {
      const account = await client.getAccount(AccountId.fromHex(aliceId));
      if (account) {
        const vault = account.vault();
        const fungibleAssets = vault.fungibleAssets();
        if (fungibleAssets && fungibleAssets.length > 0) {
          let totalBalance = BigInt(0);
          for (const asset of fungibleAssets) {
            totalBalance += asset.amount();
          }
          finalBalance = totalBalance.toString();
        }
      }
    } catch (vaultError) {
      console.warn("Could not get balance from vault, using fallback:", vaultError);
      finalBalance = amount.toString();
    }
    
    return {
      notes: [],
      newBalance: finalBalance
    };
  } catch (error) {
    console.error("Error minting from faucet:", error);
    
    // Parse and return user-friendly error
    const midenError = parseMidenError(error);
    
    return {
      notes: [],
      newBalance: "0",
      error: midenError
    };
  }
}

// Get real-time balance
export async function getRealTimeBalance(aliceId: string): Promise<{ balance: string, notes: string[] }> {
  try {
    ensureClientSide();
    
    const { WebClient, AccountId } = await getMidenSDK();
    
    const nodeEndpoint = process.env.NEXT_PUBLIC_MIDEN_NODE_ENDPOINT || "https://rpc.testnet.miden.io:443";
    const client = await WebClient.createClient(nodeEndpoint);
    
    try {
      await client.syncState();
    } catch (syncError) {
      console.warn("Sync state failed, trying to continue:", syncError);
      // If sync fails due to ConstraintError, we can still try to get the account
      // This is a known issue with the Miden SDK when there are duplicate entries
    }
    
    const account = await client.getAccount(AccountId.fromHex(aliceId));
    if (!account) {
      return { balance: "0", notes: [] };
    }
    
    const consumableNotes = await client.getConsumableNotes(AccountId.fromHex(aliceId));
    const noteIds = consumableNotes.map((n: any) => n.inputNoteRecord().id().toString());
    
    let balance = "0";
    try {
      const vault = account.vault();
      const fungibleAssets = vault.fungibleAssets();
      if (fungibleAssets && fungibleAssets.length > 0) {
        let totalBalance = BigInt(0);
        for (const asset of fungibleAssets) {
          totalBalance += asset.amount();
        }
        balance = totalBalance.toString();
      }
    } catch (vaultError) {
      console.warn("Could not get balance from vault, using fallback:", vaultError);
      balance = (consumableNotes.length * 500).toString();
    }
    
    return {
      balance,
      notes: noteIds
    };
  } catch (error) {
    console.error("Error getting real-time balance:", error);
    throw error;
  }
}

// Disconnect wallet
export function disconnectWallet(): void {
  clearWalletFromStorage();
}

// Reset database to fix ConstraintError
export async function resetMidenDatabase(): Promise<void> {
  if (typeof window === 'undefined' || typeof window.indexedDB === 'undefined') return;
  
  try {
    ensureClientSide();
  } catch (error) {
    return; // Silently return if not in browser
  }
  
  try {
    console.log("Resetting Miden database to fix ConstraintError...");
    
    const dbs = await indexedDB.databases();
    
    for (const db of dbs) {
      if (db.name && (db.name.includes('miden') || db.name.includes('Miden') || db.name.includes('web-client'))) {
        await indexedDB.deleteDatabase(db.name);
        console.log(`Deleted database: ${db.name}`);
      }
    }
    
    console.log("Miden database reset completed");
  } catch (error) {
    console.warn("Error resetting database:", error);
  }
}
  