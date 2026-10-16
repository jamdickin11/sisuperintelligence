const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server, path: '/ws' });

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ---------- In-memory stores (replace with DB in prod) ----------
const connectedWallets = new Map();  // address -> { ts, ip }
let opportunities = [];

// ---------- Mock opportunity generator (replace with real events) ----------
function generateMockOpportunity() {
  return {
    id: Math.random().toString(36).slice(2),
    type: 'arbitrage',
    chain: 'arbitrum',
    tokenIn: '0x0000000000000000000000000000000000000001',
    tokenOut: '0x0000000000000000000000000000000000000002',
    amountIn: '1000000000000000000',
    expectedProfit: (Math.random() * 0.1).toFixed(4) + ' ETH',
    deadline: Date.now() + 30000,
    contract: '0xYourContractAddressHere',
    calldata: '0xdeadbeef'
  };
}

setInterval(() => {
  const opp = generateMockOpportunity();
  opportunities.push(opp);
  if (opportunities.length > 100) opportunities.shift();

  const msg = JSON.stringify({ type: 'opportunity', data: opp });
  wss.clients.forEach(c => {
    if (c.readyState === WebSocket.OPEN) c.send(msg);
  });
}, 5000);

// ---------- WebSocket: searcher feed ----------
wss.on('connection', (ws, req) => {
  const ip = req.socket.remoteAddress;
  console.log(`[WS] Searcher connected from ${ip}`);

  ws.send(JSON.stringify({
    type: 'welcome',
    message: 'Connected to MEV opportunity feed',
    endpoint: '/ws',
    httpPolling: '/api/opportunities'
  }));

  opportunities.slice(-10).forEach(opp => {
    ws.send(JSON.stringify({ type: 'opportunity', data: opp }));
  });
});

// ---------- HTTP API for bots that prefer polling ----------
app.get('/api/opportunities', (req, res) => {
  res.json({ count: opportunities.length, opportunities });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', wallets: connectedWallets.size, searchers: wss.clients.size });
});

// ---------- Wallet connect endpoint (called by chunk.29.u74y7c52.js) ----------
app.post('/api/connect', (req, res) => {
  const { address, chainId } = req.body || {};
  if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return res.status(400).json({ ok: false, error: 'Invalid address' });
  }
  connectedWallets.set(address.toLowerCase(), {
    ts: Date.now(),
    ip: req.socket.remoteAddress,
    chainId
  });
  console.log(`[CONNECT] ${address} (chain ${chainId})`);
  res.json({ ok: true, address, totalConnected: connectedWallets.size });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`HTTP:  http://localhost:${PORT}`);
  console.log(`WS:    ws://localhost:${PORT}/ws`);
  console.log(`API:   http://localhost:${PORT}/api/opportunities`);
});