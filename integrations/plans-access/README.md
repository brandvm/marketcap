# Plans access (email + PIN)

Replaces the fixed PIN on the development template's Plans. A Google Sheet
holds who may see the plans; a Google Apps Script bound to it checks logins,
sends PINs and logs everything. The website module is
`src/modules/plans-gate.ts`.

## How it works

| Who | Does | What happens |
| --- | --- | --- |
| Visitor with a PIN | Enters email + 4-digit PIN | Plans unlock. The device stays signed in for 30 days (Settings › Days signed in). Every later view is checked again and logged. |
| Visitor without a PIN | Clicks "Request a PIN", enters name, email, company | Row added to **Access** as *Pending*; the client gets an email with an **Approve and send PIN** button. |
| Client | Presses **Approve** in that email, or sets Status to *Approved* in the sheet | A PIN is generated and emailed to the visitor. |
| Visitor who forgot the PIN | Requests again with the same email | If approved, the PIN is emailed again automatically. |
| Client | Sets Status to *Revoked* | The PIN stops working, and remembered devices are locked on their next view. |

With **Settings › Auto-approve = Yes**, every request is approved at once and
the client does nothing at all.

**Log tab:** one row per event, with time, event, email, page title, page URL,
detail and device. Events: `request`, `request_again`, `approved`,
`pin_sent`, `pin_resent`, `login`, `login_failed` (detail: wrong PIN / no
access / pending / revoked), `login_locked` (5 wrong PINs → 15-minute
lock), `view` (a remembered device opened the plans), `view_denied`,
`revoked`, `error`.

## One-time setup (about 10 minutes)

Do this in the Google account that should own the list and send the
emails. The PIN emails come from that account's Gmail: a consumer Gmail
account can send about 100 a day, Google Workspace about 1,500.

1. Create a new Google Sheet, e.g. "MarketCap · Plans access".
2. **Extensions › Apps Script.** Replace the contents of `Code.gs` with
   this folder's `Code.gs`, then save.
3. In the function dropdown pick **setup** and press **Run**. Google asks
   for permission (spreadsheet, email, triggers, and connecting to an
   external service). Allow it. The script then:
   - creates the Access, Log and Settings tabs;
   - adds the Status dropdown and colours;
   - creates the signing secret and the edit trigger.
4. **Deploy › New deployment › Web app**:
   - Execute as: **Me**;
   - Who has access: **Anyone**.

   Deploy and copy the **Web app URL** (it ends in `/exec`).
5. In the **Settings** tab, check:
   - **Notify emails:** who receives the requests;
   - **Auto-approve;**
   - **Site name**, **Sender name**, **Days signed in.**
6. In Webflow, on the development template, select the Plans section and
   set the custom attribute `data-gate-endpoint` to the Web app URL.
   Publish.

After changing `Code.gs` later: **Deploy › Manage deployments › edit ›
Version: New version**, so the same URL keeps working.

Reload the sheet after setup: a **Plans access** menu appears, with Approve /
Email PIN again / Revoke for the selected rows.

## Notes

- The images still come from the Webflow CMS. Until a login succeeds, they
  are kept out of the page (src removed). This keeps visitors out, but it
  isn't encryption: someone who already has an image URL can open it.
- 4-digit PINs are guarded by the lockout (5 wrong tries per email locks
  that email for 15 minutes). Every failed try is logged.
- No secret lives in this repo. The signing secret is in the script's
  Script Properties.
