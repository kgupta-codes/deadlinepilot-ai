import "server-only";

import { existsSync } from "fs";
import { homedir } from "os";
import { join } from "path";

import {
  applicationDefault,
  cert,
  getApps,
  initializeApp,
} from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

export class FirebaseAdminConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FirebaseAdminConfigurationError";
  }
}

const getProjectId = () =>
  process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

const getWellKnownAdcPath = () => {
  if (process.env.APPDATA) {
    return join(
      process.env.APPDATA,
      "gcloud",
      "application_default_credentials.json"
    );
  }

  return join(
    homedir(),
    ".config",
    "gcloud",
    "application_default_credentials.json"
  );
};

const hasApplicationDefaultCredentials = () => {
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    return existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS);
  }

  if (existsSync(getWellKnownAdcPath())) {
    return true;
  }

  return Boolean(
    process.env.K_SERVICE ||
      process.env.GAE_ENV ||
      process.env.FUNCTION_TARGET ||
      process.env.GOOGLE_CLOUD_PROJECT ||
      process.env.GCLOUD_PROJECT ||
      process.env.GCE_METADATA_HOST
  );
};

const getAdminCredential = (projectId: string) => {
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (clientEmail && privateKey) {
    return cert({
      projectId,
      clientEmail,
      privateKey: privateKey.replace(/\\n/g, "\n"),
    });
  }

  if (hasApplicationDefaultCredentials()) {
    return applicationDefault();
  }

  throw new FirebaseAdminConfigurationError(
    "Firebase Admin requires either FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY or Google Application Default Credentials."
  );
};

const getAdminApp = () => {
  const existingApp = getApps()[0];

  if (existingApp) {
    return existingApp;
  }

  const projectId = getProjectId();

  if (!projectId) {
    throw new FirebaseAdminConfigurationError(
      "Firebase Admin requires FIREBASE_PROJECT_ID or NEXT_PUBLIC_FIREBASE_PROJECT_ID."
    );
  }

  return initializeApp({
    credential: getAdminCredential(projectId),
    projectId,
  });
};

export const getAdminAuth = () => getAuth(getAdminApp());
export const getAdminDb = () => getFirestore(getAdminApp());
