# TeamPulse

Sawai Associates employee portal built with React, Vite, Google Apps Script and Google Sheets.

## Local development

Requires Node.js 22.

```powershell
npm ci
npm run dev
```

Copy .env.example to .env.local and set APPS_SCRIPT_URL to the deployed Apps Script /exec URL. Restart the server after editing it. Never commit secrets.

## Tests and builds

```powershell
npm test
npm run test:roles
npm run build
```

Tests use mocked Google services and cover backend permissions, persistence, screen rendering and utilities. Live Google authorization and Sheet writes require verification after deployment.

npm run build:web generates dist/. npm run build also packages the Apps Script upload files in deployment/. Edit src/ and apps-script/, then rebuild. Generated files are overwritten; builds do not publish the live app.

## Folder structure

| Folder          | Purpose                                              |
| --------------- | ---------------------------------------------------- |
| src/pages/      | Application screens                                  |
| src/components/ | Shared UI and forms                                  |
| src/hooks/      | React hooks                                          |
| src/data/       | API client and options                               |
| src/utils/      | Business and formatting utilities                    |
| src/styles/     | Stylesheets                                          |
| src/assets/     | Bundled images                                       |
| src/i18n/       | Text and preference helpers                          |
| public/         | Static assets                                        |
| apps-script/    | Backend, authentication, manifest and vendor license |
| api/            | Vercel API entry point                               |
| server/         | Shared Apps Script proxy                             |
| scripts/        | Build and packaging scripts                          |
| tests/          | Automated checks and fixtures                        |
| docs/           | Current deployment guides                            |
| dist/           | Generated web build, ignored by Git                  |
| deployment/     | Generated Apps Script package, ignored by Git        |

## Deployment

- [Apps Script deployment](docs/apps-script-deployment.md)
- [Vercel deployment](docs/vercel-deployment.md)

Upload updated Code.gs and Index.html together and deploy a new Apps Script version. Updating local files does not update production.

## Accounts and storage

New users register as pending Employees. Admin/HR approves accounts; only Admin grants privileged roles. Settings supports profile name, joining date and password changes. Attendance saves punch times, locations and WFO/WFH, selected before punch-in and locked until punch-out.

The private Google Sheet stores business records, credentials, sessions and audit history. Backend session and role checks enforce access. Passwords use bcrypt; sessions are stored as token hashes. Legacy worklogs storage remains for existing records although its screen is removed.

Preserve apps-script/BCRYPT-LICENSE.txt and the synchronous Apps Script compatibility patch in Bcrypt.gs.
