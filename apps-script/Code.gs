var SHEET_HEADERS = {
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
};

function doGet() {
  return jsonResponse_({
    success: true,
    data: {
      status: "ok",
      serverTime: new Date().toISOString(),
    },
    serverTime: new Date().toISOString(),
  });
}

function doPost(e) {
  var body = {};

  try {
    body = JSON.parse((e && e.postData && e.postData.contents) || "{}");
    verifySecret_(body.appSecret);
    ensureSheetsExist_();

    var endpoint = body.endpoint;
    var payload = body.payload || {};
    var userId = body.userId || "";
    var data;

    switch (endpoint) {
      case "tasks/list":
        data = listEntities_("Tasks", userId);
        break;
      case "tasks/upsert":
        data = upsertEntity_("Tasks", payload.task);
        break;
      case "tasks/delete":
        data = softDeleteEntity_("Tasks", payload.id);
        break;
      case "vault/list":
        data = listEntities_("VaultItems", userId);
        break;
      case "vault/upsert":
        data = upsertEntity_("VaultItems", payload.item);
        break;
      case "vault/delete":
        data = softDeleteEntity_("VaultItems", payload.id);
        break;
      default:
        throw new Error("Unknown endpoint: " + endpoint);
    }

    writeAudit_({
      requestId: body.requestId || "",
      userId: userId,
      deviceId: body.deviceId || "",
      endpoint: endpoint,
      entityType: endpoint.indexOf("vault") === 0 ? "vault" : "task",
      entityId:
        payload.id ||
        (payload.task && payload.task.id) ||
        (payload.item && payload.item.id) ||
        "",
      status: "success",
      message: "Request completed.",
      createdAt: new Date().toISOString(),
    });

    return jsonResponse_({
      success: true,
      data: data,
      serverTime: new Date().toISOString(),
      syncToken: String(new Date().getTime()),
    });
  } catch (error) {
    try {
      writeAudit_({
        requestId: body.requestId || "",
        userId: body.userId || "",
        deviceId: body.deviceId || "",
        endpoint: body.endpoint || "unknown",
        entityType: body.endpoint && body.endpoint.indexOf("vault") === 0 ? "vault" : "task",
        entityId:
          (body.payload && body.payload.id) ||
          (body.payload && body.payload.task && body.payload.task.id) ||
          (body.payload && body.payload.item && body.payload.item.id) ||
          "",
        status: "error",
        message: String(error && error.message ? error.message : error),
        createdAt: new Date().toISOString(),
      });
    } catch (auditError) {}

    return jsonResponse_({
      success: false,
      data: null,
      serverTime: new Date().toISOString(),
      error: {
        code: "server",
        message: String(error && error.message ? error.message : error),
      },
    });
  }
}

function verifySecret_(providedSecret) {
  var expectedSecret = PropertiesService.getScriptProperties().getProperty("APP_SHARED_SECRET");

  if (expectedSecret && providedSecret !== expectedSecret) {
    throw new Error("Invalid app secret.");
  }
}

function ensureSheetsExist_() {
  var spreadsheet = getSpreadsheet_();

  Object.keys(SHEET_HEADERS).forEach(function (sheetName) {
    var sheet = spreadsheet.getSheetByName(sheetName);

    if (!sheet) {
      sheet = spreadsheet.insertSheet(sheetName);
    }

    var headers = SHEET_HEADERS[sheetName];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
  });
}

function getSpreadsheet_() {
  var spreadsheetId = PropertiesService.getScriptProperties().getProperty("SPREADSHEET_ID");

  if (!spreadsheetId) {
    throw new Error("Missing SPREADSHEET_ID script property.");
  }

  return SpreadsheetApp.openById(spreadsheetId);
}

function getSheet_(sheetName) {
  var sheet = getSpreadsheet_().getSheetByName(sheetName);

  if (!sheet) {
    throw new Error("Missing sheet: " + sheetName);
  }

  return sheet;
}

function getHeaders_(sheetName) {
  return SHEET_HEADERS[sheetName];
}

function getHeaderMap_(headers) {
  var map = {};

  headers.forEach(function (header, index) {
    map[header] = index;
  });

  return map;
}

function listEntities_(sheetName, userId) {
  var sheet = getSheet_(sheetName);
  var headers = getHeaders_(sheetName);
  var values = sheet.getDataRange().getValues();

  if (values.length <= 1) {
    return [];
  }

  var rows = values.slice(1).map(function (row) {
    return rowToObject_(headers, row);
  });

  return rows.filter(function (row) {
    return row.id && row.userId === userId && !row.deletedAt;
  });
}

function upsertEntity_(sheetName, entity) {
  if (!entity || !entity.id) {
    throw new Error("Missing entity payload.");
  }

  var sheet = getSheet_(sheetName);
  var headers = getHeaders_(sheetName);
  var values = sheet.getDataRange().getValues();
  var idColumnIndex = headers.indexOf("id");
  var rowNumber = -1;

  for (var i = 1; i < values.length; i += 1) {
    if (String(values[i][idColumnIndex]) === String(entity.id)) {
      rowNumber = i + 1;
      break;
    }
  }

  var row = headers.map(function (header) {
    return typeof entity[header] === "undefined" ? "" : entity[header];
  });

  if (rowNumber === -1) {
    sheet.appendRow(row);
  } else {
    sheet.getRange(rowNumber, 1, 1, headers.length).setValues([row]);
  }

  return {
    id: entity.id,
  };
}

function softDeleteEntity_(sheetName, entityId) {
  if (!entityId) {
    throw new Error("Missing entity id.");
  }

  var sheet = getSheet_(sheetName);
  var headers = getHeaders_(sheetName);
  var headerMap = getHeaderMap_(headers);
  var values = sheet.getDataRange().getValues();

  for (var i = 1; i < values.length; i += 1) {
    if (String(values[i][headerMap.id]) === String(entityId)) {
      values[i][headerMap.deletedAt] = new Date().toISOString();

      if (typeof headerMap.updatedAt !== "undefined") {
        values[i][headerMap.updatedAt] = new Date().toISOString();
      }

      sheet.getRange(i + 1, 1, 1, headers.length).setValues([values[i]]);
      return {
        id: entityId,
      };
    }
  }

  return {
    id: entityId,
  };
}

function writeAudit_(auditRow) {
  var sheet = getSheet_("SyncAudit");
  var headers = getHeaders_("SyncAudit");
  var row = headers.map(function (header) {
    return typeof auditRow[header] === "undefined" ? "" : auditRow[header];
  });

  sheet.appendRow(row);
}

function rowToObject_(headers, row) {
  var object = {};

  headers.forEach(function (header, index) {
    object[header] = row[index];
  });

  if (typeof object.version !== "undefined" && object.version !== "") {
    object.version = Number(object.version);
  }

  if (typeof object.isFavorite !== "undefined" && object.isFavorite !== "") {
    object.isFavorite =
      object.isFavorite === true || String(object.isFavorite).toLowerCase() === "true";
  }

  return object;
}

function jsonResponse_(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(
    ContentService.MimeType.JSON,
  );
}
