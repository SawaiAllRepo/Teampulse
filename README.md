# TeamPulse

Sawai Associates employee portal using React, Google Apps Script and Google Sheets. All business records, password hashes and sessions persist in a private Google Sheet. No Java, MySQL, demo records or browser-only business-data saves.

## Employee self-registration

1. Everyone starts by entering their email and selecting Continue. The backend checks whether that email already has account credentials.
2. Existing email: show only password entry. New email: show profile fields plus create/confirm password. There is no separate login/signup choice.
3. The backend saves an Employee / Pending profile in employees and a bcrypt hash in credentials. A new registration cannot choose an Admin, HR or Team Leader role.
4. Admin or HR checks the applicant's identity using company procedures and clicks Approve account in Employees.
5. The employee logs in with the email and password they chose. HR and Team Leaders register the same way; Admin grants their role afterward.
6. Settings allows password changes. The sidebar provides logout. Disabling an employee blocks existing sessions.

Email is an account identifier, not verified Google identity. There is no Gmail sign-in or OTP. Use a separate TeamPulse password. Admin/HR approval must confirm identity because the supplied email is not verified electronically. Password recovery is not implemented yet.

## Your configured Google Sheet

Target: https://docs.google.com/spreadsheets/d/1zsY6TWHvstFcN39kAGQziLwJG-jztdGwllS3SU-RxLs/edit

The ID is already configured in Code.gs. No access to the real Sheet has been established from this environment. Upload-ready files are in deployment/ after running npm run build. Follow [the Apps Script deployment guide](docs/apps-script-deployment.md) for the remaining account steps.

## Connect the real Google Sheet

1. Create a private Google Sheet. The Sheet ID is the part of its URL between /d/ and /edit.
2. Open Extensions > Apps Script.
3. Add Code.gs, Auth.gs and Bcrypt.gs from apps-script. All three are required. Create an HTML file named Index and copy deployment/Index.html into it.
4. Enable the manifest in Project Settings and copy apps-script/appsscript.json.
5. Add the following Script Properties. Never put passwords in frontend environment variables or share them in chat.

| Property | Value |
| --- | --- |
| SPREADSHEET_ID | Your private Sheet ID |
| ADMIN_EMAIL | Initial administrator's login email |
| ADMIN_INITIAL_PASSWORD | Initial Admin password chosen by the owner, 12 characters minimum and 72 UTF-8 bytes maximum |

6. Run setup() and authorize spreadsheet access. This creates missing tabs and the initial Admin credentials. ADMIN_INITIAL_PASSWORD is removed from Script Properties once its hash is saved. Existing passwords are not overwritten.
7. Deploy as a Web app executing as the owner. The owner approved public deployment access on 14 October 2026. Set Who has access to Anyone (not Anyone with a Google account), with Execute as Me. The app still requires its own password/session and account approval for business data. The local manifest declares ANYONE_ANONYMOUS / USER_DEPLOYING; the live deployment must be updated separately.
8. Open the /exec deployment URL. Log in using the initial Admin credentials. Other allowed users can create their own TeamPulse accounts on the same page.
9. Approve new employees under Employees and assign roles there. Only Admin can grant Admin/HR access.
10. After frontend changes run npm run build, replace Index.html, and update the deployment version. Update the script files when backend code changes.

The spreadsheet stays private to trusted administrators. Employee actions go through server permission checks. A Sheet link alone does not authorize or deploy the backend. The app entry point may be public after the owner updates the deployment, while spreadsheet sharing remains private. Public entry-point access does not grant access to employee records. The remote deployment update is not confirmed yet.

### Existing installations

Run setup() again to create credentials and sessions tabs; business sheet headers are unchanged. An existing ordinary Employee profile without credentials can self-register with the same email, returning to Pending for approval. A privileged pre-created account cannot be claimed through public registration. Register new HR/Team Leader accounts as Employee first, then grant the role. Only owner-run setup() initializes the first Admin password.

## Local development

```powershell
npm install
npm run dev
npm test
npm run build
```

Localhost shows the actual login and registration screens without fake records. The optional APPS_SCRIPT_URL setting in .env.local configures a development proxy to a reachable deployed backend; copy .env.example and restart the server after editing it. The proxy does not bypass Google deployment access restrictions. With organization-restricted hosting, use the deployed Apps Script page, since a server-side development proxy does not carry your Google browser session. Missing or inaccessible backends show a connection error.

Build outputs are dist/ and deployment/, including a self-contained deployment/Index.html with the bundled Sawai logo. A static dist upload does not include an API proxy.

## Stored data

| Sheet | Records |
| --- | --- |
| employees | Registered profiles, email, designation, department, role and status |
| projects | Project owner, details, dates and status |
| tasks | Project, assignee, priority, dates and status |
| attendance | Employee, India working date, server-recorded punch in/out |
| worklogs | Employee, date, accomplishments, hours and blockers |
| leaves | Employee, dates, reason, status and reviewer |
| announcements | Company notices |
| audit | Actor, action, target and timestamp |
| credentials | bcrypt hashes, failed attempts, lockout expiry and last login |
| sessions | Hashed session tokens, expiry and revocation |

Credentials, sessions and audit tables are not included in dashboard responses. Every protected action checks the current employee status/role. Employees see their own records, leaders see owned projects and associated task assignees, and HR/Admin see organization-wide records. Business data refreshes from saved records after a write and every 60 seconds. Failed writes show errors.

Email-first lookup intentionally reveals only whether credentials exist for the entered email, as required by the sign-in flow. It returns no profile or role information and is rate-limited. Pending or inactive accounts still go to password entry; their access status is checked only after password verification.

## Password and session design

- Server-side bcrypt cost 12 and unique salts. Passwords require 12 characters and are limited to 72 UTF-8 bytes without silent truncation.
- Opaque sessions expire after eight hours. Only session token hashes are saved in Sheets. The browser stores its token in sessionStorage and never persists the password.
- Five failed password attempts lock an account for 15 minutes. Script-wide durable registration/login request caps also limit attempts.
- Logout revokes the current session. Password changes revoke all sessions; disabled accounts fail authentication immediately.
- Script locks serialize writes. Sheets does not provide SQL transactions; direct spreadsheet edits bypass portal checks. Keep private backups and periodically archive expired session rows.
- Bcrypt.gs is vendored from bcryptjs 3.0.2 under BCRYPT-LICENSE.txt. Its initialization fallback for missing setTimeout is patched to reject async use; the backend uses synchronous bcrypt APIs. Preserve this compatibility patch on upgrades.

## Verification and limitations

Run npm test to verify backend, attendance, location and proxy behavior. Tests cover registration defaults, bcrypt verification, approval, role boundaries, lockout, expiry, logout, password changes and module persistence with mocked Google services. Actual registration, authorization and Sheet writes must be checked after connecting and deploying the real Sheet. Browser visual verification failed because the automation runtime could not start in this environment. No real account, password, deployment or Sheet was created during local implementation.

Password recovery, separate team membership editing, task comments/history, notifications, exports and advanced reports remain future work. Load-test Apps Script before a large rollout.

Brand reference: https://www.sawaiassociates.com/ inspected 14 October 2026. Actual bundled Sawai logo; navy #0B1F44, pink #E6007E, background #F5F7FB. Sidebar navigation scrolls independently while brand/profile remain visible.

## Vercel hosting without GitHub

Production support is in api/teampulse.js and vercel.json. Use npm run build:web for Vercel; the full npm run build also produces the Apps Script HTML bundle. See [the Vercel deployment guide](docs/vercel-deployment.md) for CLI login, APPS_SCRIPT_URL configuration and deployment steps. Google Sheets remains the backend. Vercel account authorization is required to publish; local configuration alone does not create a deployment.

## Account access and punch in/out location

All four roles use the same login. Admin/HR can open Settings > Set up account password for pre-created accounts without credentials. Only Admin can provision Admin/HR credentials. Existing passwords cannot be overwritten with this action.

Punch in and punch out each request a fresh device location (20-second high accuracy attempt, then a 10-second network fallback). Each attempt has a 60-second overall deadline to allow time for the permission prompt. The current UI saves a punch only after successful capture; denial or failure leaves attendance unchanged. The backend validates required coordinates before writing. Coordinates, accuracy and timestamps are stored in the private accessEvents tab, linked to each attendance row and punch direction. The attendance table shows both saved locations and filters by an IST date, Today or All dates. Admin/HR see all authorized records; other roles see their authorized attendance and only personal coordinates. There is no background tracking. Browsers remember permission choices, so a new popup is not guaranteed on each click. HTTPS and device Location Services are required. If Apps Script embedding blocks geolocation, use the standalone HTTPS frontend. Device coordinates may be approximate or spoofed.

Deploy both updated backend and frontend. The UI checks the backend version before sending a location-required punch; an outdated backend cannot silently record that punch without the new validation.

Logout clears local workspace/session even if offline; an unconfirmed server logout is reported. Server sessions otherwise expire after eight hours. Redeploy both deployment/Code.gs and deployment/Index.html as a new Apps Script version. The accessEvents tab is created automatically. Live browser/Google Sheet verification still requires the connected deployment.

Attendance repair: legacy ISO strings in calendar-date cells are normalized to IST before matching punch-out. Open duplicate records are preferred over completed rows without deleting history. Attendance controls identify the signed-in person; Admin viewing another employee does not act as that employee. Automatic refresh no longer disables punch controls; older in-flight reads are ignored after a mutation. Read-only bootstrap/history requests no longer take the global mutation lock.

Cross-portal attendance: attendanceSnapshot returns only authorized attendance plus saved location events. Visible signed-in portals poll every 10 seconds and refresh on focus. A compact punch response includes its persisted location event, bound to attendance ID and punch direction. Admin/HR Overview includes today's team punches. Employee Overview restores saved punches/coordinates after login. Old full-workspace responses cannot overwrite newer attendance snapshots. Existing deployments must update Code.gs as well as frontend files; an old backend reports a visible sync compatibility error. Map embeds and map links have been removed throughout the portal at the user's request. Saved coordinates, accuracy and punch timestamps remain available.

## Project structure

| Path | Purpose |
| --- | --- |
| src/ | App.jsx composition and main.jsx entry point |
| src/assets/ | Bundled brand images |
| src/components/ | Shared tables, search and punch location display |
| src/data/ | Backend requests and session access |
| src/hooks/ | Attendance refresh lifecycle |
| src/pages/ | Login and all nine workspace screens |
| src/styles/ | Application stylesheet |
| src/utils/ | Attendance, date/time and geolocation helpers |
| public/ | Optional files served without bundling |
| apps-script/ | Editable Google Apps Script backend, manifest and vendored bcrypt license |
| api/ | Vercel API entry point |
| server/ | Shared backend proxy used by Vite and Vercel |
| scripts/ | Build and deployment packaging scripts |
| tests/ | Automated Node.js tests |
| docs/ | Apps Script and Vercel deployment guides |
| dist/ | Generated web build; recreated by npm run build:web |
| deployment/ | Generated Apps Script upload package; recreated by npm run build |

Edit source files rather than generated output. Keep .env.local private and preserve .vercel/ for the local Vercel project link. Dependencies stay in node_modules/ and can be restored with npm ci. Generated output and local configuration are excluded by .gitignore.

Attendance supports multiple punch-in/out sessions per IST date: an open session must be punched out before another starts. Completed sessions and their separate punch locations remain in date-wise history. A successful saved punch shows a confirmation popup with its server-recorded time.

Sheet tables may contain extra columns after the required schema (for example, Google Sheets Table Column 1). Reads ignore these additional columns and punch updates preserve their values. Required columns must retain their names and order.

## Module verification (19 October 2026)

`npm test` passes 195 tests, including 80 screen render scenarios (10 screens, four roles, empty and populated data) plus the screen-suite wrapper. Backend, authentication, permissions, attendance, location and proxy tests use mocked services. `npm run build` verifies production compilation and regenerates the Apps Script upload package. See [verification details](docs/module-verification.md).

Source changes belong in `src/`, not generated `deployment/Index.html`. The original project is retained in `backups/structure-20261019-183043/`, excluded from Git and Vercel uploads. No chatbot module existed in this project, so no placeholder chatbot folder was added.

## Four-role test cases

Run `npm run test:roles` for 40 dedicated Employee, Admin, Team Leader and HR cases. The full `npm test` suite now passes 235 tests. See [test cases and execution report](docs/role-test-cases.md) for steps, expected results and recorded outcomes.
