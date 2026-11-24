# Password recovery and notification review

## What changed

The email-first Continue action always opens the password screen. Its unauthenticated `checkAccount` response no longer returns `exists` or reads credentials. Users can choose Forgot password (email prefilled) or explicitly Create account. Existing registration and approval rules remain. The legacy self-registration endpoint still reports an already-registered account; administrators wanting a completely non-enumerable onboarding system should use invitation-only registration as a separate change.

`requestPasswordReset` returns the same acknowledgement for existing, unknown, disabled, unprovisioned, throttled and mail-failure cases. Invalid inputs and missing configuration have uniform actionable errors. It applies a 2.5-second response floor, a 60-second per-normalized-email resend cooldown, five attempts per email per hour and twenty requests overall per fifteen minutes. Suppressed attempts count toward limits. Reset submissions are limited to fifty per fifteen minutes overall. The time floor reduces account-dependent latency differences; MailApp and Sheets network latency are not constant-time. Measure the deployed paths before relying on timing equalization under load.

An owner-generated 256-bit secret and the supported Utilities HMAC-SHA256 API produce pseudorandom reset tokens from a lock-protected monotonic counter and UUID nonce. UUIDs supply uniqueness, not assumed cryptographic entropy. Tokens are never generated with Math.random or timestamps. The new `passwordResets` sheet stores token hashes, employeeId, expiry, usedAt, createdAt, and credential/email binding hashes. Tokens expire after 15 minutes, are single-use and are invalidated by a replacement, account/email/status change, or password change. No token plaintext or password is stored in that sheet. Reset emails contain the token only in a URL fragment. The React entry removes it from the address bar immediately, retains it only in memory, and sends it in the POST body. Refreshing that stripped reset page requires reopening the email link. No analytics is installed on the recovery route; any future instrumentation must redact request bodies and URL fragments.

The backend script lock covers validation and consumption. It burns the token before revoking sessions and saving a new bcrypt cost-12 hash under the unchanged 12-character / 72-UTF-8-byte policy. Partial storage failures fail closed: request a fresh link if the old one was consumed. Successful reset signs out all previous sessions and returns to sign-in without creating a session. Confirmation email contains no password. Mail errors are logged as fixed text, without the exception message, email content, token, secret or password.

## Required configuration

Set these only in Apps Script Project Settings > Script Properties:

| Property | Purpose |
| --- | --- |
| `PASSWORD_RESET_FRONTEND_URL` | Exact HTTPS URL of the deployed Vercel recovery page, e.g. `https://your-teampulse.example/reset-password`. No query, fragment, credentials or trailing slash. |
| `PASSWORD_RESET_ALLOWED_ORIGINS` | JSON array of trusted origins, e.g. `["https://your-teampulse.example"]`. The URL's origin must match an entry exactly. Do not allow arbitrary preview deployments. |
| `PASSWORD_RESET_SECRET` | 64 lowercase hex characters generated with a cryptographic random generator. Keep private; never put in React, Git or an email. |
| `SPREADSHEET_ID` | Existing backing workbook; preserve its current value. |
| `REPORT_EOD_TIME` | IST EOD as `HH:mm`; defaults to `18:30`. |
| `REPORT_REMINDER_MINUTES` | Integer 5-180 minutes before EOD on the same IST day; defaults to 30. |
| `PUNCH_IN_TIME` / `PUNCH_OUT_TIME` | IST shift start/end; defaults to `09:30` / `18:30`. |

Generate the secret on a trusted local computer, then paste the result directly into Script Properties:

```powershell
node -e "process.stdout.write(require('node:crypto').randomBytes(32).toString('hex'))"
```

`PASSWORD_RESET_COUNTER`, `RESET_REQUEST_GLOBAL`, `RESET_SUBMIT_GLOBAL` and hashed `RESET_EMAIL_*` properties are maintained by the backend. Do not reset the counter during normal operations. No email credentials are required: MailApp uses the deployment owner's authorization. No additional React environment variable is needed.

## Migration and Apps Script deployment (manual)

1. Run `npm test` and `npm run build` locally. These do not publish anything.
2. In the existing Apps Script project, replace Code.gs and Index.html with generated `deployment/Code.gs` and `deployment/Index.html`. Update `appsscript.json` from the generated manifest. Keep the existing project, properties, workbook and deployment identity.
3. Set the recovery properties above. Run `preparePasswordRecovery_()` from the editor as owner. This validates configuration and adds only the missing passwordResets sheet and headers. It validates existing headers instead of replacing them. It does not create or repair Admin accounts, clear Sheets or modify credentials. **Do not rerun initial-admin `setup()` for this upgrade.** Notification sheets are also created additively on first use.
4. Approve the manifest's Sheets, `script.send_mail` and `script.scriptapp` scopes. The mail scope sends reset/confirmation mail as the owner; the script scope manages the reminder trigger.
5. Run `installNotificationSchedule_()` as the same owner. It validates times, creates a five-minute trigger only if absent and removes duplicate handlers visible to that owner. Verify one `processNotificationSchedule_` trigger. Triggers belonging to another account cannot be deduplicated by this account; use one owner.
6. Manually create a new version of the existing web-app deployment. Preserve its access setting and execute-as-owner configuration. Updating source alone does not update the `/exec` deployment.

Google quotas vary by account and can change. Reset sends check `MailApp.getRemainingDailyQuota()`; delivery/quota failure invalidates the unsent token and returns the generic acknowledgement. Users can retry after the cooldown; an administrator must inspect fixed-text execution-log failures if no email arrives. Confirmation-email failure does not undo the password change. See [MailApp](https://developers.google.com/apps-script/reference/mail/mail-app), [quotas](https://developers.google.com/apps-script/guides/services/quotas), and [Utilities HMAC-SHA256](https://developers.google.com/apps-script/reference/utilities/utilities#computeHmacSha256Signature(String,String,Charset)).

## Vercel deployment (manual)

Preserve the server-only `APPS_SCRIPT_URL` environment variable pointing at the updated existing `/exec` deployment. No backend secret goes into `VITE_*` variables. This change adds an explicit `/reset-password` rewrite to `/index.html`, preserving the API route, and adds no-store, no-referrer and noindex headers for the recovery path. The HTML also uses a no-referrer policy. After a manual Vercel deployment, the configured HTTPS recovery URL must match the deployed origin. Test a direct email link in a fresh browser; it must load the reset form without visiting the home page first.

## Notification review

Events are deduplicated at enqueue against the latest equivalent event snapshot and have deterministic event IDs; receipt IDs remain deterministic per event and recipient. All delivery/receipt writes stay under the script lock. Actor suppression removes routine self-notifications, while personal punch confirmations remain useful. Name/phone/photo-only profile edits do not queue events. Task labels distinguish assignment, reassignment, status changes and other updates. Message bodies, leave reasons, report details and punch locations are excluded from previews, including old message receipt text when serialized again. Only authorized record-open responses return the actual underlying details.

Request-local row caching returns copies and invalidates on storage writes, reducing repeated Sheets reads without sharing cached private data across requests. The inbox returns up to 50 items by default (maximum 100), with a stable timestamp/ID cursor. Unread totals and bulk read/dismiss operations apply to the full authorized visible inbox. Popup claims are limited to five per poll, separate from the displayed page; remaining claims wait when the 100-item client popup queue is full. Multiple tabs cannot claim the same receipt. Deleted and reassigned records recheck current access. Delivery failures leave source work saved; if the event queue itself cannot be written, that event has no durable retry record and a fixed-context failure is logged.

Daily reminders exclude report submissions, full-day approved leave (WFH still requires reporting), holidays, weekly offs, inactive employees and dates before joining. Resolved report reminders drop out of visible/unread results. Scheduling uses Asia/Kolkata and configurable EOD/lead time. The clock trigger operates within a time window; it is not an exact-minute guarantee.

These are **in-app notifications**, not browser/OS push. Closed tabs do not show popups; the server can queue reminders, and the app receives them on reopening. See also [notification setup](notifications.md).

## Verification

Local run on 5 November 2026: **417 tests passed**; production Vite build and combined Apps Script packaging passed. The build retains the existing large-bundle advisory.

Automated coverage includes real local HMAC/bcrypt calculations, reset expiry/reuse/replacement, cooldown/rate limits, invalid/status/email/credential binding, session revocation, mail/quota failures, additive migration, generic account continuation, and sequential/reentrant contention under a simulated script lock. Notification tests cover permissions, duplicate retries, multi-tab claims, persisted read/dismiss state, pagination/global counts, preview privacy, Sheet-read caching and reminder exclusions. React server-render smoke checks and production packaging validate the recovery UI and routes structurally.

Still requires live verification after manual deployment: Google authorization/quotas and actual email receipt/spam placement; direct Vercel links and header behavior; real simultaneous HTTP reset requests against Google's script lock; network timing for known/unknown/throttled email paths; click-through browser UX, two-tab popup behavior; trigger execution, owner identity, quota/runtime and actual IST reminder delivery. No production deployment, email send, Sheet migration, credential reset or trigger installation was performed by these local tests.
