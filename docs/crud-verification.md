# CRUD and Google Sheets verification — 28 October 2026

All record changes use the authenticated Apps Script API. The interface updates after the server confirms a saved record and returns the authorized workspace. There is no local-only CRUD store. Failed writes remain visible as errors. Mutations take the Apps Script lock and write an audit entry.

| Module | Available actions | Who can change records | Google Sheets behavior |
| --- | --- | --- | --- |
| Employees | Add, view, edit profile details/email, change access, delete | Admin/HR; HR cannot manage other privileged accounts | Profile edits update employees; email changes also update credentials. Delete marks status Deleted and revokes sessions while retaining attendance/work history. |
| Projects | Add, view, edit, delete | Admin/HR; leaders create and edit owned projects | Edits update the project row; Admin/HR deletion removes the project and linked task rows. |
| Tasks | Add, view, edit details/assignment, update status, delete | Admin/HR or the owning team leader; assignees can update task status | Updates and deletions change the tasks tab. Leaders cannot move a task to somebody else's project. |
| Attendance | Punch in/out, view, export; add/correct completed sessions and delete | Personal punches for all roles; corrections/deletions only Admin/HR | Punches and corrections update attendance. Delete removes the attendance row; original captured location events and audit history remain retained. Corrections use IST and reject overlaps, future times and reversed times. |
| Work logs | Add, view, edit, delete | Owner or Admin/HR | Updates keep the original employee ID; delete removes the worklogs row. |
| Leave requests | Add, view, edit, delete, approve/reject | Owner edits/deletes pending requests; Admin/HR reviews others' requests | Edits update leaves; delete removes the pending request row. Reviewed requests stay locked. |
| Announcements | Add, view with creator, edit, delete | Admin/HR | Updates and deletion change announcements. Creator is resolved from the original server audit. |
| Settings | Update profile name, change password, provision initial password | Signed-in user; privileged provisioning remains restricted | Writes employees, credentials and sessions through the existing authenticated actions. |
| Overview | View summaries and open related modules | Authorized workspace scope | Derived from saved module data, with task status and punch actions using the same server mutations. |

## Evidence

Automated tests cover create/read/update/delete round trips through the mocked Google Sheets adapter, stored row changes, refreshed reads after deletion, immutable fields, role boundaries, employee email/login consistency, attendance overlap/date checks, IST conversion and all module edit-form rendering. These tests do not claim real Google Sheet writes.

A read-only probe of APPS_SCRIPT_URL from the local configuration returned HTTP 200 with UNAUTHENTICATED on 28 October 2026. This confirms that the Apps Script API is reachable and enforces authentication. It does not prove signed-in spreadsheet read/write access.

Visual automation could not start because the Windows sandbox helper failed with helper_sandbox_lock_failed / SetNamedSecurityInfoW error 5. Server-rendered screen and editor checks passed; interactive browser verification remains outstanding.

## Activate and check the live version

Run npm run build. Update the existing Apps Script project with deployment/Code.gs and deployment/Index.html, save, and deploy a New version using the existing deployment URL. Do not duplicate the combined backend with separate Auth.gs or Bcrypt.gs files. No Sheet schema migration is needed for these CRUD additions.

If the frontend is hosted on Vercel, deploy the updated frontend too. Keep APPS_SCRIPT_URL pointed at the updated Apps Script deployment. This workspace does not contain an authenticated Apps Script CLI project/session, so the live backend has not been redeployed by this change.

After deployment, sign in with an authorized account and verify one intended create/edit/delete in each relevant module against the corresponding private Sheet tab. Refresh the app to confirm persistence. Use a separate test spreadsheet for fake staff or attendance. Never enter fake attendance into the live Sheet merely to test connectivity.

## Existing department matching (28 October 2026)

Admin/HR can open Settings > Match existing departments. The table compares the current employee/project department with the same canonical dropdown used at signup and in employee/project forms. Clear spelling, punctuation and case variants receive suggestions; employee designation is considered only when the existing department has no clear match. An existing valid dropdown department takes priority over designation. Ambiguous values such as IT or Engineering remain unassigned until the reviewer selects a department, unless a specific designation provides a clear suggestion. Unknown values are not silently moved to Others.

Review the suggested assignments, choose remaining values from the dropdown, then use Save department assignments. The All departments filter also allows reassignment of already-standardized records. Each submitted assignment updates only the department cell through the authenticated API; profile IDs, roles, access, credentials, project owners and work history remain unchanged. HR cannot reassign other Admin/HR accounts. Deleted employees are excluded.

The backend validates the full submitted batch before writing and rejects stale previous-department values, duplicates, unsupported departments and protected records. Large saves are split into small requests; a failed later request reports partial progress so the reviewer can refresh and review the remainder. Ordinary Google service write failures are not transactional across rows.

No live existing-data migration has been executed from this workspace. Deploy the generated backend/frontend and save the reviewed matches in the signed-in application to apply them to the live Sheet.

## Notification delivery once per browser

Notification delivery and read/dismissed markers now persist per account in the same browser. Refresh, logout/login, reopening the app and duplicate workspace/attendance syncs do not replay an already-delivered event. Existing records populate the inbox without startup pop-ups; genuinely different record updates retain their notifications. Dismiss and Mark all read preserve read state. Open tabs consult the same browser receipt storage.

Only opaque fingerprints are kept in persistent browser storage; notification message history stays in tab-scoped session storage. These receipts are not synchronized between different browsers/devices, and clearing site storage resets them. When persistent storage is unavailable, duplicate suppression continues in memory during the open app session.

## Shared Admin / Team Leader task form

Admin and Team Leader now use the same task create/edit form. Required fields are title, description, assignee and priority. Project can be None, due date can be No due date, priority adds Urgent, and status options are To do, In progress, Blocked, In review and Completed. New tasks default to To do. Existing Done tasks display and count as Completed.

Both roles can select active employee names. Team Leaders receive a minimal id/name assignment directory without access to unrelated employee profile, attendance or leave records. A task without a project is managed by the Admin/HR/Team Leader who creates it; its assignee can view it and update its status. Project tasks retain the existing project-owner restrictions.

The tasks Sheet retains its first eight columns and gains description, attachments and managerId columns on the first task write. Existing unrelated extra columns are preserved. Description and attachment-link edits persist through the same authenticated CRUD API. Up to 10 http/https links are supported, or None.

Binary file uploads remain disabled pending explicit approval for new Google Drive storage access. Automatic approval review rejected the proposed Drive scope and file create/read/delete capability because that expanded access had not been explicitly authorized. No Drive permissions were added, no Drive API code was installed, and no account access was changed. Links work without new Google permissions. Drive storage uses a new permission as documented in [DriveApp](https://developers.google.com/apps-script/reference/drive/drive-app); the workspace owner would also need to authorize that permission during deployment if approved later.

Deploy the updated backend and frontend together before using the new fields in production. Live Sheet writes have not been tested from a signed-in production session.

## Employee account deletion

The Employees delete button now opens a server-backed review dialog. For Admin/HR, the new deleteEmployeeAccount action physically removes the profile row plus its credential/session rows from Google Sheets, after explicit permanent-deletion confirmation. Self deletion and HR changes to other privileged accounts remain blocked. Assigned tasks, managed standalone tasks and owned projects must be reassigned before account deletion; the delete operation does not transfer or remove shared work automatically.

Attendance, work logs, leave requests, saved locations and audit history are retained. The broader historical-data purge was rejected by automatic approval review because the irreversible scope exceeded the screenshot/account deletion request; it has not been implemented. A permanent account deletion adds an audit receipt.

Previously soft-deleted accounts can be displayed with Show previously deleted accounts and removed through the same review flow. The old deleteEmployee API remains a compatible soft-delete path for older frontends; the updated interface uses the new permanent account endpoint and must be deployed with the updated backend. Live employee data has not been deleted from this workspace.

## English/Hindi and light/dark mode

Language and theme controls are available on the login screen, in the app header for all roles, and in Settings > Appearance & language. Choices persist in the same browser and synchronize across open tabs. The app sets the document language and color scheme, uses dark surfaces for cards, forms, tables, notifications and dialogs, and keeps the controls usable on mobile.

Hindi applies to navigation, headings, action buttons, form/table labels, controlled department/priority/status choices, account screens and supported notification templates. Employee/project names, user-entered descriptions and other record content are preserved. Select option values sent to the API remain the canonical English values. Stored dates and exports continue to use IST.

Manual Refresh buttons were removed from the header, attendance module and Settings. Background attendance sync, workspace polling and focus/visibility sync remain active. Appearance/language changes do not reload the app or create new notifications.

Verification includes all module screens in English and Hindi across four roles, preference storage tests, and a real isolated headless Edge session with fake local-only records. Browser checks cover both themes/languages, persistence after reload, canonical task submission values in Hindi, automatic attendance sync without a Refresh button, no page exceptions and a 390-pixel mobile layout. Reviewed screenshots are outputs/ui-preferences-dark-hi.png and outputs/ui-preferences-mobile-hi.png. Run node scripts/check-ui-preferences.mjs to repeat the isolated browser check; it does not access live accounts or Sheets.

Deploy the updated frontend (and generated Index.html for Apps Script hosting) to activate these changes in production. No new Google permissions are required.

Work logs is retired from app navigation, screens, add/edit forms and notifications. Cached work-log inbox entries are filtered out. Existing Google Sheets history and legacy backend compatibility are retained.

Team presence: all signed-in roles can open Employees and view a limited directory with today’s IST attendance hours, punched-in state and approximate online status (authenticated request within 120 seconds). Automatic 10-second snapshots refresh summaries. Overlapping attendance intervals are merged and clipped at IST midnight. Private employee contact data, locations, sessions and detailed attendance remain role-scoped. No new Sheet columns are required. Deploy frontend and backend together.

Leave requests: account name is read-only; Casual/Sick/Earned-Annual/Unpaid/Other, full or half day (first/second half), calculated total and reason share one create/edit dialog. Monday–Saturday is the default work week; Sunday and configured holidays are excluded. Admin/HR can set working days, holiday dates and the designated approver in Settings. Each new request stores its assigned approver and server-calculated total. Only that approver can decide it, with a required rejection reason; self-review is blocked. Existing unassigned legacy requests remain reviewable by Admin/HR. Opposite half-days can coexist; overlapping working portions are rejected. Old Sheet columns and custom data are preserved when leave columns are appended on first write. Deploy updated Code.gs and Index.html together.

Application copy uses plain workspace language throughout English and Hindi: save/edit buttons, success messages, sidebar connection label, settings, login help, department assignment feedback, connection errors, and deletion confirmations no longer name the storage provider. Data storage and synchronization behavior remain unchanged.

Language switching is removed from login, the app header and Settings. The app always opens in English, including for previously saved Hindi preferences. Light/dark mode still persists independently.

Employees directory: every authenticated role receives the full non-deleted employee directory through bootstrap and automatic attendance snapshots. It is independent of online-status summaries; private profile and attendance access remains scoped. Deploy the latest backend Code.gs together with Index.html; an older backend that returns only the signed-in profile cannot supply the full directory.

Attendance displays online status and shift hours. The shift is 09:30–18:30 IST (9 hours). Worked time uses saved punches, includes open sessions up to the current time, merges overlapping sessions, and includes time outside the shift. Employee-directory totals use the same calculation. Attendance rows show each session’s shift hours and the employee’s current online status. Today’s own total and remaining shift hours update automatically. No break deduction is assumed.

Attendance summary cleanup: Worked today, Remaining shift hours and Online status cards are removed. Shift information and the attendance table’s working-hours/current-status columns remain.

Attendance daily totals: each employee/date shows Total working hours (day) after every session for that day has a punch-out. Multiple sessions are combined, overlap counts once, and punch gaps are excluded. Open sessions show Awaiting punch-out. Session hours remain separate; all totals retain the 09:30–18:30 IST shift boundary. Historical dates and All dates display their respective totals.

Attendance: removed the Online status (now) column. Session and daily working-hour totals remain visible.

Browser tab branding: title is TeamPulse - Sawai Associates (ASCII separator prevents replacement characters). The official Sawai favicon is bundled for local/static builds and embedded in packaged HTML. Apps Script doGet also sets the outer page favicon to the organization’s public favicon URL via setFaviconUrl. Deploy both Code.gs and Index.html to apply deployed tab branding.

Notification repeat fix: login initialization now adds only events not already recorded as delivered, instead of rebuilding every historical notification. Opening the inbox marks displayed updates seen; read items are cleared when it closes and excluded from restored history. Delivery/read receipts persist per account across logout, login and browser reopening. Only new or changed event versions return to the inbox.

Attendance punch button highlight: the primary pink action switches from Punch in to Punch out only after a confirmed open punch exists. Following punch-out it returns to Punch in. Existing disabled/busy protections remain.

Employee card Edit buttons are centered beneath profile details and use a consistent minimum size, aligned with the access controls below. Styling is scoped to employee cards.

Department Teammates replaces the employee directory for Employee and Team Leader roles: sidebar, heading, breadcrumb and overview use Teammates. Only the viewer and members of their matching department are included in the public directory and presence summaries, enforced server-side for bootstrap and attendance snapshots and in the UI. Known department aliases use canonical dropdown matches. A missing department shows only the viewer. Admin/HR retain the full Employees management view; task-assignee and designated leave-approver permissions remain unchanged.

Online/offline feature removed throughout the app: employee/teammate cards no longer show connectivity badges or connection explanations, and the backend no longer writes/reads presence caches or returns online flags. Attendance punch state, worked hours, and department restrictions remain.

Employee/Teammates cards no longer display daily hours, punch status, or attendance timing notes. Attendance remains the place to view punch records and working hours.
