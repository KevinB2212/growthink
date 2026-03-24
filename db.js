// ===== IndexedDB Storage Layer =====
// Drop-in replacement for localStorage with much higher limits
const DB_NAME = 'growthink';
const DB_VERSION = 1;
const STORE_NAME = 'data';

let _db = null;

function openDB() {
  return new Promise((resolve, reject) => {
    if (_db) { resolve(_db); return; }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = e => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = e => { _db = e.target.result; resolve(_db); };
    req.onerror = e => {
      console.warn('IndexedDB failed, falling back to localStorage');
      reject(e);
    };
  });
}

async function dbGet(key) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).get(key);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  } catch {
    // Fallback to localStorage
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : null;
  }
}

async function dbSet(key, value) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put(value, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // Fallback to localStorage
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      if (e.name === 'QuotaExceededError') {
        alert('Storage full! Try removing old photo/voice notes.');
      }
    }
  }
}

async function dbDelete(key) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    localStorage.removeItem(key);
  }
}

// Migrate existing localStorage data to IndexedDB on first load
async function migrateFromLocalStorage() {
  try {
    const db = await openDB();
    const migrated = await dbGet('_migrated');
    if (migrated) return;

    const keys = ['gt_state', 'gt_config', 'gt_notion', 'gt_focus_draft', 'gt_affirmation_dismissed'];
    for (const key of keys) {
      const val = localStorage.getItem(key);
      if (val) {
        await dbSet(key, JSON.parse(val));
      }
    }
    await dbSet('_migrated', true);
    console.log('Migrated localStorage → IndexedDB');
  } catch (e) {
    console.warn('Migration skipped:', e);
  }
}

// Sync wrapper - saves to both IndexedDB and localStorage (for backwards compat)
async function dbSave(key, value) {
  await dbSet(key, value);
  // Also keep localStorage as backup (skip if quota exceeded)
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

// Init: migrate on first load
migrateFromLocalStorage();
