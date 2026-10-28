# TeamPulse - this Sheet is already configured

Sheet: https://docs.google.com/spreadsheets/d/1zsY6TWHvstFcN39kAGQziLwJG-jztdGwllS3SU-RxLs/edit

Status (28 October 2026): the configured Apps Script endpoint is reachable and returns an authenticated-session requirement. Updated local code/package is ready. The updated version has not been deployed from this environment, and live spreadsheet writes have not been verified. See [CRUD verification](crud-verification.md).

## Remaining account steps

1. Open the linked Sheet in your Google account. Select Extensions > Apps Script.
2. Run `npm run build`, then paste deployment/Code.gs into the editor's Code.gs. It already contains the backend, authentication and bcrypt library; do not also add separate Auth.gs/Bcrypt.gs copies. Add an HTML file named Index and paste Index.html.
3. Project Settings: enable the manifest and replace appsscript.json with the supplied manifest.
4. Script Properties: add ADMIN_EMAIL (your email) and ADMIN_INITIAL_PASSWORD (a new TeamPulse password of at least 12 characters, maximum 72 UTF-8 bytes). Enter the password privately in Google, not in chat. SPREADSHEET_ID is already configured in Code.gs and does not need another property.
5. Select setup from the function dropdown and click Run. Approve the requested Google spreadsheet permission. Setup creates employees, projects, tasks, attendance, worklogs, leaves, announcements, audit, credentials and sessions tabs. The initial password is hashed, then removed from Script Properties.
6. Deploy > New deployment > Web app. Execute as yourself. Set Who has access to Anyone (not Anyone with a Google account), as approved by the owner. Existing deployments: Deploy > Manage deployments > Edit (pencil) > Version: New version > Deploy. Upload the supplied manifest as well if needed. The live setting must be saved in Google; changing local files alone does not update it. Open the returned /exec URL and log in with the initial Admin credentials.
7. Test a new account: new email > create password/profile > approve in Employees as Admin > log in as that employee > punch in/out and create a work log. Check the corresponding spreadsheet rows. Create a project/task as Admin and verify those rows too.

If organization policy prevents the Anyone option, the owner must resolve that policy restriction. Keep the underlying spreadsheet private.

For local development after a reachable deployment is available, set APPS_SCRIPT_URL in .env.local and restart npm run dev. The proxy can connect only after Google allows requests without a Google browser session. TeamPulse itself still validates app sessions.

To regenerate this folder after changes:

    npm run build

A separate .gs file may be used instead of the combined file, but never include both forms together. BCRYPT-LICENSE.txt is retained for the vendored library. No account secrets are included in this package.

## If the frontend reports an outdated backend

Replace Code.gs with the complete generated deployment/Code.gs (including authentication and bcrypt); do not leave older Auth.gs or Bcrypt.gs alongside this combined file. Replace Index with the complete deployment/Index.html. Save both, then edit the existing deployment and choose New version before deploying. Reopen its /exec URL.

When using Vercel or localhost, APPS_SCRIPT_URL must point to this updated deployment. Creating a different deployment leaves an old configured URL serving old code. If the URL changed, update the local or hosting environment and restart/redeploy the frontend. Updating HTML alone does not update backend actions.
