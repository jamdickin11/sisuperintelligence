/* chunk.29.u74y7c52.js
 * Handles: wallet connect via any .connect-btn, calls /api/connect.
 * Also exposes window.SearcherPortal for searcher discovery.
 */
(function () {
  'use strict';

  const API_BASE = window.location.origin;
  const statusEl = () => document.getElementById('wallet-status');

  function setStatus(msg) {
    const el = statusEl();
    if (el) el.textContent = msg;
  }

  async function connectWallet(btn) {
    if (!window.ethereum) {
      setStatus('No Web3 wallet detected. Install MetaMask or a browser wallet.');
      return;
    }

    try {
      setStatus('Requesting wallet access…');
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const address = accounts && accounts[0];
      if (!address) {
        setStatus('No account returned.');
        return;
      }

      const chainIdHex = await window.ethereum.request({ method: 'eth_chainId' });
      const chainId = parseInt(chainIdHex, 16);

      // Mark all connect buttons as connected
      document.querySelectorAll('.connect-btn').forEach(b => {
        b.dataset.connected = 'true';
        b.textContent = address.slice(0, 6) + '…' + address.slice(-4);
      });

      setStatus(`Connected on chain ${chainId}`);

      // Report to backend so searchers can see inflow
      try {
        await fetch(API_BASE + '/api/connect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address, chainId })
        });
      } catch (_) { /* non-fatal */ }

      // Optional: listen for wallet changes
      if (window.ethereum.on) {
        window.ethereum.on('accountsChanged', (accs) => {
          if (!accs.length) {
            document.querySelectorAll('.connect-btn').forEach(b => {
              b.dataset.connected = 'false';
              b.textContent = 'Connect Wallet';
            });
            setStatus('Wallet disconnected.');
          }
        });
        window.ethereum.on('chainChanged', () => window.location.reload());
      }
    } catch (err) {
      setStatus('Connection rejected: ' + (err && err.message ? err.message : 'unknown'));
    }
  }

  function bind() {
    const buttons = document.querySelectorAll('.connect-btn');
    buttons.forEach(btn => {
      if (btn.dataset.bound === 'true') return;
      btn.dataset.bound = 'true';
      btn.addEventListener('click', () => connectWallet(btn));
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind);
  } else {
    bind();
  }

  // Re-bind in case buttons are added dynamically
  const observer = new MutationObserver(bind);
  observer.observe(document.documentElement, { childList: true, subtree: true });

  // Expose config for searchers
  window.SearcherPortal = {
    wsEndpoint: (location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host + '/ws',
    httpEndpoint: location.origin + '/api/opportunities',
    healthEndpoint: location.origin + '/api/health'
  };
})();