/** Application state */
export class AppState extends EventTarget {
  constructor() {
    super();
    this.currentListRef = null;
    this.user = null;
  }

  setListRef(listRef) {
    this.currentListRef = listRef;
    this.dispatchEvent(new CustomEvent('listref-changed', { detail: { listRef } }));
  }

  clearListRef() {
    this.currentListRef = null;
    this.dispatchEvent(new CustomEvent('listref-changed', { detail: { listRef: null } }));
  }

  /**
   * Sets the current user and dispatches an 'auth-changed' event.
   * @param {Object} user - The user object, this user must have an email and a displayName attribute, or null
   */
  setUser(user) {
    if (user !== null) {
      if (typeof user !== 'object') {
        throw new TypeError('AppState.setUser: user must be an object or null');
      }
      if (typeof user.email !== 'string' || user.email.trim() === '') {
        throw new TypeError('AppState.setUser: user must have a non-empty email attribute');
      }
      if (typeof user.displayName !== 'string' || user.displayName.trim() === '') {
        throw new TypeError('AppState.setUser: user must have a non-empty displayName attribute');
      }
    }
    this.user = user;
    this.dispatchEvent(new CustomEvent('auth-changed', { detail: { user } }));
  }
}
