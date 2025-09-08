// Background script for Miden Wallet Extension
// This script handles all messages and manages the extension state

console.log('🚀 MIDEN WALLET BACKGROUND SCRIPT STARTING...');
console.log('⏰ Timestamp:', new Date().toISOString());
console.log('🔧 Extension ID:', chrome.runtime.id);
console.log('📦 Extension URL:', chrome.runtime.getURL(''));

// Simple interfaces for service worker environment
interface MidenInfo {
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

interface CreateWalletMessage { type: 'CREATE_REAL_MIDEN_WALLET_WEBAPP'; }
interface MintMessage { type: 'MINT_FROM_FAUCET_WEBAPP'; amount: string; faucetId: string; accountId: string; }
interface BalanceMessage { type: 'GET_REAL_TIME_BALANCE_WEBAPP'; accountId: string; }
interface WalletInfoMessage { type: 'GET_WALLET_INFO'; }
interface SaveWalletMessage { type: 'SAVE_WALLET'; wallet?: MidenInfo; }
interface ConnectNetworkMessage { type: 'CONNECT_TO_MIDEN_NETWORK'; }
interface GetBalanceMessage { type: 'GET_REAL_TIME_BALANCE'; address: string; }
interface CreateTransactionMessage { type: 'CREATE_MIDEN_TRANSACTION'; fromAddress: string; toAddress: string; amount: number; note?: string; }
interface GetTxStatusMessage { type: 'GET_TRANSACTION_STATUS'; txHash: string; }

// New message types for frontend integration
interface ConnectWalletMessage { type: 'CONNECT_MIDEN_WALLET'; }
interface DisconnectWalletMessage { type: 'DISCONNECT_MIDEN_WALLET'; }
interface ReconnectWalletMessage { type: 'RECONNECT_MIDEN_WALLET'; }
interface GetAccountInfoMessage { type: 'GET_MIDEN_ACCOUNT_INFO'; address: string; }
interface SendPaymentMessage { type: 'SEND_MIDEN_PAYMENT'; senderAddress: string; receiverAddress: string; amount: number; note?: string; }
interface SignTransactionMessage { type: 'SIGN_MIDEN_TRANSACTION'; transaction: any; }

// New message types for content script communication
interface MidenWalletConnectMessage { type: 'MIDEN_WALLET_CONNECT'; }
interface MidenWalletDisconnectMessage { type: 'MIDEN_WALLET_DISCONNECT'; }
interface MidenWalletGetInfoMessage { type: 'MIDEN_WALLET_GET_INFO'; }
interface MidenWalletGetBalanceMessage { type: 'MIDEN_WALLET_GET_BALANCE'; address: string; }
interface MidenWalletSendPaymentMessage { type: 'MIDEN_WALLET_SEND_PAYMENT'; fromAddress: string; toAddress: string; amount: number; note?: string; }

// Simple content script message types
interface SimpleConnectMessage { type: 'MIDEN_SIMPLE_CONNECT'; }
interface SimpleDisconnectMessage { type: 'MIDEN_SIMPLE_DISCONNECT'; }
interface SimpleGetInfoMessage { type: 'MIDEN_SIMPLE_GET_INFO'; }
interface SimpleGetBalanceMessage { type: 'MIDEN_SIMPLE_GET_BALANCE'; address: string; }
interface SimpleGetStorageMessage { type: 'MIDEN_SIMPLE_GET_STORAGE'; }
interface SimpleTestMessage { type: 'MIDEN_SIMPLE_TEST'; }

// Test message type
interface TestMessage { type: 'TEST_MESSAGE'; }

type ExtensionMessage = CreateWalletMessage | MintMessage | BalanceMessage | WalletInfoMessage | SaveWalletMessage | ConnectNetworkMessage | GetBalanceMessage | CreateTransactionMessage | GetTxStatusMessage | ConnectWalletMessage | DisconnectWalletMessage | ReconnectWalletMessage | GetAccountInfoMessage | SendPaymentMessage | SignTransactionMessage | MidenWalletConnectMessage | MidenWalletDisconnectMessage | MidenWalletGetInfoMessage | MidenWalletGetBalanceMessage | MidenWalletSendPaymentMessage | SimpleConnectMessage | SimpleDisconnectMessage | SimpleGetInfoMessage | SimpleGetBalanceMessage | SimpleGetStorageMessage | SimpleTestMessage | TestMessage;

// Service worker compatible message handling - SINGLE LISTENER
chrome.runtime.onMessage.addListener((request: ExtensionMessage, sender, sendResponse) => {
  console.log('📨 Background script received message:', request);
  console.log('👤 Sender:', sender);
  
  // Handle messages asynchronously
  (async () => {
    try {
      switch (request.type) {
        case 'GET_WALLET_INFO': 
          await handleGetWalletInfo(request, sendResponse); 
          break;
        case 'SAVE_WALLET': 
          await handleSaveWallet(request, sendResponse); 
          break;
        case 'CREATE_REAL_MIDEN_WALLET_WEBAPP': 
          await handleCreateRealMidenWalletWebapp(request, sendResponse); 
          break;
        case 'MINT_FROM_FAUCET_WEBAPP': 
          await handleMintFromFaucetWebapp(request, sendResponse); 
          break;
        case 'GET_REAL_TIME_BALANCE_WEBAPP': 
          await handleGetRealTimeBalanceWebapp(request, sendResponse); 
          break;
        case 'CONNECT_TO_MIDEN_NETWORK':
          await handleConnectToMidenNetwork(request, sendResponse);
          break;
        case 'GET_REAL_TIME_BALANCE':
          await handleGetRealTimeBalance(request, sendResponse);
          break;
        case 'CREATE_MIDEN_TRANSACTION':
          await handleCreateMidenTransaction(request, sendResponse);
          break;
        case 'GET_TRANSACTION_STATUS':
          await handleGetTransactionStatus(request, sendResponse);
          break;
        // New message handlers for frontend integration
        case 'CONNECT_MIDEN_WALLET':
          await handleConnectMidenWallet(request, sendResponse);
          break;
        case 'DISCONNECT_MIDEN_WALLET':
          await handleDisconnectMidenWallet(request, sendResponse);
          break;
        case 'RECONNECT_MIDEN_WALLET':
          await handleReconnectMidenWallet(request, sendResponse);
          break;
        case 'GET_MIDEN_ACCOUNT_INFO':
          await handleGetMidenAccountInfo(request, sendResponse);
          break;
        case 'SEND_MIDEN_PAYMENT':
          await handleSendMidenPayment(request, sendResponse);
          break;
        case 'SIGN_MIDEN_TRANSACTION':
          await handleSignMidenTransaction(request, sendResponse);
          break;
        // New message handlers for content script communication
        case 'MIDEN_WALLET_CONNECT':
          await handleMidenWalletConnect(request, sendResponse);
          break;
        case 'MIDEN_WALLET_DISCONNECT':
          await handleMidenWalletDisconnect(request, sendResponse);
          break;
        case 'MIDEN_WALLET_GET_INFO':
          await handleMidenWalletGetInfo(request, sendResponse);
          break;
        case 'MIDEN_WALLET_GET_BALANCE':
          await handleMidenWalletGetBalance(request, sendResponse);
          break;
        case 'MIDEN_WALLET_SEND_PAYMENT':
          await handleMidenWalletSendPayment(request, sendResponse);
          break;
        // Simple content script message handlers
        case 'MIDEN_SIMPLE_CONNECT':
          await handleSimpleConnect(request, sendResponse);
          break;
        case 'MIDEN_SIMPLE_DISCONNECT':
          await handleSimpleDisconnect(request, sendResponse);
          break;
        case 'MIDEN_SIMPLE_GET_INFO':
          await handleSimpleGetInfo(request, sendResponse);
          break;
        case 'MIDEN_SIMPLE_GET_BALANCE':
          await handleSimpleGetBalance(request, sendResponse);
          break;
        case 'MIDEN_SIMPLE_GET_STORAGE':
          await handleSimpleGetStorage(request, sendResponse);
          break;
        case 'MIDEN_SIMPLE_TEST':
          await handleSimpleTest(request, sendResponse);
          break;
        // Test message handler
        case 'TEST_MESSAGE':
          console.log('✅ Test message received, responding...');
          sendResponse({ 
            success: true, 
            message: 'Background script is working!',
            timestamp: new Date().toISOString(),
            extensionId: chrome.runtime.id
          });
          break;
        default: 
          console.error('❌ Unknown message type:', (request as any).type);
          sendResponse({ success: false, error: `Unknown message type: ${(request as any).type}` });
      }
    } catch (error) {
      console.error('❌ Error handling message:', error);
      sendResponse({ success: false, error: 'Internal error occurred' });
    }
  })();
  
  // Return true to indicate async response
  return true;
});

async function handleGetWalletInfo(request: WalletInfoMessage, sendResponse: (response: any) => void) {
  try {
    const result = await chrome.storage.local.get(['miden-wallet-data', 'miden-connection-status']);
    const wallet = result['miden-wallet-data'];
    const connectionStatus = result['miden-connection-status'];
    sendResponse({ success: true, wallet, connectionStatus });
  } catch (error) {
    console.error('Failed to get wallet info:', error);
    sendResponse({ success: false, error: 'Failed to get wallet info' });
  }
}

async function handleSaveWallet(request: SaveWalletMessage, sendResponse: (response: any) => void) {
  try {
    if (request.wallet) {
      await chrome.storage.local.set({ 'miden-wallet-data': request.wallet });
      sendResponse({ success: true, message: 'Wallet created successfully' });
    } else {
      await chrome.storage.local.remove(['miden-wallet-data', 'miden-connection-status']);
      sendResponse({ success: true, message: 'Wallet removed successfully' });
    }
  } catch (error) {
    console.error('Failed to save wallet:', error);
    sendResponse({ success: false, error: 'Failed to save wallet' });
  }
}

async function handleCreateRealMidenWalletWebapp(request: CreateWalletMessage, sendResponse: (response: any) => void) {
  try {
    console.log('Creating REAL Miden wallet...');
    
    // For service worker environment, we need to delegate to popup script
    // The popup script will handle the real Miden SDK operations
    // and then call SAVE_WALLET to store the result
    
    // Send response indicating that popup should handle this
    sendResponse({ 
      success: true, 
      message: 'Please complete wallet creation in popup',
      requiresPopupAction: true 
    });
    
    // The popup script will call SAVE_WALLET when wallet is created
  } catch (error) {
    console.error('Failed to create Miden wallet:', error);
    sendResponse({ success: false, error: 'Failed to create Miden wallet' });
  }
}

async function handleMintFromFaucetWebapp(request: MintMessage, sendResponse: (response: any) => void) {
  try {
    const { amount, faucetId, accountId } = request;
    console.log(`Starting REAL minting of ${amount} tokens from Miden faucet ${faucetId} to account ${accountId}`);
    
    // For service worker environment, we need to delegate to popup script
    // The popup script will handle the real Miden SDK operations
    
    // Send response indicating that popup should handle this
    sendResponse({ 
      success: true, 
      message: 'Please complete minting in popup',
      requiresPopupAction: true,
      mintData: { amount, faucetId, accountId }
    });
    
    // The popup script will handle the real minting and update storage
  } catch (error) {
    console.error('Failed to mint from faucet:', error);
    sendResponse({ success: false, error: 'Failed to mint from faucet' });
  }
}

async function handleGetRealTimeBalanceWebapp(request: BalanceMessage, sendResponse: (response: any) => void) {
  try {
    const { accountId } = request;
    console.log(`Getting REAL-TIME balance from Miden blockchain for account ${accountId}`);
    
    // For service worker environment, we need to delegate to popup script
    // The popup script will handle the real Miden SDK operations
    
    // Send response indicating that popup should handle this
    sendResponse({ 
      success: true, 
      message: 'Please complete balance check in popup',
      requiresPopupAction: true,
      balanceData: { accountId }
    });
    
    // The popup script will handle the real balance check and update storage
  } catch (error) {
    console.error('Failed to get balance:', error);
    sendResponse({ success: false, error: 'Failed to get balance' });
  }
}

// New message handlers for enhanced Miden network integration
async function handleConnectToMidenNetwork(request: ConnectNetworkMessage, sendResponse: (response: any) => void) {
  try {
    console.log('Connecting to Miden network...');
    
    // Get existing wallet info from storage
    const result = await chrome.storage.local.get(['miden-wallet-data']);
    const existingWallet = result['miden-wallet-data'];
    
    if (existingWallet && existingWallet.isConnected) {
      // Return existing connected wallet
      sendResponse({ success: true, wallet: existingWallet });
    } else {
      // Delegate to popup for new connection
      sendResponse({ 
        success: true, 
        message: 'Please use popup to connect to Miden network',
        requiresPopup: true 
      });
    }
  } catch (error) {
    console.error('Failed to connect to Miden network:', error);
    sendResponse({ success: false, error: 'Failed to connect to Miden network' });
  }
}

async function handleGetRealTimeBalance(request: GetBalanceMessage, sendResponse: (response: any) => void) {
  try {
    console.log('Getting real-time balance for address:', request.address);
    
    // Get wallet info from storage
    const result = await chrome.storage.local.get(['miden-wallet-data']);
    const wallet = result['miden-wallet-data'];
    
    if (wallet && wallet.aliceMidenAddress === request.address) {
      // Return stored balance (in real implementation, this would query the network)
      const balance = wallet.aliceBalance || '0';
      sendResponse({ success: true, balance });
    } else {
      sendResponse({ success: false, error: 'Address not found in wallet' });
    }
  } catch (error) {
    console.error('Failed to get real-time balance:', error);
    sendResponse({ success: false, error: 'Failed to get balance' });
  }
}

async function handleCreateMidenTransaction(request: CreateTransactionMessage, sendResponse: (response: any) => void) {
  try {
    console.log('Creating Miden transaction:', request);
    
    // Delegate to popup for transaction creation
    sendResponse({ 
      success: true, 
      message: 'Please use popup to create transaction',
      requiresPopup: true,
      transactionData: request
    });
  } catch (error) {
    console.error('Failed to create Miden transaction:', error);
    sendResponse({ success: false, error: 'Failed to create transaction' });
  }
}

async function handleGetTransactionStatus(request: GetTxStatusMessage, sendResponse: (response: any) => void) {
  try {
    console.log('Getting transaction status for:', request.txHash);
    
    // Mock transaction status (in real implementation, this would query the network)
    const mockStatus = {
      status: 'confirmed' as const,
      blockNumber: Math.floor(Math.random() * 1000000) + 1,
      confirmations: 12
    };
    
    sendResponse({ success: true, status: mockStatus });
  } catch (error) {
    console.error('Failed to get transaction status:', error);
    sendResponse({ success: false, error: 'Failed to get transaction status' });
  }
}

// New message handlers for frontend integration
async function handleConnectMidenWallet(request: ConnectWalletMessage, sendResponse: (response: any) => void) {
  try {
    console.log('Connecting to Miden wallet...');
    
    // Get existing wallet info from storage
    const result = await chrome.storage.local.get(['miden-wallet-data']);
    const existingWallet = result['miden-wallet-data'];
    
    if (existingWallet && existingWallet.isConnected) {
      // Return existing connected wallet
      sendResponse({ success: true, wallet: existingWallet });
    } else {
      // Delegate to popup for new connection
      sendResponse({ 
        success: true, 
        message: 'Please use popup to connect to Miden wallet',
        requiresPopup: true 
      });
    }
  } catch (error) {
    console.error('Failed to connect to Miden wallet:', error);
    sendResponse({ success: false, error: 'Failed to connect to Miden wallet' });
  }
}

async function handleDisconnectMidenWallet(request: DisconnectWalletMessage, sendResponse: (response: any) => void) {
  try {
    console.log('Disconnecting from Miden wallet...');
    
    // Clear wallet data from storage
    await chrome.storage.local.remove(['miden-wallet-data', 'miden-connection-status']);
    
    sendResponse({ success: true, message: 'Disconnected from Miden wallet' });
  } catch (error) {
    console.error('Failed to disconnect from Miden wallet:', error);
    sendResponse({ success: false, error: 'Failed to disconnect from Miden wallet' });
  }
}

async function handleReconnectMidenWallet(request: ReconnectWalletMessage, sendResponse: (response: any) => void) {
  try {
    console.log('Reconnecting to Miden wallet...');
    
    // Get existing wallet info from storage
    const result = await chrome.storage.local.get(['miden-wallet-data']);
    const existingWallet = result['miden-wallet-data'];
    
    if (existingWallet && existingWallet.isConnected) {
      // Return existing connected wallet
      sendResponse({ success: true, wallet: existingWallet });
    } else {
      sendResponse({ success: false, error: 'No existing wallet to reconnect' });
    }
  } catch (error) {
    console.error('Failed to reconnect to Miden wallet:', error);
    sendResponse({ success: false, error: 'Failed to reconnect to Miden wallet' });
  }
}

async function handleGetMidenAccountInfo(request: GetAccountInfoMessage, sendResponse: (response: any) => void) {
  try {
    console.log('Getting Miden account info for address:', request.address);
    
    // Get wallet info from storage
    const result = await chrome.storage.local.get(['miden-wallet-data']);
    const wallet = result['miden-wallet-data'];
    
    if (wallet && wallet.aliceMidenAddress === request.address) {
      // Return account info
      sendResponse({ 
        success: true, 
        balance: wallet.aliceBalance || '0',
        address: wallet.aliceMidenAddress
      });
    } else {
      sendResponse({ success: false, error: 'Address not found in wallet' });
    }
  } catch (error) {
    console.error('Failed to get Miden account info:', error);
    sendResponse({ success: false, error: 'Failed to get account info' });
  }
}

async function handleSendMidenPayment(request: SendPaymentMessage, sendResponse: (response: any) => void) {
  try {
    console.log('Sending Miden payment:', request);
    
    // Delegate to popup for payment
    sendResponse({ 
      success: true, 
      message: 'Please use popup to send payment',
      requiresPopup: true,
      paymentData: request
    });
  } catch (error) {
    console.error('Failed to send Miden payment:', error);
    sendResponse({ success: false, error: 'Failed to send payment' });
  }
}

async function handleSignMidenTransaction(request: SignTransactionMessage, sendResponse: (response: any) => void) {
  try {
    console.log('Signing Miden transaction:', request);
    
    // Delegate to popup for transaction signing
    sendResponse({ 
      success: true, 
      message: 'Please use popup to sign transaction',
      requiresPopup: true,
      transactionData: request
    });
  } catch (error) {
    console.error('Failed to sign Miden transaction:', error);
    sendResponse({ success: false, error: 'Failed to sign transaction' });
  }
}

// New message handlers for content script communication
async function handleMidenWalletConnect(request: MidenWalletConnectMessage, sendResponse: (response: any) => void) {
  try {
    console.log('Handling MIDEN_WALLET_CONNECT message');
    // This message is typically handled by the content script itself
    // For background script, we just acknowledge receipt
    sendResponse({ success: true, message: 'MIDEN_WALLET_CONNECT received' });
  } catch (error) {
    console.error('Failed to handle MIDEN_WALLET_CONNECT:', error);
    sendResponse({ success: false, error: 'Failed to handle MIDEN_WALLET_CONNECT' });
  }
}

async function handleMidenWalletDisconnect(request: MidenWalletDisconnectMessage, sendResponse: (response: any) => void) {
  try {
    console.log('Handling MIDEN_WALLET_DISCONNECT message');
    // This message is typically handled by the content script itself
    // For background script, we just acknowledge receipt
    sendResponse({ success: true, message: 'MIDEN_WALLET_DISCONNECT received' });
  } catch (error) {
    console.error('Failed to handle MIDEN_WALLET_DISCONNECT:', error);
    sendResponse({ success: false, error: 'Failed to handle MIDEN_WALLET_DISCONNECT' });
  }
}

async function handleMidenWalletGetInfo(request: MidenWalletGetInfoMessage, sendResponse: (response: any) => void) {
  try {
    console.log('Handling MIDEN_WALLET_GET_INFO message');
    // This message is typically handled by the content script itself
    // For background script, we just acknowledge receipt
    sendResponse({ success: true, message: 'MIDEN_WALLET_GET_INFO received' });
  } catch (error) {
    console.error('Failed to handle MIDEN_WALLET_GET_INFO:', error);
    sendResponse({ success: false, error: 'Failed to handle MIDEN_WALLET_GET_INFO' });
  }
}

async function handleMidenWalletGetBalance(request: MidenWalletGetBalanceMessage, sendResponse: (response: any) => void) {
  try {
    console.log('Handling MIDEN_WALLET_GET_BALANCE message');
    // This message is typically handled by the content script itself
    // For background script, we just acknowledge receipt
    sendResponse({ success: true, message: 'MIDEN_WALLET_GET_BALANCE received' });
  } catch (error) {
    console.error('Failed to handle MIDEN_WALLET_GET_BALANCE:', error);
    sendResponse({ success: false, error: 'Failed to handle MIDEN_WALLET_GET_BALANCE' });
  }
}

async function handleMidenWalletSendPayment(request: MidenWalletSendPaymentMessage, sendResponse: (response: any) => void) {
  try {
    console.log('Handling MIDEN_WALLET_SEND_PAYMENT message');
    // This message is typically handled by the content script itself
    // For background script, we just acknowledge receipt
    sendResponse({ success: true, message: 'MIDEN_WALLET_SEND_PAYMENT received' });
  } catch (error) {
    console.error('Failed to handle MIDEN_WALLET_SEND_PAYMENT:', error);
    sendResponse({ success: false, error: 'Failed to handle MIDEN_WALLET_SEND_PAYMENT' });
  }
}

// Extension lifecycle events
chrome.runtime.onInstalled.addListener((details) => {
  console.log('Miden Wallet Extension installed:', details.reason);
  if (details.reason === 'install') {
    console.log('Welcome to Miden Wallet Extension!');
  }
});

chrome.runtime.onStartup.addListener(() => {
  console.log('Miden Wallet Extension started');
});

// Tab events for content script communication
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    console.log(`Tab ${tabId} loaded: ${tab.url}`);
  }
});

// Simple content script message handlers
async function handleSimpleConnect(request: SimpleConnectMessage, sendResponse: (response: any) => void) {
  try {
    console.log('Handling MIDEN_SIMPLE_CONNECT message');
    // Get wallet info from storage
    const result = await chrome.storage.local.get(['miden-wallet-data', 'miden-connection-status']);
    const wallet = result['miden-wallet-data'];
    const connectionStatus = result['miden-connection-status'];
    
    if (wallet && connectionStatus && connectionStatus.isConnected) {
      sendResponse({ 
        success: true, 
        message: 'Simple connect successful',
        data: { wallet, connectionStatus }
      });
    } else {
      sendResponse({ 
        success: false, 
        error: 'No wallet connected' 
      });
    }
  } catch (error) {
    console.error('Failed to handle MIDEN_SIMPLE_CONNECT:', error);
    sendResponse({ success: false, error: 'Failed to handle simple connect' });
  }
}

async function handleSimpleDisconnect(request: SimpleDisconnectMessage, sendResponse: (response: any) => void) {
  try {
    console.log('Handling MIDEN_SIMPLE_DISCONNECT message');
    // Clear wallet data
    await chrome.storage.local.remove(['miden-connection-status', 'miden-wallet-data']);
    sendResponse({ 
      success: true, 
      message: 'Simple disconnect successful' 
    });
  } catch (error) {
    console.error('Failed to handle MIDEN_SIMPLE_DISCONNECT:', error);
    sendResponse({ success: false, error: 'Failed to handle simple disconnect' });
  }
}

async function handleSimpleGetInfo(request: SimpleGetInfoMessage, sendResponse: (response: any) => void) {
  try {
    console.log('Handling MIDEN_SIMPLE_GET_INFO message');
    const result = await chrome.storage.local.get(['miden-wallet-data', 'miden-connection-status']);
    const wallet = result['miden-wallet-data'];
    const connectionStatus = result['miden-connection-status'];
    sendResponse({ 
      success: true, 
      data: { wallet, connectionStatus }
    });
  } catch (error) {
    console.error('Failed to handle MIDEN_SIMPLE_GET_INFO:', error);
    sendResponse({ success: false, error: 'Failed to get simple wallet info' });
  }
}

async function handleSimpleGetBalance(request: SimpleGetBalanceMessage, sendResponse: (response: any) => void) {
  try {
    console.log('Handling MIDEN_SIMPLE_GET_BALANCE message for address:', request.address);
    // Get wallet info from storage
    const result = await chrome.storage.local.get(['miden-wallet-data']);
    const wallet = result['miden-wallet-data'];
    
    if (wallet && wallet.aliceMidenAddress === request.address) {
      // Return stored balance (in real implementation, this would query the network)
      const balance = wallet.aliceBalance || '0';
      sendResponse({ 
        success: true, 
        balance: balance,
        address: request.address
      });
    } else {
      sendResponse({ 
        success: false, 
        error: 'Address not found in wallet' 
      });
    }
  } catch (error) {
    console.error('Failed to handle MIDEN_SIMPLE_GET_BALANCE:', error);
    sendResponse({ success: false, error: 'Failed to get simple balance' });
  }
}

async function handleSimpleGetStorage(request: SimpleGetStorageMessage, sendResponse: (response: any) => void) {
  try {
    console.log('Handling MIDEN_SIMPLE_GET_STORAGE message');
    const result = await chrome.storage.local.get(['miden-wallet-data', 'miden-connection-status']);
    sendResponse({ 
      success: true, 
      data: result
    });
  } catch (error) {
    console.error('Failed to handle MIDEN_SIMPLE_GET_STORAGE:', error);
    sendResponse({ success: false, error: 'Failed to get simple storage' });
  }
}

async function handleSimpleTest(request: SimpleTestMessage, sendResponse: (response: any) => void) {
  try {
    console.log('Handling MIDEN_SIMPLE_TEST message');
    sendResponse({ 
      success: true, 
      message: 'Simple test successful',
      extensionId: chrome.runtime.id,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to handle MIDEN_SIMPLE_TEST:', error);
    sendResponse({ success: false, error: 'Failed to handle simple test' });
  }
}

// Storage change listener
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local') {
    console.log('Storage changed:', changes);
    // Notify content scripts about storage changes
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach(tab => {
        if (tab.id) {
          chrome.tabs.sendMessage(tab.id, {
            type: 'STORAGE_CHANGED',
            changes: changes
          }).catch(() => {
            // Tab might not have content script loaded
          });
        }
      });
    });
  }
});

console.log('Miden Wallet Background Script initialized successfully - Service Worker compatible');
