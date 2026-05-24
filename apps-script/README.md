# Google Apps Script Backend Setup

## What this does

This Apps Script project acts as the API layer between the mobile app and Google Sheets.

It supports:

- `tasks/list`
- `tasks/upsert`
- `tasks/delete`
- `vault/list`
- `vault/upsert`
- `vault/delete`

## Before deployment

1. Create or choose a Google Sheet.
2. Share that sheet with:
   - the Google account that will own/deploy the Apps Script web app
   - your service account if you want to run the schema setup script from this repo
3. Run the schema setup script from this repo:

```bash
npm run sheets:setup-schema
```

## Apps Script deployment steps

1. Go to `script.google.com`.
2. Create a new Apps Script project.
3. Paste the contents of `apps-script/Code.gs` into the project.
4. In `Project Settings -> Script Properties`, add:
   - `SPREADSHEET_ID`
   - `APP_SHARED_SECRET`
5. Deploy as a **Web app**.
6. Use:
   - Execute as: `Me`
   - Who has access: `Anyone`
7. Copy the `/exec` URL and place it in `expo.extra.googleAppsScriptBaseUrl`.
8. Put the same secret string in `expo.extra.googleAppsScriptSharedSecret`.

## Important security note

The shared secret here is only a lightweight barrier. It is not equivalent to real user authentication because the mobile client contains the value. This setup is acceptable for a personal app foundation, but not for a strong multi-user security model.

## Vault behavior

Vault rows sync metadata such as title, category, notes, sync mode, and masked preview. Actual secret values remain in device secure storage and are not recoverable on a new device from Sheets alone.
