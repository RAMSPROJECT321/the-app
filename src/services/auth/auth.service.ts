import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";

import { APP_MESSAGES, hasFirebaseConfig } from "@/constants/app";
import { getFirebaseAuthInstance } from "@/services/firebase/firebase-app";
import { useSessionStore } from "@/store/session-store";
import { debugLogger } from "@/utils/debug";

let authBootstrapPromise: Promise<void> | null = null;
let authUnsubscribe: (() => void) | null = null;

const applyAuthUser = (user: User | null) => {
  const nextState = useSessionStore.getState();

  if (user) {
    debugLogger.log("auth", "authenticated user resolved", {
      userId: user.uid,
      email: user.email ?? "",
    });
    nextState.setAuthenticatedUser({
      userId: user.uid,
      email: user.email ?? "",
    });
    return;
  }

  debugLogger.log("auth", "auth state changed to signed out");
  nextState.clearAuthenticatedUser();
};

const mapAuthError = (error: unknown) => {
  if (
    typeof error === "object" &&
    error &&
    "code" in error &&
    typeof error.code === "string"
  ) {
    switch (error.code) {
      case "auth/email-already-in-use":
        return "That email is already in use.";
      case "auth/invalid-email":
        return "Enter a valid email address.";
      case "auth/invalid-credential":
      case "auth/user-not-found":
      case "auth/wrong-password":
        return "The email or password is incorrect.";
      case "auth/weak-password":
        return "Choose a stronger password.";
      case "auth/too-many-requests":
        return "Too many attempts. Try again shortly.";
      default:
        break;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Something went wrong. Please try again.";
};

export const authService = {
  async initializeAsync() {
    if (authBootstrapPromise) {
      return authBootstrapPromise;
    }

    authBootstrapPromise = new Promise((resolve) => {
      if (!hasFirebaseConfig) {
        debugLogger.warn("auth", "firebase config missing during bootstrap");
        useSessionStore.getState().setAuthResolved();
        resolve();
        return;
      }

      const auth = getFirebaseAuthInstance();
      debugLogger.log("auth", "initializing auth state listener");

      authUnsubscribe?.();
      authUnsubscribe = onAuthStateChanged(auth, (user) => {
        applyAuthUser(user);
        resolve();
      });
    });

    return authBootstrapPromise;
  },

  async signInAsync(email: string, password: string) {
    if (!hasFirebaseConfig) {
      throw new Error(APP_MESSAGES.missingFirebaseConfig);
    }

    const auth = getFirebaseAuthInstance();
    debugLogger.log("auth", "sign-in requested", { email: email.trim() });
    await signInWithEmailAndPassword(auth, email.trim(), password);
  },

  async signUpAsync(email: string, password: string) {
    if (!hasFirebaseConfig) {
      throw new Error(APP_MESSAGES.missingFirebaseConfig);
    }

    const auth = getFirebaseAuthInstance();
    debugLogger.log("auth", "sign-up requested", { email: email.trim() });
    await createUserWithEmailAndPassword(auth, email.trim(), password);
  },

  async sendPasswordResetAsync(email: string) {
    if (!hasFirebaseConfig) {
      throw new Error(APP_MESSAGES.missingFirebaseConfig);
    }

    const auth = getFirebaseAuthInstance();
    debugLogger.log("auth", "password reset requested", { email: email.trim() });
    await sendPasswordResetEmail(auth, email.trim());
  },

  async signOutAsync() {
    if (!hasFirebaseConfig) {
      useSessionStore.getState().clearAuthenticatedUser();
      return;
    }

    const auth = getFirebaseAuthInstance();
    debugLogger.log("auth", "sign-out requested");
    await signOut(auth);
  },

  mapAuthError,
};
