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
    static #LISTS_COLLECTION = 'stringList';
    #auth;
    #appState;
    /**
     * Initializes the connection to the database.
     */
    constructor() {
      if (!firebase.apps.length) {
        firebase.initializeApp(window.firebaseConfig);
      }
      this.#auth = firebase.auth();
      this.firestore = firebase.firestore();
    }

    /**
     * Registers the application state and sets up an authentication state observer.
     * @param {AppState} appState - The application state object that manages user data
     */
    register(appState) {
      if (typeof appState !== 'object' || appState === null) {
        throw new TypeError('FireDB.register: appState must be a non-null object');
      }
      if (typeof appState.setUser !== 'function') {
        throw new TypeError('FireDB.register: appState must have a setUser function');
      }
      this.#appState = appState;
      this.#auth.onAuthStateChanged(user => {
        this.#appState.setUser(user);
      });
    }

    /**
     * Initiates sign-in, possibly using a popup window.
     * Displays an alert if sign-in fails.
     */
    signIn() {
      const provider = new firebase.auth.GoogleAuthProvider();
      this.#auth.signInWithPopup(provider).catch(err => {
        alert('Sign-in failed: ' + err.message);
      });
    }

    /**
     * Signs out the currently authenticated user.
     */
    signout() {
      this.#auth.signOut();
    }

    /**
     * Gets the lists where the logged in user is in the 'users' array.
     * @returns {Promise<Array<{id: string, [field: string]: any}>>} Promise resolving to an array of list objects, each containing the document id and its data fields
     * @throws {Error} If no logged in user with an email is found
     */
    async getUserLists() {
      const user = this.#appState.user;
      if (!user?.email) throw new Error('A logged in user with an email is required');
      const snapshot = await this.firestore.collection(FireDB.#LISTS_COLLECTION)
        .where('users', 'array-contains', user.email)
        .get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    /**
     * Gets a list by its ID.
     * @param {string} id - The list ID
     * @returns {Promise<Object|null>} The list data with id, or null if not found. The returned object also has an onSnapshot method for real-time updates.
     *
     * Usage example:
     *   const list = await db.getList(id);
     *   if (list) {
     *     const unsubscribe = list.onSnapshot(updatedList => {
     *       // Handle real-time updates to this list document
     *       console.log(updatedList);
     *     });
     *     // Call unsubscribe() when you no longer want to listen.
     *   }
     */
    async getList(id) {
      const docRef = this.firestore.collection(FireDB.#LISTS_COLLECTION).doc(id);
      const doc = await docRef.get();
      if (!doc.exists) return null;
      const data = { id: doc.id, ...doc.data() };
      // Attach an onSnapshot method for real-time updates
      data.onSnapshot = (callback) => docRef.onSnapshot(snapshot => {
        callback({ id: snapshot.id, ...snapshot.data() });
      });
      return data;
    }

    /**
     * Updates a list by its ID with the provided data.
     * @param {Object} data - The list data to update, must include id
     * @returns {Promise<void>}
     */
    async updateList(data) {
      const { id, ...rest } = data;
      if (!id) throw new Error('updateList: id is required');
      await this.firestore.collection(FireDB.#LISTS_COLLECTION).doc(id).update(rest);
    }

    /**
     * Deletes a list by its ID.
     * @param {string} id - The list ID
     * @returns {Promise<void>}
     */
    async deleteList(id) {
      await this.firestore.collection(FireDB.#LISTS_COLLECTION).doc(id).delete();
    }

    /**
     * Creates a new list for the logged in user.
     * @param {string} name - The name of the list
     * @returns {Promise<string>} The ID of the newly created list
     * @throws {Error} If no logged in user with an email is found
     */
    createList(name) {
      const user = this.#appState.user;
      if (!user?.email) throw new Error('A logged in user with an email is required');
      return this.firestore.collection(FireDB.#LISTS_COLLECTION).add({
        name,
        users: [user.email],
        guests: [],
        list: []
      }).then(docRef => docRef.id);
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

})();
