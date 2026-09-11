// Service Worker cho PWA
// Dung duong dan tuong doi de chay dung tren GitHub Pages

const CACHE_NAME = "scanToWeb-v58-pwa-1";

const APP_FILES = [
    "./",
    "./index.html",
    "./style.css",
    "./script.js",
    "./google-sheet-API.js",
    "./configAPI.json",
    "./favicon.png",
    "./icon-192.png",
    "./icon-512.png",
    "./manifest.json"
];

// Cai dat va cache cac file cua ung dung
self.addEventListener("install", event => {

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(APP_FILES))
            .then(() => self.skipWaiting())
    );

});

// Xoa cache phien ban cu
self.addEventListener("activate", event => {

    event.waitUntil(
        caches.keys().then(keys => {

            return Promise.all(
                keys.map(key => {

                    if (key !== CACHE_NAME) {
                        return caches.delete(key);
                    }

                })
            );

        }).then(() => self.clients.claim())
    );

});

// Chi cache cac file cung domain cua ung dung
self.addEventListener("fetch", event => {

    if (event.request.method !== "GET") return;

    const url = new URL(event.request.url);

    // Cac API, Google Form va CDN luon lay truc tiep tu mang
    if (url.origin !== self.location.origin) return;

    event.respondWith(
        caches.match(event.request).then(cached => {

            if (cached) return cached;

            return fetch(event.request)
                .then(response => {

                    if (!response || response.status !== 200) {
                        return response;
                    }

                    const copy = response.clone();

                    caches.open(CACHE_NAME)
                        .then(cache => cache.put(event.request, copy));

                    return response;

                });

        })
    );

});
