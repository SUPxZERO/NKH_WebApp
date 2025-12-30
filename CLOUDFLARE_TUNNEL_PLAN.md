# Sprint Plan: Switching to Cloudflare Tunnel

## Goal
Replace Localtunnel/ngrok with **Cloudflare Tunnel (cloudflared)** for more stable and faster local development of the Telegram bot and NKH Restaurant WebApp.

## Background
Current tunneling solutions are experiencing high latency. Cloudflare Tunnel provides a persistent, secure connection between your local environment and the internet with significantly better performance.

## Phase 1: Cloudflare Setup (Developer Actions)
1. **Install cloudflared CLI**
   - Download from: https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/install-run/
2. **Authenticate & Start Tunnel**
   - Command: `cloudflared tunnel --url http://127.0.0.1:8000`
   - Capture the generated `*.trycloudflare.com` URL.

## Phase 2: Application Configuration
1. **Update `.env` Variables**
   - `APP_URL`: Set to the new Cloudflare URL.
   - `VITE_APP_URL`: Set to the new Cloudflare URL.
   - `TELEGRAM_WEBHOOK_URL`: Update to `{CLOUDFLARE_URL}/api/telegram/webhook`.
2. **Sanctum Configuration**
   - Ensure the new domain is added to `SANCTUM_STATEFUL_DOMAINS` in `.env`.

## Phase 3: Webhook Registration & Verification
1. **Register New Webhook**
   - Run: `php artisan telegram:setup webhook --url=https://[YOUR-ID].trycloudflare.com/api/telegram/webhook`.
2. **Clear Application Caches**
   - Run: `php artisan optimize:clear`.
3. **Verification**
   - Verify health check: `https://[YOUR-ID].trycloudflare.com/api/telegram/debug`.
   - Test bot interaction in Telegram.

## Benefits
- **Stability**: Cloudflare tunnels rarely "lock up" or time out like Localtunnel.
- **Speed**: Persistent connections reduce handshake overhead.
- **SSL**: Valid Cloudflare certificates handled automatically.

## Success Criteria
- [ ] Application returns healthy status via Cloudflare URL.
- [ ] Telegram bot responds instantly to `/start`.
- [ ] Frontend assets load fast via the tunnel.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
