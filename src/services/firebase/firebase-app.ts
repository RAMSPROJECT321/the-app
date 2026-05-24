import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import {
  getFirestore,
  initializeFirestore,
  waitForPendingWrites,
  type Firestore,
} from "firebase/firestore";

import { APP_CONFIG, APP_MESSAGES, hasFirebaseConfig } from "@/constants/app";

let firebaseApp: FirebaseApp | null = null;
let firebaseAuth: Auth | null = null;
let firestoreDb: Firestore | null = null;

const getValidatedConfig = () => {
  if (!hasFirebaseConfig) {
    throw new Error(APP_MESSAGES.missingFirebaseConfig);
  }

  return APP_CONFIG.firebase;
};

export const getFirebaseApp = () => {
  if (firebaseApp) {
    return firebaseApp;
  }

  const config = getValidatedConfig();
  firebaseApp = getApps().length ? getApp() : initializeApp(config);
  return firebaseApp;
};

export const getFirebaseAuthInstance = () => {
  if (firebaseAuth) {
    return firebaseAuth;
  }

  const app = getFirebaseApp();
  firebaseAuth = getAuth(app);

  return firebaseAuth;
};

export const getFirestoreDb = () => {
  if (firestoreDb) {
    return firestoreDb;
  }

  const app = getFirebaseApp();

  try {
    firestoreDb = initializeFirestore(app, {
      ignoreUndefinedProperties: true,
    });
  } catch {
    firestoreDb = getFirestore(app);
  }

  return firestoreDb;
};
export const waitForRemoteWritesAsync = async () => {
  await waitForPendingWrites(getFirestoreDb());
};
