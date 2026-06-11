// ISOLATED SIMPLIFIED CONTENT SCRIPT
// This script is completely isolated and won't interfere with existing functionality
// Namespace: MIDEN_SIMPLE_* to avoid conflicts

console.log('🚀 MIDEN SIMPLE CONTENT SCRIPT LOADED (ISOLATED)');

// ISOLATED NAMESPACE - Won't conflict with existing midenWallet
(function() {
  console.log('🔧 SIMPLE INJECTION STARTING (ISOLATED)...');
  
  // Get extension ID immediately
  const EXTENSION_ID = typeof chrome !== 'undefined' && chrome.runtime ? chrome.runtime.id : null;
  console.log('🔧 Simple Extension ID:', EXTENSION_ID);
  
  // ISOLATED GLOBAL FLAGS - Different namespace
  (window as any).MIDEN_SIMPLE_READY = true;
  (window as any).MIDEN_SIMPLE_EXTENSION_ID = EXTENSION_ID;
  
  // ISOLATED TEST FUNCTION - Different name
  const testSimpleExtension = function() {
    console.log('🧪 TESTING SIMPLE MIDEN EXTENSION FROM CONSOLE');
    console.log('1. Extension ID:', EXTENSION_ID);
    console.log('2. Chrome available:', typeof chrome !== 'undefined');
    
    return {
      extensionId: EXTENSION_ID,
      chromeAvailable: typeof chrome !== 'undefined',
      timestamp: new Date().toISOString()
    };
  };
  
  // ISOLATED SIMPLE WALLET BRIDGE - Different namespace
  const createSimpleWalletBridge = function() {
    console.log('=== CREATING SIMPLE WALLET BRIDGE (ISOLATED) ===');
    
    // Check if simple bridge already exists
    if ((window as any).midenSimpleWallet) {
      console.log('Simple Wallet Bridge already exists, skipping creation');
      return;
    }
    
    try {
      // ISOLATED WALLET BRIDGE - Different name and namespace
      (window as any).midenSimpleWallet = {
        // Extension info
        extensionId: EXTENSION_ID,
        isAvailable: function() {
          const available = typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id;
          console.log('Simple Bridge isAvailable() called, result:', available);
          return available;
        },
        
        // Test function
        test: testSimpleExtension,
        
        // Simplified message sending
        sendMessage: function(message: any) {
          return new Promise((resolve, reject) => {
            if (!this.isAvailable()) {
              reject(new Error('Chrome extension not available (SIMPLE)'));
              return;
            }
            
            const id = Date.now() + Math.random();
            
            // Listen for response
            const listener = (event: MessageEvent) => {
              if (event.data.type === `MIDEN_SIMPLE_RESPONSE_${message.type}` && event.data.id === id) {
                window.removeEventListener('message', listener);
                if (event.data.error) {
                  reject(new Error(event.data.error));
                } else {
                  resolve(event.data.response);
                }
              }
            };
            
            window.addEventListener('message', listener);
            
            // Send message with SIMPLE namespace
            window.postMessage({
              ...message,
              type: `MIDEN_SIMPLE_${message.type}`,
              id: id
            }, window.location.origin);
            
            // Timeout after 10 seconds (shorter for simple)
            setTimeout(() => {
              window.removeEventListener('message', listener);
              reject(new Error('Simple request timeout'));
            }, 10000);
          });
        },
        
        // Simplified connect
        connect: function() {
          return this.sendMessage({ type: 'CONNECT' });
        },
        
        // Simplified disconnect
        disconnect: function() {
          return this.sendMessage({ type: 'DISCONNECT' });
        },
        
        // Simplified get info
        getInfo: function() {
          return this.sendMessage({ type: 'GET_INFO' });
        },
        
        // Simplified get balance
        getBalance: function(address: string) {
          return this.sendMessage({ 
            type: 'GET_BALANCE', 
            address: address 
          });
        }
      };
      
      // ISOLATED INJECTION - Different namespace
      Object.defineProperty(window, 'midenSimpleWalletReliable', {
        value: (window as any).midenSimpleWallet,
        writable: false,
        configurable: false
      });
      
      console.log('✅ Simple Wallet Bridge created successfully (ISOLATED)');
      console.log('🔍 Check window.midenSimpleWallet in console:', (window as any).midenSimpleWallet);
      
    } catch (error) {
      console.error('❌ Failed to create simple wallet bridge:', error);
    }
  };
  
  // ISOLATED MESSAGE LISTENER - Different namespace
  const setupSimpleMessageListener = function() {
    window.addEventListener('message', (event) => {
      // Only accept messages from the same window
      if (event.source !== window) return;
      if (event.origin !== window.location.origin) return;
      
      // Only accept SIMPLE namespace messages (but not INJECT_DATA or RESPONSE messages)
      if (event.data.type && 
          event.data.type.startsWith('MIDEN_SIMPLE_') && 
          event.data.type !== 'MIDEN_SIMPLE_INJECT_DATA' &&
          !event.data.type.includes('RESPONSE')) {
        console.log('Simple content script received message:', event.data);
        
        // Forward message to background script
        if (typeof chrome !== 'undefined' && chrome.runtime) {
          try {
            // Check if extension context is still valid
            if (!chrome.runtime.id) {
              throw new Error('Extension context invalidated');
            }
            
            chrome.runtime.sendMessage(event.data).then(response => {
              console.log('Simple background response:', response);
              // Send response back to web page
              window.postMessage({
                type: `MIDEN_SIMPLE_RESPONSE_${event.data.type.replace('MIDEN_SIMPLE_', '')}`,
                id: event.data.id,
                response: response
              }, window.location.origin);
            }).catch(error => {
              console.error('Simple background error:', error);
              // Send error back to web page
              window.postMessage({
                type: `MIDEN_SIMPLE_RESPONSE_${event.data.type.replace('MIDEN_SIMPLE_', '')}`,
                id: event.data.id,
                error: error.message || 'Background script error'
              }, window.location.origin);
            });
          } catch (error) {
            console.error('Simple runtime error:', error);
            // Send error back to web page
            window.postMessage({
              type: `MIDEN_SIMPLE_RESPONSE_${event.data.type.replace('MIDEN_SIMPLE_', '')}`,
              id: event.data.id,
              error: 'Extension context invalidated'
            }, window.location.origin);
          }
        } else {
          // Send error if chrome runtime not available
          window.postMessage({
            type: `MIDEN_SIMPLE_RESPONSE_${event.data.type.replace('MIDEN_SIMPLE_', '')}`,
            id: event.data.id,
            error: 'Chrome runtime not available (SIMPLE)'
          }, window.location.origin);
        }
      }
    });
  };
  
  // ISOLATED EVENT DISPATCHER - Different namespace
  const dispatchSimpleEvent = function() {
    console.log('Dispatching midenSimpleReady event...');
    try {
      window.dispatchEvent(new CustomEvent('midenSimpleReady', {
        detail: { 
          available: true,
          timestamp: new Date().toISOString(),
          extensionId: EXTENSION_ID,
          namespace: 'SIMPLE'
        }
      }));
      console.log('✅ midenSimpleReady event dispatched successfully');
    } catch (error) {
      console.error('❌ Failed to dispatch midenSimpleReady event:', error);
    }
  };
  
  // INITIALIZE ISOLATED SIMPLE SYSTEM
  console.log('=== INITIALIZING SIMPLE SYSTEM (ISOLATED) ===');
  
  // Create simple wallet bridge
  createSimpleWalletBridge();
  
  // Setup message listener
  setupSimpleMessageListener();
  
  // Dispatch ready event
  dispatchSimpleEvent();
  
  // INJECT GLOBAL FUNCTIONS (ISOLATED NAMESPACE)
  (window as any).testSimpleExtension = testSimpleExtension;
  
  // SEND DATA TO MAIN WINDOW VIA POSTMESSAGE
  console.log('🔧 SENDING SIMPLE DATA TO MAIN WINDOW VIA POSTMESSAGE...');
  
  try {
    // Send data only (no functions) to main window via postMessage
    window.postMessage({
      type: 'MIDEN_SIMPLE_INJECT_DATA',
      data: {
        MIDEN_SIMPLE_READY: true,
        MIDEN_SIMPLE_EXTENSION_ID: EXTENSION_ID,
        extensionId: EXTENSION_ID,
        chromeAvailable: typeof chrome !== 'undefined',
        timestamp: new Date().toISOString()
      }
    }, window.location.origin);
    
    console.log('✅ SIMPLE DATA SENT TO MAIN WINDOW VIA POSTMESSAGE');
    
  } catch (error) {
    console.error('❌ Failed to send simple data via postMessage:', error);
  }
  
  console.log('✅ SIMPLE SYSTEM INITIALIZED (ISOLATED)');
  console.log('🔍 Check window.midenSimpleWallet in console:', (window as any).midenSimpleWallet);
  console.log('🔍 Check window.testSimpleExtension in console:', typeof (window as any).testSimpleExtension);
  
})();

// ISOLATED COMPLETE
console.log('=== SIMPLE CONTENT SCRIPT COMPLETE (ISOLATED) ===');
