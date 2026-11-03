# ShopPilot — AI Shopping Agent

A mobile-friendly wishlist and price-tracking dashboard for Amazon, Flipkart, Myntra, and other stores.

## Run locally

```bash
npm install
npm run dev
```

Build with `npm run build`.

## Current status

The dashboard includes wishlist UI, demo products, price history visualization, target-price insights, and a Telegram setup guide. Live retailer price checks require a compatible authorized price-provider API, Supabase configuration, and Telegram bot credentials. Never put secrets in frontend code.

## Deployment

Deploy to Netlify. Configure `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `PRICE_PROVIDER_URL`, `PRICE_PROVIDER_API_KEY`, `TELEGRAM_BOT_TOKEN`, and `TELEGRAM_CHAT_ID` in Netlify environment variables. Run `sql/schema.sql` in Supabase SQL Editor. The scheduled function uses the provider adapter contract documented in `netlify/functions/price-check.mjs`.

## Security note

The add-product function currently notes that authentication must be added before production use. Configure Supabase Auth and enforce user ownership before public deployment.