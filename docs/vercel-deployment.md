# Deploy TeamPulse to Vercel without GitHub

The frontend and production /api/teampulse function are ready. The function forwards authenticated requests to the existing Apps Script backend; Google Sheets remains the data store. The Google Sheet itself stays private.

## Account authorization

From C:\TeamPulse:

```powershell
npx vercel login
```

Complete the Vercel login in your own browser. Never paste your account password or Vercel token into chat.

## First production deployment

```powershell
npx vercel
```

Select your Vercel account/team and create or select the TeamPulse project. The checked-in vercel.json selects Vite, the dist output, npm run build:web, and a 60-second API function duration. Node 22 is declared in package.json.

In Vercel Project Settings > Environment Variables, add APPS_SCRIPT_URL with the existing Google Apps Script /exec URL from your local .env.local. Enable it for Production and Preview. Do not use a VITE_ prefix: this variable belongs on the server.

Then deploy production:

```powershell
npx vercel --prod
```

GitHub is not required. Future local changes deploy with the same command. New Apps Script backend versions still need to be deployed in Google separately.

## Verify after deployment

Open the resulting URL, enter your existing email and verify password entry appears. Log in with your own password. Check dashboard loading, then test attendance only when you intend to record actual attendance. Confirm saved rows in the private Sheet. Do not create fake staff or attendance in the live Sheet just to test connectivity.

The Apps Script web-app entry point must retain the owner-approved access setting so Vercel's server can reach it without a Google browser session. App roles, passwords, account approval and sessions still protect business records.

## Included files

- api/teampulse.js: Vercel Node function.
- server/apps-script-proxy.js: shared local/production transport and validation.
- vercel.json: Vercel project configuration.
- .vercelignore: excludes local environment files, generated Apps Script bundles, and tests from upload.

The development proxy and production API use the same transport, including 32 KB request limits, backend URL restrictions, safe errors, and no-store responses. No credentials or request bodies are logged by the proxy.

If login shows backend-not-configured, add APPS_SCRIPT_URL and redeploy. If Google access is rejected, check the approved Apps Script deployment audience. If the deployment URL changes, update the Vercel environment variable and redeploy.
