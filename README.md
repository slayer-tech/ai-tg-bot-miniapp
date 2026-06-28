# AI TG Bot — Telegram Mini App

React + Vite фронтенд для [ai_tg_bot](https://github.com/youruser/ai_tg_bot).

## Локальная разработка

```bash
npm install
cp .env.example .env
# VITE_API_URL — URL вашего API (localhost или cloudflared tunnel)
npm run dev
```

Открывайте через бота (WebApp), не в обычном браузере — нужен `initData`.

## GitHub Pages

1. Создайте репозиторий и включите Pages (branch `gh-pages` или `/docs` — как удобно).
2. Скопируйте `.env.production.example` → `.env.production`:

```bash
VITE_API_URL=https://your-tunnel.trycloudflare.com
VITE_BASE_PATH=/ai-tg-bot-miniapp/
```

3. Сборка:

```bash
npm run build
# dist/ → задеплойте на Pages
```

4. В BotFather укажите URL Mini App.
5. В `.env` бэкенда:

```
MINI_APP_URL=https://youruser.github.io/ai-tg-bot-miniapp/
CORS_ORIGINS=https://youruser.github.io,http://localhost:5173
```

## API tunnel (бэкенд)

На сервере с ботом:

```bash
./scripts/tunnel.sh
# скопируйте HTTPS URL в API_PUBLIC_URL и VITE_API_URL
```
