const admin = require("firebase-admin");

let firebaseApp;

const initializeFirebaseAdmin = () => {
  if (firebaseApp) {
    return firebaseApp;
  }

  try {
    const serviceAccountJson =
      process.env.FIREBASE_SERVICE_ACCOUNT;

    if (!serviceAccountJson) {
      throw new Error(
        "FIREBASE_SERVICE_ACCOUNT environment variable is missing."
      );
    }

    const serviceAccount = JSON.parse(serviceAccountJson);

    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    console.log("Firebase Admin initialized successfully.");

    return firebaseApp;
  } catch (error) {
    console.error("Firebase Admin initialization error:", error);
    throw error;
  }
};

const verifyFirebaseIdToken = async (idToken) => {
  try {
    const app = initializeFirebaseAdmin();

    const decodedToken = await admin
      .auth(app)
      .verifyIdToken(idToken);

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