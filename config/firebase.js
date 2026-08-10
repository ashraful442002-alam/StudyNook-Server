const fs = require("fs");
const path = require("path");

const admin = require("firebase-admin");

const initializeFirebaseAdmin = () => {
  if (admin.apps.length) {
    return admin;
  }

  const serviceAccountPath =
    process.env.FIREBASE_SERVICE_ACCOUNT_PATH ||
    process.env.GOOGLE_APPLICATION_CREDENTIALS;

  const serviceAccountJson =
    process.env.FIREBASE_SERVICE_ACCOUNT;

  if (serviceAccountPath) {
    const resolvedPath = path.resolve(serviceAccountPath);

    if (!fs.existsSync(resolvedPath)) {
      throw new Error(
        `Firebase service account file not found at: ${resolvedPath}`
      );
    }

    const serviceAccount = require(resolvedPath);

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    return admin;
  }

  if (serviceAccountJson) {
    let serviceAccount;

    try {
      serviceAccount = JSON.parse(serviceAccountJson);
    } catch (error) {
      throw new Error(
        "FIREBASE_SERVICE_ACCOUNT must be a valid JSON string."
      );
    }

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    return admin;
  }

  if (process.env.FIREBASE_PROJECT_ID) {
    admin.initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID,
    });

    return admin;
  }

  throw new Error(
    "Firebase admin is not configured. Set FIREBASE_SERVICE_ACCOUNT_PATH, FIREBASE_SERVICE_ACCOUNT, GOOGLE_APPLICATION_CREDENTIALS or FIREBASE_PROJECT_ID in server/.env"
  );
};

const verifyFirebaseIdToken = async (idToken) => {
  const admin = initializeFirebaseAdmin();

  const decodedToken = await admin
    .auth()
    .verifyIdToken(idToken);

  return decodedToken;
};

module.exports = {
  initializeFirebaseAdmin,
  verifyFirebaseIdToken,
};
