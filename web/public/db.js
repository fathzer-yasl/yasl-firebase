import DatabaseInterface from './db.interface.js';
import { db } from './firebase-init.js';
import { collection, doc, getDocs, getDoc, setDoc, deleteDoc } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';

// All config and app initialization is handled in firebase-init.js


class FirestoreDatabase extends DatabaseInterface {
  constructor() {
    super();
    this.listsCollection = collection(db, 'lists');
  }

  async getLists() {
    await this.dbReady;
    const snapshot = await getDocs(this.listsCollection);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  async getList(id) {
    await this.dbReady;
    const docRef = doc(this.listsCollection, id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    return { id: docSnap.id, ...docSnap.data() };
  }

  async putList(id, data) {
    await this.dbReady;
    // If id is null or undefined, generate a new doc
    let docRef;
    if (!id) {
      docRef = doc(collection(this._db, 'lists'));
      id = docRef.id;
    } else {
      docRef = doc(this.listsCollection, id);
    }
    await setDoc(docRef, data, { merge: true });
    return { id, ...data };
  }

  async deleteList(id) {
    await this.dbReady;
    const docRef = doc(this.listsCollection, id);
    await deleteDoc(docRef);
    return true;
  }
}

const database = new FirestoreDatabase();
export default database;
