# Sprint Plan: Local Telegram Bot Development

## Goal
Adapt the NKH Restaurant Laravel application to run and receive Telegram webhooks on a local development environment since Render deployment is unavailable.

## Background
The application integrates with Telegram for order management and notifications. Webhooks require a public HTTPS URL, which we will provide using a tunneling service (ngrok or localtunnel).

## Phase 1: Environment Preparation (Local Machine)
1. **Database Setup**
   - Ensure MySQL is running locally (current config: port 3307).
   - Verify database `nkh_restaurant` exists.
   - Run migrations if necessary: `php artisan migrate`.

2. **Environment Configuration (`.env`)**
   - Set `APP_ENV=local`.
   - Set `APP_DEBUG=true`.
   - Update `DB_CONNECTION=mysql`, `DB_HOST=127.0.0.1`, `DB_PORT=3307`.
   - Update `TELEGRAM_BOT_TOKEN` (ensure it's the correct token).
   - Prepare for `TELEGRAM_WEBHOOK_URL` update.

## Phase 2: Tunneling and Webhook Registration
1. **Start Tunneling Service**
   - Use `ngrok` or `localtunnel` to tunnel port 8000.
   - Command: `ngrok http 8000` or `lt --port 8000 --subdomain nkh-bot-local`.
   - Get the public HTTPS URL (e.g., `https://xxxx.ngrok.io`).

2. **Update Webhook URL**
   - In `.env`, set: `TELEGRAM_WEBHOOK_URL=https://xxxx.ngrok.io/api/telegram/webhook`.

3. **Register Webhook with Telegram**
   - Run: `php artisan telegram:setup webhook --url=https://xxxx.ngrok.io/api/telegram/webhook`.
   - Verify with: `php artisan telegram:setup info`.

## Phase 3: Development & Testing
1. **Start Local Services**
   - Laravel: `php artisan serve`.
   - Queue: `php artisan queue:work`.
   - Tunnel: Keep ngrok/lt running.

2. **Verification Steps**
   - Send `/start` to the bot on Telegram.
   - Check `storage/logs/laravel.log` for incoming webhook payload.
   - Verify bot responses (keyboards, messages).
   - Test order flow to ensure notifications are sent locally.

## Risks & Mitigations
- **Tunnel Timeout/Restart**: Tunnels often change URLs on restart.
  - *Mitigation*: Re-run `telegram:setup` command whenever the tunnel restarts.
- **Port Conflict**: Port 3307 or 8000 might be in use.
  - *Mitigation*: Check active processes and change ports if needed.

## Success Criteria
- [ ] Local Laravel server receives a POST request at `/api/telegram/webhook`.
- [ ] User receives an automated response from the bot when sending a message.
- [ ] Local database is updated with Telegram user/order info.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
