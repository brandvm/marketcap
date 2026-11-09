# Plans access (email + PIN)

Replaces the fixed PIN on the development template's Plans. A Google Sheet
holds who may see the plans; a Google Apps Script bound to it checks logins,
sends PINs and logs everything. The website module is
`src/modules/plans-gate.ts`.

## How it works

| Who | Does | What happens |
| --- | --- | --- |
| Visitor with a PIN | Enters email + 4-digit PIN | Plans unlock. The device stays signed in for 30 days (Settings › Days signed in). Every later view is checked again and logged. |
| Visitor without a PIN | Clicks "Request a PIN", enters name, email, company | Row added to **Access** as *Pending*; the client gets an email with **Approve and send PIN** and **Decline** buttons. |
| Client | Presses **Approve** in that email and confirms (or sets Status to *Approved* in the sheet) | A PIN is generated and emailed to the visitor. The client gets an "access given" email with a **Revoke access** button. |
| Client | Presses **Decline** in that email and confirms (or sets Status to *Declined*) | The visitor gets a short, polite email saying the request wasn't approved (Settings › Email declined visitors = No keeps them uninformed). Asking again doesn't email the client again. |
| Visitor who forgot the PIN | Requests again with the same email | If approved, the PIN is emailed again automatically. |
| Client | Presses **Revoke access** in the "access given" email and confirms (or sets Status to *Revoked*) | The PIN stops working, and remembered devices are locked on their next view. |

**The client never has to open the sheet:** every decision is a button in
an email. Each button opens a page that says what will happen and has one
confirm button; nothing changes until that is pressed. Company mail
systems (Outlook Safe Links, Mimecast) open every link in an email to scan
it, so a button that acted on open could approve someone by itself. The
links are signed per email and action, so they can't be edited to target
someone else, and they keep working, so the "access given" email can be
kept for a later revoke.

With **Settings › Auto-approve = Yes**, every request is approved at once and
the client does nothing at all.

**Log tab:** one row per event, with time, event, email, page title, page URL,
detail and device. Events: `request`, `request_again`, `approved`,
`pin_sent`, `pin_resent`, `declined`, `decline_sent`, `login`, `login_failed` (detail: wrong PIN / no
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
   - **Email declined visitors** (Yes: a declined visitor gets a polite email);
   - **Site name**, **Sender name**, **Days signed in.**
6. In Webflow, on the development template, select the Plans section and
   set the custom attribute `data-gate-endpoint` to the Web app URL.
   Publish.

After changing `Code.gs` later: **Deploy › Manage deployments › edit ›
Version: New version**, so the same URL keeps working. Then run **setup**
once more: it adds new settings and Status values and keeps your data.

## Moving it to the client's Google account

The PIN emails, the edit trigger and the web app URL belong to the
account that ran setup and deployed, so the client's account has to do
both once. Moving the sheet's ownership is not enough.

1. Keep a template sheet with the script in your own account. Send the
   client its link with `/edit` replaced by `/copy`: they see one
   **Make a copy** button, and the copy carries the script.
2. On a short screen share, in their copy: **Plans access › Run setup**
   (the menu appears after a reload), then **Allow** on Google's
   permission screen. Google shows "unverified app" for a private
   script: **Advanced › Go to … (unsafe)** is expected.
3. **Extensions › Apps Script › Deploy › New deployment › Web app**
   (Execute as Me, access Anyone). Copy the URL.
4. Set `data-gate-endpoint` in Webflow to the new URL and publish.
   Requests from then on email the client; the old sheet stops getting any.

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
