import { useEffect, useState } from "react";
import { db } from "./firebase";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";

function App() {
  const [items, setItems] = useState([]);
  const [newItem, setNewItem] = useState("");

  // READ
  const loadData = async () => {
    const snapshot = await getDocs(collection(db, "items"));
    setItems(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
  };

  useEffect(() => {
    loadData();
  }, []);

  // CREATE
  const addItem = async () => {
    await addDoc(collection(db, "items"), { name: newItem });
    setNewItem("");
    loadData();
  };

  // UPDATE
  const updateItem = async (id) => {
    const ref = doc(db, "items", id);
    await updateDoc(ref, { name: prompt("New name:") });
    loadData();
  };

  // DELETE
  const deleteItem = async (id) => {
    await deleteDoc(doc(db, "items", id));
    loadData();
  };

  return (
    <div style={{ margin: 20 }}>
      <h2>React + Firebase CRUD</h2>

      <input
        value={newItem}
        onChange={(e) => setNewItem(e.target.value)}
        placeholder="Add Item"
      />
      <button onClick={addItem}>Add</button>

      <ul>
        {items.map((i) => (
          <li key={i.id}>
            {i.name}
            <button onClick={() => updateItem(i.id)}>Update</button>
            <button onClick={() => deleteItem(i.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
