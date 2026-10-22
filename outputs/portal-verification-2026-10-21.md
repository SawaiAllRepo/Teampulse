# Portal verification — 21 October 2026

## Results

- `npm test`: 235 passed, 0 failed, 0 skipped.
- `npm run build`: passed; frontend, Apps Script HTML and combined deployment prepared. Vite reports a bundle size warning.
- Configured live Apps Script endpoint: read-only anonymous bootstrap returned valid JSON with `UNAUTHENTICATED`, as expected. This proves endpoint connectivity and anonymous access rejection only.
- Browser automation failed twice. Runtime reports Windows sandbox initialization failure (`helper_sandbox_lock_failed`, access denied). No browser user journey was completed.
- No live test records were created, and no private Google Sheet rows were inspected.

## Automated coverage

Existing tests run against mocked Google services. Screen checks render empty and populated data for Admin, HR, Team Leader and Employee; they do not click UI controls.

| Module | Passed local checks | Remaining live verification |
|---|---|---|
| Login and registration | Email lookup, registration defaults, approval, password hashing, lockout, sessions, logout | Sign in, register designated test users, approve and reopen sessions |
| Overview | Render for all roles; scoped backend data | Compare dashboard with actual saved records |
| Employees | Create, approval, role restrictions, deletion and session revocation | Create designated test employee and verify employees/credentials rows |
| Projects | Creation, role scope, deletion with related tasks | Save project, reload and inspect projects row |
| Tasks | Creation, ownership boundaries, status update | Assign task, update as assignee, reload and inspect tasks row |
| Attendance and location | Punch in/out, multiple sessions, dates, coordinates, snapshots and isolation | Use a test account with real location permission; inspect attendance/accessEvents rows and another authorized portal |
| Work logs | Persisted fields and server ownership | Submit log, reload and inspect worklogs row |
| Leave requests | Pending ownership, dates, overlap and approval permissions | Submit and review request; inspect leaves row |
| Announcements | Create/delete and role boundaries | Publish designated test notice; inspect announcements row |
| Settings | Profile validation, password change and session revocation | Update test profile/password and sign in again |
| Transport | Request validation, backend restrictions, error handling | Repeat authenticated workflows through actual hosted frontend |

## Completion criteria for live testing

Use designated test accounts for the four roles and clearly labeled test records. For each supported action: perform it through the portal, confirm success, reload or log back in, and independently compare the resulting private Sheet row. Verify forbidden actions for each role. Record row IDs and outcomes without storing passwords or session tokens. Real Sheet persistence and complete user experience remain unverified until these steps are completed.
