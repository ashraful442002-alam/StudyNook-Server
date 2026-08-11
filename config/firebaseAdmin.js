const admin = require("firebase-admin");

let firebaseApp = null;

const initializeFirebaseAdmin = () => {
  if (firebaseApp) {
    return firebaseApp;
  }

  const serviceAccountJson =
    process.env.FIREBASE_SERVICE_ACCOUNT;

  if (!serviceAccountJson) {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT is missing from environment variables."
    );
  }

  let serviceAccount;

  try {
    serviceAccount = JSON.parse(serviceAccountJson);
  } catch (error) {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT contains invalid JSON."
    );
  }

  if (
    !serviceAccount.project_id ||
    !serviceAccount.client_email ||
    !serviceAccount.private_key
  ) {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT is missing project_id, client_email, or private_key."
    );
  }

  firebaseApp = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  console.log(
    `Firebase Admin initialized for project: ${serviceAccount.project_id}`
  );

  return firebaseApp;
};

const verifyFirebaseIdToken = async (idToken) => {
  try {
    const app = initializeFirebaseAdmin();

    const decodedToken = await admin
      .auth(app)
      .verifyIdToken(idToken);

    return decodedToken;
  } catch (error) {
    console.error(
      "Firebase token verification error:",
      error
    );

    throw error;
  }
};

module.exports = {
  initializeFirebaseAdmin,
  verifyFirebaseIdToken,
};