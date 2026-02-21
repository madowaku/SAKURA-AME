/// <reference lib="webworker" />
import { precacheAndRoute } from 'workbox-precaching';
import { clientsClaim } from 'workbox-core';

declare let self: ServiceWorkerGlobalScope;

// Workbox の precache マニフェストを注入（vite-plugin-pwa が自動生成）
precacheAndRoute(self.__WB_MANIFEST);

// 新しい SW がインストールされたら即座にアクティブ化
self.skipWaiting();
clientsClaim();

// 通知クリックイベント
self.addEventListener('notificationclick', (event: NotificationEvent) => {
    event.notification.close();

    if (event.action === 'stop') {
        // 「雨を止める」ボタンがクリックされた
        event.waitUntil(
            self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
                for (const client of clientList) {
                    client.postMessage({ type: 'STOP_RAIN' });
                }
            })
        );
    } else {
        // 通知本体がクリックされた → アプリにフォーカス
        event.waitUntil(
            self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
                for (const client of clientList) {
                    if ('focus' in client) {
                        return (client as WindowClient).focus();
                    }
                }
                // 開いているウィンドウがなければ新しく開く
                return self.clients.openWindow('/');
            })
        );
    }
});
