// Public Firebase web-app configuration. Firebase API keys are not server secrets.
// Access is protected by Firebase Authentication and Realtime Database Security Rules.
export const firebaseConfig = {
  apiKey: "AIzaSyBL32KwCkJqSe2KBAO1sbuWLl83s4Cn8lo",
  authDomain: "modulos-3d5de.firebaseapp.com",
  databaseURL: "https://modulos-3d5de-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "modulos-3d5de",
  storageBucket: "modulos-3d5de.firebasestorage.app",
  messagingSenderId: "803636782488",
  appId: "1:803636782488:web:736eef934ac4c08ee177ed",
  measurementId: "G-79YXV1JXY5"
};

// Only this email can use the admin dashboard. Keep in sync with database.rules.json.
export const ADMIN_EMAIL = "geeky1934@gmail.com";
