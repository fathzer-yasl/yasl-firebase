/** Application state */
export class AppState extends EventTarget {
  constructor() {
    super();
    this.listId = null;
    this.user = null;
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
    this.listId = listId;
    this.dispatchEvent(new CustomEvent('listid-changed', { detail: { listId: listId } }));
  }

  /**
   * Sets the current user and dispatches an 'user-changed' event.
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
    this.dispatchEvent(new CustomEvent('user-changed', { detail: { user } }));
  }
}
