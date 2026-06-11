// Content script for Miden Wallet Extension
// This script is injected into web pages to enable communication with the extension

console.log('🚀 MIDEN WALLET CONTENT SCRIPT LOADED');

// Force injection immediately
(function() {
  console.log('🔧 FORCE INJECTION STARTING...');
  
  // Global flag to indicate content script is ready
  (window as any).MIDEN_CONTENT_SCRIPT_READY = true;
  
  // Create a simple test object first - THIS SHOULD BE VISIBLE IMMEDIATELY
  try {
    // Method 1: Direct window injection
    (window as any).midenTest = {
      message: 'Content script is working!',
      timestamp: new Date().toISOString(),
      chromeAvailable: typeof chrome !== 'undefined',
      runtimeId: typeof chrome !== 'undefined' && chrome.runtime ? chrome.runtime.id : 'N/A'
    };
    
    // Method 2: Also inject to document for redundancy
    (document as any).midenTest = {
      message: 'Content script is working! (document context)',
      timestamp: new Date().toISOString(),
      chromeAvailable: typeof chrome !== 'undefined',
      runtimeId: typeof chrome !== 'undefined' && chrome.runtime ? chrome.runtime.id : 'N/A'
    };
    
    // Method 3: Use Object.defineProperty for more reliable injection
    Object.defineProperty(window, 'midenTestReliable', {
      value: {
        message: 'Content script is working! (reliable)',
        timestamp: new Date().toISOString(),
        chromeAvailable: typeof chrome !== 'undefined',
        runtimeId: typeof chrome !== 'undefined' && chrome.runtime ? chrome.runtime.id : 'N/A'
      },
      writable: false,
      configurable: false
    });
    
    // Method 4: Global flag for immediate detection
    (window as any).MIDEN_EXTENSION_AVAILABLE = true;
    (window as any).MIDEN_EXTENSION_ID = typeof chrome !== 'undefined' && chrome.runtime ? chrome.runtime.id : 'N/A';
    
    // Method 5: Force injection with multiple attempts
    const forceInject = (obj: any, name: string) => {
      try {
        (window as any)[name] = obj;
        (document as any)[name] = obj;
        Object.defineProperty(window, name + 'Reliable', {
          value: obj,
          writable: false,
          configurable: false
        });
        console.log(`✅ ${name} injected successfully via multiple methods`);
      } catch (error) {
        console.error(`❌ Failed to inject ${name}:`, error);
      }
    };
    
    // Add function to read extension storage (this will work from content script)
    const storageFunction = async function() {
      console.log('🔍 Reading Miden extension storage from content script...');
      
      try {
        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.storage) {
          const storage = await chrome.storage.local.get([
            'miden-connection-status',
            'miden-wallet-data'
          ]);
          
          console.log('✅ Extension storage read successfully:', storage);
          return storage;
        } else {
          console.log('❌ Chrome storage not available');
          return null;
        }
      } catch (error) {
        console.error('❌ Error reading extension storage:', error);
        return null;
      }
    };
    
    // Force inject storage function
    forceInject(storageFunction, 'getMidenStorageData');
    
    // Add global test function that can be called from browser console
    const testFunction = function() {
      console.log('🧪 TESTING MIDEN EXTENSION FROM CONSOLE');
      console.log('1. midenTest object:', (window as any).midenTest);
      console.log('2. getMidenStorageData function:', typeof (window as any).getMidenStorageData);
      console.log('3. Chrome available:', typeof chrome !== 'undefined');
      console.log('4. Chrome runtime:', typeof chrome !== 'undefined' && chrome.runtime);
      console.log('5. Runtime ID:', typeof chrome !== 'undefined' && chrome.runtime ? chrome.runtime.id : 'N/A');
      
      return {
        midenTest: (window as any).midenTest,
        getMidenStorageData: typeof (window as any).getMidenStorageData,
        chromeAvailable: typeof chrome !== 'undefined',
        runtimeId: typeof chrome !== 'undefined' && chrome.runtime ? chrome.runtime.id : 'N/A'
      };
    };
    
    // Force inject test function
    forceInject(testFunction, 'testMidenExtension');
    
    console.log('✅ FORCE INJECTION COMPLETED');
    console.log('🔍 Check window.getMidenStorageData in console:', typeof (window as any).getMidenStorageData);
    console.log('🔍 Check window.testMidenExtension in console:', typeof (window as any).testMidenExtension);
    
  } catch (error) {
    console.error('❌ FORCE INJECTION FAILED:', error);
  }
})();

// Function to inject the wallet bridge
function injectWalletBridge() {
  console.log('=== INJECTING WALLET BRIDGE ===');
  
  // Check if bridge already exists
  if ((window as any).midenWallet) {
    console.log('Miden Wallet Bridge already exists, skipping injection');
    return;
  }

  console.log('Injecting Miden Wallet Bridge...');
  console.log('Window object available:', typeof window !== 'undefined');
  console.log('Document body available:', document.body ? 'Yes' : 'No');

  // Create the wallet bridge object with more robust injection
  try {
    // Method 1: Direct injection
    (window as any).midenWallet = {
      // Check if extension is available
      isAvailable: function() {
        const available = typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id;
        console.log('Bridge isAvailable() called, result:', available);
        return available;
      },
      
      // Send message to extension via content script
      sendMessage: function(message: any) {
        return new Promise((resolve, reject) => {
          if (!this.isAvailable()) {
            reject(new Error('Chrome extension not available'));
            return;
          }

          const id = Date.now() + Math.random();
          
          // Listen for response
          const listener = (event: MessageEvent) => {
            if (event.data.type === `MIDEN_WALLET_RESPONSE_${message.type}` && event.data.id === id) {
              window.removeEventListener('message', listener);
              if (event.data.error) {
                reject(new Error(event.data.error));
    } else {
                resolve(event.data.response);
              }
            }
          };
          
          window.addEventListener('message', listener);
          
          // Send message to content script (which will forward to background)
          window.postMessage({
            ...message,
            id: id
          }, window.location.origin);
          
          // Timeout after 30 seconds
          setTimeout(() => {
            window.removeEventListener('message', listener);
            reject(new Error('Request timeout'));
          }, 30000);
        });
      },
      
      // Connect to wallet
      connect: function() {
        return this.sendMessage({ type: 'MIDEN_WALLET_CONNECT' });
      },
      
      // Disconnect from wallet
      disconnect: function() {
        return this.sendMessage({ type: 'MIDEN_WALLET_DISCONNECT' });
      },
      
      // Get wallet info
      getWalletInfo: function() {
        return this.sendMessage({ type: 'MIDEN_WALLET_GET_INFO' });
      },
      
      // Get balance
      getBalance: function(address: string) {
        return this.sendMessage({ 
          type: 'MIDEN_WALLET_GET_BALANCE', 
          address: address 
        });
      },
      
      // Send payment
      sendPayment: function(fromAddress: string, toAddress: string, amount: number, note?: string) {
        return this.sendMessage({
          type: 'MIDEN_WALLET_SEND_PAYMENT',
          fromAddress: fromAddress,
          toAddress: toAddress,
          amount: amount,
          note: note
        });
      }
    };
    
    // Method 2: Also inject to document for redundancy
    (document as any).midenWallet = (window as any).midenWallet;
    
    // Method 3: Use Object.defineProperty for more reliable injection
    Object.defineProperty(window, 'midenWalletReliable', {
      value: (window as any).midenWallet,
      writable: false,
      configurable: false
    });
    
    console.log('✅ Miden Wallet Bridge injected successfully via multiple methods');
    console.log('🔍 Check window.midenWallet in console:', (window as any).midenWallet);
    console.log('🔍 Check document.midenWallet in console:', (document as any).midenWallet);
    console.log('🔍 Check window.midenWalletReliable in console:', (window as any).midenWalletReliable);
    
  } catch (error) {
    console.error('❌ Failed to inject wallet bridge:', error);
    return;
  }
  
  // Dispatch custom event to notify frontend
  console.log('Dispatching midenWalletReady event...');
  try {
    window.dispatchEvent(new CustomEvent('midenWalletReady', {
      detail: { 
        available: true,
        timestamp: new Date().toISOString(),
        extensionId: typeof chrome !== 'undefined' && chrome.runtime ? chrome.runtime.id : 'N/A'
      }
    }));
    console.log('✅ midenWalletReady event dispatched successfully');
  } catch (error) {
    console.error('❌ Failed to dispatch midenWalletReady event:', error);
  }
  
  // Also dispatch event immediately for testing
  console.log('🚀 Dispatching immediate midenWalletReady event for testing...');
  try {
    window.dispatchEvent(new CustomEvent('midenWalletReady', {
      detail: { 
        available: true,
        immediate: true,
        timestamp: new Date().toISOString(),
        extensionId: typeof chrome !== 'undefined' && chrome.runtime ? chrome.runtime.id : 'N/A'
      }
    }));
    console.log('✅ Immediate midenWalletReady event dispatched successfully');
  } catch (error) {
    console.error('❌ Failed to dispatch immediate midenWalletReady event:', error);
  }
}

// Listen for messages from the web page
window.addEventListener('message', (event) => {
  // Only accept messages from the same window
  if (event.source !== window) return;
  if (event.origin !== window.location.origin) return;
  
  // Only accept messages that we know are ours
  if (event.data.type && event.data.type.startsWith('MIDEN_WALLET_')) {
    console.log('Content script received message:', event.data);
    
    // Forward message to background script (content script can call chrome.runtime.sendMessage)
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.sendMessage(event.data).then(response => {
        console.log('Background response:', response);
        // Send response back to web page
        window.postMessage({
          type: `MIDEN_WALLET_RESPONSE_${event.data.type}`,
          id: event.data.id,
          response: response
        }, window.location.origin);
      }).catch(error => {
        console.error('Background error:', error);
        // Send error back to web page
        window.postMessage({
          type: `MIDEN_WALLET_RESPONSE_${event.data.type}`,
          id: event.data.id,
          error: error.message
        }, window.location.origin);
      });
    } else {
      // Send error if chrome runtime not available
      window.postMessage({
        type: `MIDEN_WALLET_RESPONSE_${event.data.type}`,
        id: event.data.id,
        error: 'Chrome runtime not available'
      }, window.location.origin);
    }
  }
});

// Inject the wallet bridge immediately
console.log('=== IMMEDIATE INJECTION ===');
injectWalletBridge();

// Also inject when DOM is ready (for safety)
if (document.readyState === 'loading') {
  console.log('DOM still loading, setting up DOMContentLoaded listener...');
  document.addEventListener('DOMContentLoaded', () => {
    console.log('=== DOM CONTENT LOADED INJECTION ===');
    injectWalletBridge();
  });
} else {
  console.log('DOM already ready, injecting immediately...');
  injectWalletBridge();
}

// Inject on page load (for SPA navigation)
window.addEventListener('load', () => {
  console.log('=== PAGE LOAD INJECTION ===');
  injectWalletBridge();
});

// Notify that content script is ready
console.log('=== CONTENT SCRIPT READY ===');
console.log('Miden Wallet Content Script ready');
console.log('Final check - midenTest available:', (window as any).midenTest ? 'Yes' : 'No');
console.log('Final check - midenWallet available:', (window as any).midenWallet ? 'Yes' : 'No');
console.log('=== CONTENT SCRIPT COMPLETE ===');
