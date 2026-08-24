import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import {
  getAuth,
  Auth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
  UserCredential,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
};

export const isFirebaseConfigured = (): boolean => {
  return Boolean(
    typeof window !== "undefined" &&
    firebaseConfig.apiKey &&
    firebaseConfig.apiKey.length > 5 &&
    firebaseConfig.projectId &&
    firebaseConfig.authDomain
  );
};

let appInstance: FirebaseApp | null = null;
let authInstance: Auth | null = null;

export const getFirebaseAuth = (): Auth | null => {
  if (typeof window === "undefined") return null;
  if (!isFirebaseConfigured()) return null;

  if (!appInstance) {
    appInstance = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  }
  if (!authInstance && appInstance) {
    authInstance = getAuth(appInstance);
  }
  return authInstance;
};

// Keep recaptchaVerifier singleton
let recaptchaVerifierInstance: RecaptchaVerifier | null = null;

export const getRecaptchaVerifier = (containerId: string = "recaptcha-container"): RecaptchaVerifier => {
  if (typeof window === "undefined") {
    throw new Error("RecaptchaVerifier can only be initialized on the client side.");
  }

  const auth = getFirebaseAuth();
  if (!auth) {
    throw new Error("Firebase Auth is not initialized or configured.");
  }

  if (!recaptchaVerifierInstance) {
    recaptchaVerifierInstance = new RecaptchaVerifier(auth, containerId, {
      size: "invisible",
      callback: () => {
        // reCAPTCHA solved
      },
      "expired-callback": () => {
        if (recaptchaVerifierInstance) {
          recaptchaVerifierInstance.clear();
          recaptchaVerifierInstance = null;
        }
      },
    });
  }

  return recaptchaVerifierInstance;
};

export const clearRecaptchaVerifier = () => {
  if (recaptchaVerifierInstance) {
    try {
      recaptchaVerifierInstance.clear();
    } catch (e) {
      // ignore
    }
    recaptchaVerifierInstance = null;
  }
};

export const sendFirebasePhoneOtp = async (
  phoneNumber: string,
  containerId: string = "recaptcha-container"
): Promise<ConfirmationResult> => {
  const auth = getFirebaseAuth();
  if (!auth) {
    throw new Error("Firebase Auth is not configured. Please check your credentials in .env.local.");
  }
  const verifier = getRecaptchaVerifier(containerId);
  return await signInWithPhoneNumber(auth, phoneNumber, verifier);
};

export const confirmFirebaseOtp = async (
  confirmationResult: ConfirmationResult,
  otpCode: string
): Promise<UserCredential> => {
  return await confirmationResult.confirm(otpCode);
};
