const CACHE_NAME = 'focus-timer-v4';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
  '/sitemap.xml',
  '/robots.txt'
];

self.addEventListener('install', (event) => {
  // 立即激活新的 Service Worker
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('activate', (event) => {
  // 立即接管所有页面
  event.waitUntil(self.clients.claim());
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  // 忽略非 http/https 协议的请求（如 chrome-extension://）
  if (!event.request.url.startsWith('http://') || !event.request.url.startsWith('https://')) {
    return;
  }
  
  // 对于 HTML 文件，使用网络优先策略
  if (event.request.destination === 'document') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // 网络请求成功，更新缓存
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          return response;
        })
        .catch(() => {
          // 网络失败，使用缓存
          return caches.match(event.request);
        })
    );
    return;
  }
  
  // 对于 JS、CSS 等资源，使用网络优先策略
  if (event.request.url.match(/\.(js|css|jsx|ts|tsx)$/)) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // 网络请求成功，更新缓存
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          return response;
        })
        .catch(() => {
          // 网络失败，使用缓存
          return caches.match(event.request);
        })
    );
    return;
  }
  
  // 对于其他资源（图片、字体等），使用缓存优先策略
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          // 找到缓存，同时尝试从网络更新
          fetch(event.request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, responseToCache);
              });
            }
          }).catch(() => {
            // 网络请求失败，忽略
          });
          return response;
        }
        // 没有缓存，从网络获取
        return fetch(event.request).then((response) => {
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });
          return response;
        });
      })
  );
});
