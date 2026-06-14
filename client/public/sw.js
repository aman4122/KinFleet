const CACHE_NAME = 'vahantrack-cache-v1';
const SOS_QUEUE_NAME = 'sos-offline-queue';

const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/offline.html'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  // If it's an SOS API call and we're offline, intercept it
  if (event.request.url.includes('/api/sos/trigger') && !navigator.onLine) {
    event.respondWith(
      (async () => {
        try {
          const clonedRequest = event.request.clone();
          const body = await clonedRequest.json();
          
          // Store in IndexedDB (simplified for demo, typically use idb library)
          // Since BackgroundSync isn't supported everywhere, we simulate a queue
          queueSOSTrigger(body);
          
          return new Response(JSON.stringify({ 
            success: true, 
            message: 'SOS trigger queued for when offline', 
            offline: true 
          }), {
            headers: { 'Content-Type': 'application/json' }
          });
        } catch (error) {
          return new Response(JSON.stringify({ error: 'Failed to queue SOS' }), { status: 500 });
        }
      })()
    );
    return;
  }

  // Standard cache-first strategy for static assets
  event.respondWith(
    caches.match(event.request)
      .then((response) => response || fetch(event.request))
  );
});

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-sos') {
    event.waitUntil(syncSOSQueue());
  }
});

// Helper for Background Sync (simplistic implementation)
async function queueSOSTrigger(data) {
  const request = indexedDB.open('vahantrack_offline', 1);
  request.onupgradeneeded = (e) => {
    const db = e.target.result;
    if (!db.objectStoreNames.contains('sos_queue')) {
      db.createObjectStore('sos_queue', { autoIncrement: true });
    }
  };
  request.onsuccess = (e) => {
    const db = e.target.result;
    const tx = db.transaction('sos_queue', 'readwrite');
    tx.objectStore('sos_queue').add({
      timestamp: Date.now(),
      payload: data
    });
    
    // Register sync if supported
    if ('sync' in self.registration) {
      self.registration.sync.register('sync-sos');
    }
  };
}

async function syncSOSQueue() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('vahantrack_offline', 1);
    request.onsuccess = async (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('sos_queue')) return resolve();
      
      const tx = db.transaction('sos_queue', 'readwrite');
      const store = tx.objectStore('sos_queue');
      const getAllRequest = store.getAll();
      
      getAllRequest.onsuccess = async () => {
        const queuedItems = getAllRequest.result;
        for (const item of queuedItems) {
          try {
            await fetch('/api/sos/trigger', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(item.payload)
            });
            // Delete upon success
            const deleteTx = db.transaction('sos_queue', 'readwrite');
            deleteTx.objectStore('sos_queue').clear();
          } catch (err) {
            console.error('Failed to sync SOS', err);
          }
        }
        resolve();
      };
    };
  });
}
