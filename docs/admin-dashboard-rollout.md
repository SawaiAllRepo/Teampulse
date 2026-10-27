# Admin dashboard rollout

## Implemented first build

- Admin-specific company overview with date, department and search controls, nine clickable metric cards, matching-record lists, quick actions and last-refreshed time.
- Office/home numbers come from approved work arrangements. Incomplete profiles are labelled separately from onboarding completion; the application has no onboarding checklist yet.
- Attention queue for overdue projects, unassigned tasks and pending account access, with responsible person and next action.
- Employees & Teams directory with name, employee ID, department, position, manager, employment status, joining-date and access-role filters. Position appears separately from system access. Existing profile editing and account management remain available.
- Real `.xlsx` downloads for all, matching, selected and individual employees, including every matching record without pagination. Backend field allowlists and role checks govern every export.
- Reports for employees, attendance, leave/work requests, projects and tasks, with selectable columns and relevant date ranges. Private leave reasons, documents, credentials and financial details are excluded.
- Roles & Permissions page documenting the backend's fixed View/Create/Edit/Approve/Export/Deactivate rules and managing account access. This version does not provide custom action grants or configurable record scopes.
- Owner and delegated appointment protections, detailed before/after role-change audit entries, immediate account deactivation and session revocation.
- Company project summaries with task-count completion method, team, owner, deadline, completed/pending, overdue and blocked work. Project department/owner/status filters and task assignee/status/priority filters.
- Admin-only, read-only Activity History with search across the latest 1,000 events. Report events contain type, selected fields, date range and count. There is no client action for changing audit records.

## Owner configuration and deployment

The workspace owner is the active Admin matching the existing `ADMIN_EMAIL` Script Property. Ownership remains configured by the Apps Script project owner. It is not a client-editable role.

Only the owner or an Admin explicitly listed by employee ID in the comma-separated `ADMIN_APPOINTER_IDS` Script Property can create or modify HR/Admin access. Other Admins retain standard user management. Users cannot change their own access, and the workspace owner cannot be deactivated, demoted or deleted through the application. These restrictions also apply to direct API requests.

Run `npm test` and `npm run build`. Deploy `deployment/Code.gs` and `deployment/Index.html` together as a new Apps Script version. Generated files are ready locally; no live deployment was performed.

## Remaining requested work

Configurable per-action permissions and record scopes; workflow definitions, staged/backup approvers, reminders/escalations and workflow reports; effective-dated company settings; workload estimates and complexity; milestones, start dates and latest project updates; announcement targeting, scheduling, attachments and acknowledgements; exit-access queues; privileged login verification and session-management UI; integration monitoring and verified backup/recovery status.

None of the missing integrations or backup checks is shown as healthy. Admin access does not introduce a private document or salary export endpoint.
