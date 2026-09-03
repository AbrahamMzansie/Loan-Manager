import Dexie from "dexie";

// Local IndexedDB database used only to queue writes made while offline.
// Reads (GET requests) are served offline by the service worker's HTTP
// cache (see vite.config.js runtimeCaching) — this store is purely an
// "outbox" of pending mutations waiting to be sent once back online.
export const db = new Dexie("loan-manager-offline");

db.version(1).stores({
  outbox: "++id, createdAt",
});

export default db;
