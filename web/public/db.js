(function () {
  // All helpers and variables are private to db.js and not accessible globally

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) {
        // Already loaded
        resolve();
        return;
      }
      const s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  // List of required Firebase scripts
  const firebaseScripts = [
    'https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js',
    'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth-compat.js',
    'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore-compat.js',
  ];

  /**
   * window.dbReady is a Promise that resolves when Firebase and all required scripts are loaded
   * and the FireDB class instance (window.db) is fully initialized and ready for use.
   *
   * Usage in other scripts:
   *   await window.dbReady;
   *   // Now window.db is guaranteed to be available and ready
   *
   * This ensures there are no race conditions when accessing window.db in your app.
   */

  // FireDB class definition
  // This class encapsulates the initialized Firebase app, auth, and firestore instances.
  // It is instantiated only after all scripts are loaded and Firebase is ready.
  class FireDB {
    constructor() {
      if (!firebase.apps.length) {
        this.app = firebase.initializeApp(window.firebaseConfig);
      } else {
        this.app = firebase.app();
      }
      this.auth = firebase.auth();
      this.firestore = firebase.firestore();
    }

    register(appState) {
      this.appState = appState;
      this.auth.onAuthStateChanged(user => {
        this.appState.setUser(user);
      });
    }

    signIn() {
      const provider = new firebase.auth.GoogleAuthProvider();
      this.auth.signInWithPopup(provider).catch(err => {
        alert('Sign-in failed: ' + err.message);
      });
    }

    signout() {
      this.auth.signOut();
    }
  }

  // Start loading scripts immediately at the top-level so they are fetched as soon as db.js is parsed
  const firebaseConfigPromise = loadScript("config/firebaseConfig.js");
  const firebaseScriptPromises = firebaseScripts.map(loadScript);

  // Helper to wait for Firestore to be available on the global firebase object
  // This ensures that firebase.firestore is attached before creating FireDB
  async function waitForFirestore() {
    const start = Date.now();
    while (typeof firebase === 'undefined' || typeof firebase.firestore !== 'function') {
      if (Date.now() - start > 2000) throw new Error('firebase.firestore not available');
      await new Promise(res => setTimeout(res, 20));
    }
  }

  // Expose the promise globally so consumers can await it
  // Awaiting window.dbReady guarantees that window.db is initialized and ready for use.
  window.dbReady = (async () => {
    await firebaseConfigPromise;
    await Promise.all(firebaseScriptPromises);
    await waitForFirestore();
    const dbInstance = new FireDB();
    window.db = dbInstance;
    return dbInstance;
  })();

})(); // End IIFE
