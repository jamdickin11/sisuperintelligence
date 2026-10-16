/* Example searcher bot. Run with: node bot-client.js wss://yourdomain.com/ws */
const WebSocket = require('ws');

const url = process.argv[2] || 'ws://localhost:3000/ws';
const ws = new WebSocket(url);

ws.on('open', () => console.log('[bot] connected to', url));

ws.on('message', (raw) => {
  const msg = JSON.parse(raw.toString());

  if (msg.type === 'welcome') {
    console.log('[bot] welcome:', msg.message);
    return;
  }

  if (msg.type === 'opportunity') {
    const o = msg.data;
    console.log('[bot] opp:', o.id, o.type, o.expectedProfit);
    // TODO: simulate via eth_call, build bundle, submit to Flashbots MEV-Share
  }
});

ws.on('close', () => console.log('[bot] disconnected'));
ws.on('error', (e) => console.error('[bot] error:', e.message));