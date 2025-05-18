/** Application state */
export class AppState extends EventTarget {
  #state_change_event = 'state-changed';
  #inited = false;

  constructor() {
    super();
    this.listId = null;
    this.user = null;
  }

  #getListIdLocalKey() {
    return this.user ? 'yasl-last-list-' + this.user.uid : null;
  }

  #storeListId() {
    const key = this.#getListIdLocalKey();
    if (key) {
      const newLocal = 'yasl-last-list-' + this.user.uid;
      if (this.listId === null) {
        localStorage.removeItem(newLocal);
      } else {
        localStorage.setItem(newLocal, this.listId);
      }
    }
  }

  /**
   * Sets the current list id and dispatches a 'listid-changed' event.
   * @param {String} listId - The list id string, or null if no list is selected
   * @throws {TypeError} If listRef is not a string or null
   */
  setListId(listId) {
    if (listId !== null && typeof listId !== 'string') {
      throw new TypeError('AppState.setListId: listId must be a string or null');
    }

    // Check if listId has actually changed
    const hasListIdChanged = 
      listId === null && this.listId !== null ||
      listId !== null && this.listId === null ||
      listId !== null && this.listId !== null && listId !== this.listId;
    if (!hasListIdChanged) {
      return;
    }

    this.listId = listId;
    this.#storeListId();
    this.#fireChangedEvent();
  }

  #fireChangedEvent() {
    this.dispatchEvent(new CustomEvent(this.#state_change_event, { detail: { state: this } }));
  }

  /**
   * Sets the current user and dispatches an 'user-changed' event.
   * @param {Object} user - The user object, this user must have a uid, email and a displayName attribute, or null
   */
  #validateUser(user) {
    if (typeof user !== 'object') {
      throw new TypeError('AppState.setUser: user must be an object or null');
    }
    if (typeof user.uid !== 'string' || user.uid.trim() === '') {
      throw new TypeError('AppState.setUser: user must have a non-empty uid attribute');
    }
    if (typeof user.email !== 'string' || user.email.trim() === '') {
      throw new TypeError('AppState.setUser: user must have a non-empty email attribute');
    }
    if (typeof user.displayName !== 'string' || user.displayName.trim() === '') {
      throw new TypeError('AppState.setUser: user must have a non-empty displayName attribute');
    }
  }

  setUser(user) {
    // Validate user if provided
    if (user) {
      this.#validateUser(user);
    }

    if (this.#inited) {
      this.#standardSetUser(user);
    } else {
      this.#init(user);
    }
  }

  #init(user) {
    this.#inited = true;
    this.user = user;
    
    // Restore list ID
    this.#restoreListId();
    this.#fireChangedEvent();
  }

  #standardSetUser(user) {
      // Early return if no user change and app is already inited
      if (user === this.user || (user && this.user && user.uid === this.user.uid)) {
        return;
      }

      // Silently clear list id when user signs out
      if (user === null) {
        const key = this.#getListIdLocalKey();
        this.listId = null;
        if (key) {
          localStorage.removeItem(key);
        }
      }

      this.user = user;
      this.#restoreListId();
      this.#fireChangedEvent();
  }

  /**
   * Restores the list ID from local storage if the user is signed in.
   */
  #restoreListId() {
    if (this.user) {
      const lastListId = localStorage.getItem(this.#getListIdLocalKey());
      if (lastListId) {
        this.listId = lastListId;
      }
    }
  }

  event() {
    return this.#state_change_event;
  }
}
