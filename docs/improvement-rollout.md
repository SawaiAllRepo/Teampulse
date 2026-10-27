# TeamPulse improvement rollout

The first phase adds employee profile fields and HR/Admin editing, separate Leave & Work Requests, half-day requests and day previews, cancellation and review comments, attendance correction requests with original punch history, and task descriptions/start dates/review and blocked statuses. Existing role checks remain enforced on the server. Correction reasons are visible only to their employee and HR/Admin.

## Deployment

Run `npm test` and `npm run build`. Upload `deployment/Code.gs` and `deployment/Index.html` together to the existing Apps Script project and publish a new version. Existing columns are extended in place and the corrections sheet is created automatically. Keep a spreadsheet backup before rollout. No live deployment was performed by this change.

## Current rules and limitations

- Calendar days count toward request duration, including weekends and holidays. Half-day requests cover one date and require a first/second half selection. Work arrangements never deduct leave. Entitlement accounting is not implemented.
- HR/Admin review requests and corrections; self-approval is blocked. Reporting-manager routing and notification delivery remain future work.
- Profile photographs use HTTPS image URLs; private uploads are not implemented.
- Attendance corrections require an existing attendance record and both corrected punch times. Original values and reviewer comments remain in correction history; changes are also audited. Entirely missing attendance days need a future create-record workflow.
- Task status names retain the existing To do / In progress / Done values for compatibility and add Under review / Blocked. Blocked tasks require an explanation.

## Remaining requested improvements

Private employee and request attachments with validated formats/limits; HR-configurable leave types, entitlements and holiday rules; festival and shared calendars; manager routing, notifications and preferences; break/location accounting and attendance summaries; expanded daily, manager and HR dashboards; task comments, checklists, attachments and helper assignment; milestones and effort-based workload; workflow tracking; targeted expiring announcements and acknowledgements; advanced filters and authorized Excel/PDF reports; change-history viewer; policies, onboarding and exit checklists; privileged-account verification and documented backup/recovery testing.

Productivity reporting should use delivery, quality, deadlines and blockers alongside effort, rather than infer contribution from attendance duration.
