const fs = require("fs");
const path = require("path");
const admin = require("firebase-admin");
const { getAuth } = require("firebase-admin/auth");

let firebaseApp;

const loadServiceAccount = () => {
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

  if (serviceAccountJson) {
    try {
      const parsed = JSON.parse(serviceAccountJson);
      if (parsed.project_id && parsed.client_email && parsed.private_key) {
        return parsed;
      }
    } catch (error) {
      console.warn(
        "FIREBASE_SERVICE_ACCOUNT is not valid JSON, falling back to file path..."
      );
    }
  }

  if (serviceAccountPath) {
    const resolvedPath = path.isAbsolute(serviceAccountPath)
      ? serviceAccountPath
      : path.resolve(process.cwd(), serviceAccountPath);

    if (fs.existsSync(resolvedPath)) {
      const parsed = JSON.parse(fs.readFileSync(resolvedPath, "utf8"));
      if (parsed.project_id && parsed.client_email && parsed.private_key) {
        return parsed;
      }
    }
  }

  throw new Error(
    "Firebase service account credentials are missing. Set FIREBASE_SERVICE_ACCOUNT (JSON) or FIREBASE_SERVICE_ACCOUNT_PATH to a valid service account key file."
  );
};

const initializeFirebaseAdmin = () => {
  if (firebaseApp) {
    return firebaseApp;
  }

  const serviceAccount = loadServiceAccount();

  firebaseApp = admin.initializeApp({
    credential: admin.cert(serviceAccount),
  });

  console.log("Firebase Admin initialized successfully.");

  return firebaseApp;
};

const verifyFirebaseIdToken = async (idToken) => {
  try {
    const app = initializeFirebaseAdmin();

    const decodedToken = await getAuth(app).verifyIdToken(idToken);

    return decodedToken;
  } catch (error) {
    console.error("Firebase token verification error:", error);
    throw error;
  }
};

module.exports = {
  initializeFirebaseAdmin,
  verifyFirebaseIdToken,
};
