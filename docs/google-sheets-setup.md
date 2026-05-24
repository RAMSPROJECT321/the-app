# Google Sheets Integration

## 1. Configure the sheet schema

Use the included script to create the required tabs and column headers in your Google Sheet.

Environment options:

- `GOOGLE_SHEET_ID`
- `GOOGLE_SERVICE_ACCOUNT_JSON_PATH`

Alternative credential input:

- `GOOGLE_SERVICE_ACCOUNT_EMAIL`
- `GOOGLE_PRIVATE_KEY`

Run:

```bash
npm run sheets:setup-schema
```

This script ensures these sheets:

- `Tasks`
- `VaultItems`
- `SyncAudit`
- `Tags`
- `TaskTimeline`

## 2. Deploy the Apps Script API

Use the template in [apps-script/Code.gs](/Users/rajatjangid/Desktop/the-app/apps-script/Code.gs).

Required Apps Script properties:

- `SPREADSHEET_ID`
- `APP_SHARED_SECRET`

Deploy as a web app and copy the `/exec` URL.

## 3. Configure the mobile app

Set these values in [app.json](/Users/rajatjangid/Desktop/the-app/app.json):

```json
{
  "expo": {
    "extra": {
      "googleAppsScriptBaseUrl": "https://script.google.com/macros/s/AKfycb.../exec",
      "googleAppsScriptSharedSecret": "choose-a-long-random-string",
      "appUserId": "rajat-main"
    }
  }
}
```

## 4. Runtime behavior

- The app reads from persisted local storage immediately on restart.
- When online, it pushes queued offline changes first, then fetches the latest sheet snapshot.
- When offline, changes stay queued locally and sync automatically after reconnect.
- On foreground return, the app refreshes from the API again if connectivity is available.

## 5. Important limitation

Task data syncs fully. Vault metadata syncs, but secret values remain device-local by design. If you need true cross-device secret recovery, add client-side encryption and a proper backend key-management model before syncing plaintext secrets anywhere.
