# Searcher Portal

Landing page with wallet connect + live MEV searcher endpoint.

**Domain:** https://sisuperintelligence.vercel.app/

## What it does
- Serves a landing page with a `.connect-btn` that triggers wallet connect.
- Exposes a WebSocket feed at `/ws` for MEV bots.
- Exposes HTTP polling at `/api/opportunities`.
- Logs wallet connections at `/api/connect`.

## Local run
```bash
npm install
npm start
# open http://localhost:3000
```

## Searcher endpoints (announce these)
- `wss://sisuperintelligence.vercel.app/ws`
- `https://sisuperintelligence.vercel.app/api/opportunities`
- `https://sisuperintelligence.vercel.app/api/health`

## Deploy to Vercel

### Step 1 — Push to GitHub
```bash
git init
git add .
git commit -m "searcher portal"
gh repo create searcher-portal --public --push
```

### Step 2 — Import to Vercel
1. Go to https://vercel.com/new
2. Import your `searcher-portal` repository.
3. Framework preset: **Other**
4. Build command: leave empty
5. Output directory: leave empty
6. Install command: `npm install`

### Step 3 — Configure Vercel for WebSockets
Vercel Functions now support WebSockets in public beta, but with important limits: connections are pinned to a single Function instance and close at the maximum duration — **300 seconds (5 minutes) on the Hobby plan**[reference:0]. Your bot client must handle reconnects. For production MEV use, consider a persistent host like Render or Fly.io (see below).

Create `vercel.json` in the project root:
```json
{
  "version": 2,
  "builds": [
    {
      "src": "server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "server.js"
    }
  ]
}
```

### Step 4 — Deploy
```bash
vercel --prod
```

### Step 5 — Connect your domain
1. In Vercel project → Settings → Domains
2. Add `sisuperintelligence.vercel.app` (if not already assigned)
3. Vercel provides HTTPS automatically → `wss://` works.

## ⚠️ Vercel WebSocket Limitations

| Property | Value |
|---|---|
| Support status | Public beta (June 2026)[reference:1] |
| Default duration (Hobby) | 300 seconds (5 min)[reference:2] |
| Max duration (Pro/Enterprise) | 800 seconds[reference:3] |
| Connection pinning | Pinned to one Function instance for its lifetime[reference:4] |
| Cross-instance state | Requires Redis (Vercel Marketplace)[reference:5] |

**Consequence for searchers:** Each bot connection will be dropped every 5 minutes on the free tier. Your `bot-client.js` must implement exponential-backoff reconnect logic. For a production MEV feed, deploy `server.js` on a persistent host instead.

## Alternative: Deploy on Render (recommended for MEV)

Render supports persistent WebSocket connections with no duration cap.

1. Push to GitHub (same repo).
2. https://render.com → New → Web Service.
3. Connect repo. Build: `npm install`. Start: `npm start`.
4. Render gives you HTTPS → `wss://` works.
5. Point a custom domain (e.g., `ws.sisuperintelligence.vercel.app`) to Render if you want.

## Promote to searchers
1. Post `wss://sisuperintelligence.vercel.app/ws` in **Flashbots Discord → #searchers**.
2. Add to `mev-builders` style GitHub lists.
3. Publish a short "For Searchers" doc: opportunity type, expected profit, chain, contract addresses.
4. Run a **bid reimbursement** program to subsidize gas.

## Replace mock data
In `server.js`, replace `generateMockOpportunity()` with real events:
- `ethers.provider.on('block', ...)` for pending txs
- Protocol event listeners (liquidation, swaps)
- Feed from your own contract via `eth_subscribe`