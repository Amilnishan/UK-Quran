const CACHE_VERSION = 'v2';
const STATIC_CACHE = `ukquran-static-${CACHE_VERSION}`;
const RUNTIME_CACHE = `ukquran-runtime-${CACHE_VERSION}`;

const PRECACHE_URLS = [
    '/',
    '/index.html',
    '/teacher.html',
    '/student.html',
    '/reports.html',
    '/style.css',
    '/app.js',
    '/teacher.js',
    '/student.js',
    '/reports.js',
    '/firebase-config.js',
    '/manifest.json',
    '/sw.js',
    '/log.webp',
    '/download (4).webp',
    '/ChatGPT Image Jul 8, 2026, 12_31_21 PM.webp'
];

self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE_URLS))
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(
                keys
                    .filter((key) => key !== STATIC_CACHE && key !== RUNTIME_CACHE)
                    .map((key) => caches.delete(key))
            )
        ).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const request = event.request;
    const url = new URL(request.url);

    if (request.method !== 'GET') {
        return;
    }

    const isNavigation = request.mode === 'navigate';
    const isStaticAsset = PRECACHE_URLS.includes(url.pathname);
    const isFont = url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com');

    if (isNavigation) {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    if (response && response.status === 200) {
                        const copy = response.clone();
                        caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, copy));
                    }
                    return response;
                })
                .catch(() => caches.match('/index.html'))
        );
        return;
    }

    if (isStaticAsset || isFont || url.origin === location.origin) {
        event.respondWith(
            caches.match(request).then((cached) => {
                if (cached) {
                    return cached;
                }
                return fetch(request)
                    .then((response) => {
                        if (!response || response.status !== 200 || response.type === 'opaque') {
                            return response;
                        }
                        const copy = response.clone();
                        caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, copy));
                        return response;
                    })
                    .catch(() => cached || Promise.reject('no-match'));
            })
        );
    }
});
