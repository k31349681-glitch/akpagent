# Elon Reply Agent

A fast, mobile-first Next.js app that fetches an X post and generates a concise reply or quote-post reaction through OpenRouter.

## Local setup

1. Copy `.env.example` to `.env.local`.
2. Add an OpenRouter API key.
3. Run `pnpm install` and `pnpm dev`.
4. Open `http://localhost:3000`.

## Deploy to Vercel

Import the repository into Vercel, then add `OPENROUTER_API_KEY` in Project Settings → Environment Variables. Optionally set `OPENROUTER_MODEL` and `NEXT_PUBLIC_APP_URL`, then deploy.

The app uses the public FxTwitter API for post lookup and does not require auth or a database.
