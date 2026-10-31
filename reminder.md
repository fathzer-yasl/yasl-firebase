# Reminder: FireDB Interface and Backend Abstraction

**Question:**

In the future, I want to implement an alternative to FireDB with the same interface but another backend infrastructure, for instance a Web server with REST services and Web socket to be informed of changes. 
Would it be possible to keep the same interface, including the snapshot mechanism?

**Answer:**

Yes, it is absolutely possible—and a good architectural decision—to keep the same interface for your data access layer (e.g., `FireDB`), even if you swap out the backend implementation (e.g., from Firestore to REST+WebSocket). This is one of the main benefits of using an abstraction layer.

## Interface Consistency

As long as your alternative implementation:
- Returns promises for the same methods (`getList`, `getUserLists`, etc.)
- Returns objects with the same shape (e.g., `{ id, ...data, onSnapshot }`)
- Implements `onSnapshot` as a function that accepts a callback and returns an unsubscribe function

...then your front-end code will not need to change, regardless of whether the backend is Firestore, REST+WebSocket, or something else.

## Implementing `onSnapshot` with WebSockets

For a REST+WebSocket backend:
- `getList(id)` would fetch the current data via REST, and
- The returned object’s `onSnapshot` method would internally subscribe to WebSocket messages for that document, calling the callback when an update is received.
- The unsubscribe function would close or remove the relevant WebSocket listener.

**Example (pseudo-code):**
```js
async getList(id) {
  const data = await fetch(`/api/lists/${id}`).then(res => res.json());
  return {
    ...data,
    id,
    onSnapshot: (callback) => {
      const ws = new WebSocket(`wss://.../lists/${id}`);
      ws.onmessage = (event) => callback(JSON.parse(event.data));
      return () => ws.close();
    }
  };
}
```

## Benefits

- **Interchangeable backends:** You can swap or mock backends with minimal front-end code changes.
- **Testing:** Easier to test front-end logic with mock implementations.
- **Evolution:** You can gradually migrate from one backend to another.

---

**Conclusion:**  
Yes, you can and should keep the same interface, including the `onSnapshot` mechanism, even if the backend changes. Just ensure each implementation fulfills the contract of the interface.

If you want, I can help you draft an interface definition or a base class for this abstraction!
