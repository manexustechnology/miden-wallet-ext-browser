import React, { useEffect, useState } from 'react';
import { APPROVED_ORIGINS_KEY, PENDING_CONNECTION_KEY } from '../background/originGate';

interface PendingConnection {
  origin: string;
  requestedAt: string;
}

// Lets the user approve or reject a site that asked for wallet access, and
// revoke sites approved earlier. Sites can only read wallet data once approved.
const SiteAccess: React.FC = () => {
  const [pending, setPending] = useState<PendingConnection | null>(null);
  const [approved, setApproved] = useState<string[]>([]);

  const load = async () => {
    const stored = await chrome.storage.local.get([APPROVED_ORIGINS_KEY, PENDING_CONNECTION_KEY]);
    const list = stored[APPROVED_ORIGINS_KEY];
    setApproved(Array.isArray(list) ? list : []);
    setPending(stored[PENDING_CONNECTION_KEY] || null);
  };

  useEffect(() => {
    load();
  }, []);

  const clearPending = async () => {
    await chrome.storage.local.remove(PENDING_CONNECTION_KEY);
    try {
      await chrome.action.setBadgeText({ text: '' });
    } catch (error) {
      console.warn('Could not clear badge:', error);
    }
  };

  const approve = async () => {
    if (!pending) return;
    const next = approved.includes(pending.origin) ? approved : [...approved, pending.origin];
    await chrome.storage.local.set({ [APPROVED_ORIGINS_KEY]: next });
    await clearPending();
    await load();
  };

  const reject = async () => {
    await clearPending();
    await load();
  };

  const revoke = async (origin: string) => {
    await chrome.storage.local.set({ [APPROVED_ORIGINS_KEY]: approved.filter(o => o !== origin) });
    await load();
  };

  if (!pending && approved.length === 0) return null;

  const box: React.CSSProperties = {
    margin: '0.75rem 1.5rem 0',
    padding: '0.75rem',
    borderRadius: '8px',
    background: 'rgba(0, 0, 0, 0.35)',
    fontSize: '0.8rem'
  };
  const button: React.CSSProperties = {
    marginRight: '0.5rem',
    marginTop: '0.5rem',
    padding: '0.3rem 0.8rem',
    borderRadius: '6px',
    border: 'none',
    cursor: 'pointer'
  };

  return (
    <div style={box}>
      {pending && (
        <div>
          <div>
            <strong>{pending.origin}</strong> wants to see your wallet address and balance.
          </div>
          <button style={button} onClick={approve}>Approve</button>
          <button style={button} onClick={reject}>Reject</button>
        </div>
      )}
      {approved.length > 0 && (
        <div style={{ marginTop: pending ? '0.75rem' : 0 }}>
          <div>Connected sites</div>
          {approved.map(origin => (
            <div key={origin} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>{origin}</span>
              <button style={{ ...button, marginTop: '0.25rem' }} onClick={() => revoke(origin)}>Revoke</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SiteAccess;
