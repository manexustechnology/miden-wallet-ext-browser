// Run with: npm test  (Node 22.18+ / 23.6+ strips the TypeScript types itself)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { gatePageMessage, isExtensionPage, senderOrigin } from '../background/originGate.ts';

const EXT_ID = 'abcdefghijklmnopabcdefghijklmnop';
const EXT_URL = `chrome-extension://${EXT_ID}/`;
const page = (url) => ({ id: EXT_ID, url, origin: new URL(url).origin, tab: { url } });

test('popup is an extension page, content scripts are not', () => {
  assert.equal(isExtensionPage({ id: EXT_ID, url: `${EXT_URL}popup.html` }, EXT_ID, EXT_URL), true);
  assert.equal(isExtensionPage(page('https://evil.example/'), EXT_ID, EXT_URL), false);
  assert.equal(isExtensionPage({ id: 'other', url: `${EXT_URL}popup.html` }, EXT_ID, EXT_URL), false);
});

test('unapproved site cannot read wallet data', () => {
  for (const type of ['MIDEN_SIMPLE_CONNECT', 'MIDEN_SIMPLE_GET_INFO', 'MIDEN_SIMPLE_GET_BALANCE']) {
    assert.deepEqual(gatePageMessage(type, page('https://evil.example/x'), []), {
      action: 'needs-approval',
      origin: 'https://evil.example',
    });
  }
});

test('approved site can read wallet data, other sites still cannot', () => {
  const approved = ['https://dapp.example'];
  assert.deepEqual(gatePageMessage('MIDEN_SIMPLE_GET_INFO', page('https://dapp.example/app'), approved), { action: 'allow' });
  assert.equal(gatePageMessage('MIDEN_SIMPLE_GET_INFO', page('https://dapp.example.evil.example/'), approved).action, 'needs-approval');
  assert.equal(gatePageMessage('MIDEN_SIMPLE_GET_INFO', page('http://dapp.example/'), approved).action, 'needs-approval');
});

test('site disconnect only revokes that site and never wipes the wallet', () => {
  assert.deepEqual(gatePageMessage('MIDEN_SIMPLE_DISCONNECT', page('https://evil.example/'), []), {
    action: 'revoke',
    origin: 'https://evil.example',
  });
});

test('pages cannot send raw storage reads or popup-only messages', () => {
  for (const type of ['MIDEN_SIMPLE_GET_STORAGE', 'SAVE_WALLET', 'GET_WALLET_INFO', 'CREATE_REAL_MIDEN_WALLET_WEBAPP', 'MINT_FROM_FAUCET_WEBAPP']) {
    assert.equal(gatePageMessage(type, page('https://dapp.example/'), ['https://dapp.example']).action, 'reject', type);
  }
});

test('opaque or unknown origins are rejected', () => {
  assert.equal(senderOrigin({ id: EXT_ID, origin: 'null', url: 'file:///tmp/x.html' }), null);
  assert.equal(senderOrigin({ id: EXT_ID }), null);
  assert.equal(gatePageMessage('MIDEN_SIMPLE_TEST', { id: EXT_ID, url: 'file:///tmp/x.html' }, []).action, 'reject');
  assert.equal(senderOrigin({ id: EXT_ID, tab: { url: 'https://a.example/p' } }), 'https://a.example');
});

test('no hard-coded secret key in the backup/export code', () => {
  const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
  for (const file of ['popup/popup.tsx', 'lib/accountExportImport.ts']) {
    const src = fs.readFileSync(path.join(root, file), 'utf8');
    assert.doesNotMatch(src, /secretKey\s*:\s*["'`]/, `${file} must not contain a secretKey literal`);
  }
});
