import Constants from "expo-constants";

type ExtraConfig = {
  appName?: string;
  firebaseApiKey?: string;
  firebaseAuthDomain?: string;
  firebaseProjectId?: string;
  firebaseStorageBucket?: string;
  firebaseMessagingSenderId?: string;
  firebaseAppId?: string;
  firebaseMeasurementId?: string;
};

const extra = (Constants.expoConfig?.extra ?? {}) as ExtraConfig;

export const APP_CONFIG = {
  appName: extra.appName ?? "The App",
  firebase: {
    apiKey: extra.firebaseApiKey ?? "",
    authDomain: extra.firebaseAuthDomain ?? "",
    projectId: extra.firebaseProjectId ?? "",
    storageBucket: extra.firebaseStorageBucket ?? "",
    messagingSenderId: extra.firebaseMessagingSenderId ?? "",
    appId: extra.firebaseAppId ?? "",
    measurementId: extra.firebaseMeasurementId ?? "",
  },
  defaultLocale: "en-US",
};

export const hasFirebaseConfig = [
  APP_CONFIG.firebase.apiKey,
  APP_CONFIG.firebase.authDomain,
  APP_CONFIG.firebase.projectId,
  APP_CONFIG.firebase.messagingSenderId,
  APP_CONFIG.firebase.appId,
].every(Boolean);

export const APP_LIMITS = {
  dashboardRecentItems: 4,
  vaultIdleTimeoutMs: 3 * 60 * 1000,
  maxSearchSuggestions: 6,
  maxOfflineQueueSize: 50,
};

export const APP_MESSAGES = {
  missingFirebaseConfig:
    "Firebase is not configured yet. Add the Firebase app keys in app config to enable authentication and sync.",
  attachmentQueued:
    "Attachment saved on this device. It remains available after restart or same-device sign-in while the local file still exists.",
  vaultSecretUnavailable:
    "This device does not have the original secret value. Add it again to restore secure local access.",
  passwordResetSent:
    "A password reset email has been sent if the account exists.",
};
