import Constants from "expo-constants";

type ExtraConfig = {
  appName?: string;
  googleAppsScriptBaseUrl?: string;
  googleAppsScriptSharedSecret?: string;
  appUserId?: string;
};

const extra = (Constants.expoConfig?.extra ?? {}) as ExtraConfig;

export const APP_CONFIG = {
  appName: extra.appName ?? "AegisFlow",
  googleAppsScriptBaseUrl: extra.googleAppsScriptBaseUrl ?? "",
  googleAppsScriptSharedSecret: extra.googleAppsScriptSharedSecret ?? "",
  appUserId: extra.appUserId ?? "demo-user",
  defaultLocale: "en-US",
};

export const APP_LIMITS = {
  dashboardRecentItems: 4,
  vaultIdleTimeoutMs: 3 * 60 * 1000,
  maxSearchSuggestions: 6,
  maxOfflineQueueSize: 100,
};

export const APP_MESSAGES = {
  attachmentWarning:
    "Attachments are currently stored on this device only. If the app is removed or the file changes, the attachment can be lost.",
  missingAppsScript:
    "Apps Script is not configured yet. Your data stays available locally and sync can be enabled later by adding the API URL.",
};
