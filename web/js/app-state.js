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

  setUser(user) {
    this.user = user;
    this.dispatchEvent(new CustomEvent('auth-changed', { detail: { user } }));
  }
}
