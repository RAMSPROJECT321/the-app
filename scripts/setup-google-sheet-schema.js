const fs = require("fs");
const path = require("path");
const { google } = require("googleapis");

const SHEET_SCHEMAS = {
  Tasks: [
    "id",
    "userId",
    "title",
    "description",
    "status",
    "priority",
    "tags",
    "checklist",
    "attachments",
    "timeline",
    "createdAt",
    "updatedAt",
    "version",
    "deletedAt",
  ],
  VaultItems: [
    "id",
    "userId",
    "title",
    "category",
    "username",
    "url",
    "notes",
    "secretPreview",
    "secretRef",
    "isFavorite",
    "syncMode",
    "createdAt",
    "updatedAt",
    "version",
    "deletedAt",
  ],
  SyncAudit: [
    "requestId",
    "userId",
    "deviceId",
    "endpoint",
    "entityType",
    "entityId",
    "status",
    "message",
    "createdAt",
  ],
  Tags: ["id", "userId", "name", "createdAt", "updatedAt", "deletedAt"],
  TaskTimeline: ["id", "taskId", "userId", "type", "message", "createdAt"],
};

const ensureEnvironment = () => {
  if (!process.env.GOOGLE_SHEET_ID) {
    throw new Error("Missing GOOGLE_SHEET_ID.");
  }
};

const readServiceAccountCredentials = () => {
  const jsonPath = process.env.GOOGLE_SERVICE_ACCOUNT_JSON_PATH;

  if (jsonPath) {
    const absolutePath = path.resolve(jsonPath);
    const raw = fs.readFileSync(absolutePath, "utf8");
    const parsed = JSON.parse(raw);

    return {
      clientEmail: parsed.client_email,
      privateKey: parsed.private_key,
    };
  }

  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!clientEmail || !privateKey) {
    throw new Error(
      "Missing service account credentials. Set GOOGLE_SERVICE_ACCOUNT_JSON_PATH or GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_PRIVATE_KEY.",
    );
  }

  return {
    clientEmail,
    privateKey,
  };
};

const main = async () => {
  ensureEnvironment();
  const { clientEmail, privateKey } = readServiceAccountCredentials();

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const sheets = google.sheets({
    version: "v4",
    auth,
  });

  const spreadsheetId = process.env.GOOGLE_SHEET_ID;
  const existing = await sheets.spreadsheets.get({
    spreadsheetId,
  });

  const existingTitles =
    existing.data.sheets?.map((sheet) => sheet.properties?.title).filter(Boolean) ?? [];

  const addSheetRequests = Object.keys(SHEET_SCHEMAS)
    .filter((sheetTitle) => !existingTitles.includes(sheetTitle))
    .map((sheetTitle) => ({
      addSheet: {
        properties: {
          title: sheetTitle,
          gridProperties: {
            frozenRowCount: 1,
          },
        },
      },
    }));

  if (addSheetRequests.length > 0) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: addSheetRequests,
      },
    });
  }

  for (const [sheetTitle, headers] of Object.entries(SHEET_SCHEMAS)) {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${sheetTitle}!1:1`,
      valueInputOption: "RAW",
      requestBody: {
        values: [headers],
      },
    });
  }

  console.log("Spreadsheet schema is ready.");
  console.log(`Spreadsheet ID: ${spreadsheetId}`);
  console.log(`Sheets ensured: ${Object.keys(SHEET_SCHEMAS).join(", ")}`);
};

main().catch((error) => {
  console.error("Failed to set up spreadsheet schema.");
  console.error(error);
  process.exit(1);
});
