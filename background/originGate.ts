// Per-site access control for messages that reach the background script from
// web pages (through the content scripts).
//
// Kept free of chrome.* calls and imports so it can be unit-tested in Node
// (see scripts/origin-gate.test.mjs).

export const APPROVED_ORIGINS_KEY = 'miden-approved-origins';
export const PENDING_CONNECTION_KEY = 'miden-pending-connection';

// The only message types a web page may send. Everything else (wallet
// creation, minting, SAVE_WALLET, raw storage reads, ...) is for the
// extension's own pages, such as the popup.
const PAGE_MESSAGE_TYPES = new Set<string>([
  'MIDEN_SIMPLE_CONNECT',
  'MIDEN_SIMPLE_DISCONNECT',
  'MIDEN_SIMPLE_GET_INFO',
  'MIDEN_SIMPLE_GET_BALANCE',
  'MIDEN_SIMPLE_TEST',
  'MIDEN_WALLET_CONNECT',
  'MIDEN_WALLET_DISCONNECT',
  'MIDEN_WALLET_GET_INFO',
  'MIDEN_WALLET_GET_BALANCE',
  'MIDEN_WALLET_SEND_PAYMENT',
]);

// Page messages that reveal wallet data (address, account id, balance). The
// site must be approved in the popup first.
const APPROVAL_REQUIRED_TYPES = new Set<string>([
  'MIDEN_SIMPLE_CONNECT',
  'MIDEN_SIMPLE_GET_INFO',
  'MIDEN_SIMPLE_GET_BALANCE',
]);

export interface SenderLike {
  id?: string;
  url?: string;
  origin?: string;
  tab?: { url?: string } | unknown;
}

export type GateDecision =
  | { action: 'allow' }
  | { action: 'reject'; error: string }
  | { action: 'needs-approval'; origin: string }
  | { action: 'revoke'; origin: string };

// True when the message comes from one of this extension's own pages (popup,
// options page), not from a content script running in a web page.
export function isExtensionPage(sender: SenderLike, extensionId: string, extensionBaseUrl: string): boolean {
  if (sender.id !== extensionId) return false;
  return typeof sender.url === 'string' && sender.url.startsWith(extensionBaseUrl);
}

// The web origin a content-script message came from, or null if unknown or
// opaque. Prefers sender.origin, which Chrome sets from the frame itself.
export function senderOrigin(sender: SenderLike): string | null {
  let origin: string | undefined = sender.origin;
  if (!origin) {
    const tabUrl = (sender.tab as { url?: string } | undefined)?.url;
    const url = sender.url || tabUrl;
    if (!url) return null;
    try {
      origin = new URL(url).origin;
    } catch {
      return null;
    }
  }
  if (!origin || origin === 'null') return null;
  if (!/^https?:\/\//.test(origin)) return null;
  return origin;
}

// Decide what to do with a message that came from a web page.
export function gatePageMessage(type: string, sender: SenderLike, approvedOrigins: string[]): GateDecision {
  if (!PAGE_MESSAGE_TYPES.has(type)) {
    return { action: 'reject', error: `Message type ${type} is not allowed from web pages` };
  }
  const origin = senderOrigin(sender);
  if (!origin) {
    return { action: 'reject', error: 'Unknown page origin' };
  }
  if (type === 'MIDEN_SIMPLE_DISCONNECT') {
    // A site may disconnect itself; it must never wipe the wallet.
    return { action: 'revoke', origin };
  }
  if (APPROVAL_REQUIRED_TYPES.has(type) && !approvedOrigins.includes(origin)) {
    return { action: 'needs-approval', origin };
  }
  return { action: 'allow' };
}
