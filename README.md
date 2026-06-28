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

1. **Settings → Pages → Build and deployment → Source: GitHub Actions**
2. В репозитории: **Settings → Secrets and variables → Actions** → добавь `VITE_API_URL` (HTTPS tunnel/API)
3. Push в `main` — workflow соберёт `dist/` и задеплоит автоматически

```bash
npm run build   # локально: dist/ с base /ai-tg-bot-miniapp/
```

**Важно:** нельзя деплоить исходники — на Pages должен быть только `dist/` (иначе белый экран: браузер ищет `/src/main.tsx`).

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
