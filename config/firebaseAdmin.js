const fs = require("fs");
const path = require("path");
const admin = require("firebase-admin");

const initializeFirebaseAdmin = () => {
  if (admin.apps.length) {
    return admin;
  }

  // Production: Render environment variable
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      const serviceAccount = JSON.parse(
        process.env.FIREBASE_SERVICE_ACCOUNT
      );

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });

      return admin;
    } catch (error) {
      console.error(
        "Firebase service account JSON error:",
        error
      );

      throw new Error(
        "Invalid FIREBASE_SERVICE_ACCOUNT JSON."
      );
    }
  }

  // Local development: service-account-key.json
  const serviceAccountPath = path.join(
    __dirname,
    "service-account-key.json"
  );

  if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = require(
      serviceAccountPath
    );

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    return admin;
  }

  throw new Error(
    "Firebase Admin is not configured."
  );
};

const verifyFirebaseIdToken = async (idToken) => {
  const firebaseAdmin = initializeFirebaseAdmin();

  return await firebaseAdmin
    .auth()
    .verifyIdToken(idToken);
};

module.exports = {
  initializeFirebaseAdmin,
  verifyFirebaseIdToken,
};