# GetContact Next.js (Migrated)

This project is a migration of a CLI PHP GetContact checker into a Next.js web app.
**Important:** This app automates requests to `getcontact.com` and uses VerifyKit endpoints.
Make sure you have permission to check any phone number — do **not** use the app to gather personal data without consent.

## Local development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run development server:
   ```bash
   npm run dev
   # open http://localhost:3000
   ```

## How it works (flow)
- Frontend sends phone number to `/api/getcontact/start`.
- Server fetches `https://getcontact.com/id/manage` and extracts tokens.
- Server calls VerifyKit start endpoint and returns a WhatsApp deeplink for user to click and send verification.
- Frontend polls `/api/getcontact/check` with returned token+phone to see verification status.
- Once verified, server calls `https://getcontact.com/validation-verifykit-check` and then fetches `/id/manage/profile` to parse saved contact labels.

## Deploy to Vercel
1. Push this repo to GitHub.
2. Connect the GitHub repo to Vercel and import the project.
3. Use default settings (Next.js). `vercel.json` is included.

## Files included
- `app/page.jsx` — frontend UI
- `app/api/getcontact/route.js` — API endpoints (start & check)
- `vercel.json` — Vercel config

## Security & Legal
- This app scrapes and automates verification flows of a third-party service. Use responsibly.
- Do not store or share tokens returned by the service.
