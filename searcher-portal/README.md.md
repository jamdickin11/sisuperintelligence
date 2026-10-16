# Searcher Portal

Landing page with wallet connect + live MEV searcher endpoint.

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
- `wss://YOURDOMAIN/ws`
- `https://YOURDOMAIN/api/opportunities`
- `https://YOURDOMAIN/api/health`

## Deploy

### Option A — Render (free tier, easiest)
1. Push this folder to GitHub.
2. Go to https://render.com → New → Web Service.
3. Connect repo. Build: `npm install`. Start: `npm start`.
4. Add a custom domain in Render settings.
5. Render gives you HTTPS automatically → `wss://` works.

### Option B — Railway
1. Push to GitHub.
2. https://railway.app → New Project → Deploy from GitHub.
3. Railway auto-detects Node. Start command: `npm start`.

### Option C — Fly.io (WebSocket-friendly, low latency)
```bash
fly launch
fly deploy
fly certs add yourdomain.com
```

### Option D — VPS (DigitalOcean, Hetzner, etc.)
```bash
# on server
git clone <your-repo> && cd searcher-portal
npm install
npm install -g pm2
pm2 start server.js --name searcher-portal
pm2 save && pm2 startup

# nginx reverse proxy (required for wss://)
```
`/etc/nginx/sites-available/searcher-portal`:
```nginx
server {
  listen 80;
  server_name yourdomain.com;
  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
  }
}
```
```bash
ln -s /etc/nginx/sites-available/searcher-portal /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
certbot --nginx -d yourdomain.com   # HTTPS → wss:// works
```

### Option E — Vercel / Netlify
These do NOT support long-lived WebSockets on the free tier.
Host the static `public/` folder there, and put `server.js` on Render/Fly/VPS.

## Promote to searchers
1. Post endpoint in **Flashbots Discord → #searchers**.
2. Add to `mev-builders` style GitHub lists.
3. Publish a short “For Searchers” doc: opportunity type, expected profit, chain, contract addresses.
4. Run a **bid reimbursement** program to subsidize gas.

## Replace mock data
In `server.js`, replace `generateMockOpportunity()` with real events:
- `ethers.provider.on('block', ...)` for pending txs
- Protocol event listeners (liquidation, swaps)
- Feed from your own contract via `eth_subscribe`