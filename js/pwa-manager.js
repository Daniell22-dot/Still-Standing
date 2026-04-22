/**
 * STILL STANDING - PWA Manager
 * Handles service worker registration, offline support, and installation prompts
 */

class PWAManager {
    constructor() {
        this.deferredPrompt = null;
        this.installButton = null;
        this.init();
    }

    async init() {
        // Register service worker
        await this.registerServiceWorker();
        
        // Listen for beforeinstallprompt event
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;
            this.showInstallPrompt();
        });
        
        // Listen for app installed event
        window.addEventListener('appinstalled', () => {
            this.onAppInstalled();
        });
        
        // Check if app is already installed
        this.checkIfInstalled();
        
        // Setup offline detection
        this.setupOfflineDetection();
    }

    async registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/service-worker.js');
                console.log('Service Worker registered successfully:', registration);
                
                // Check for updates
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            this.showUpdateNotification();
                        }
                    });
                });
                
            } catch (error) {
                console.error('Service Worker registration failed:', error);
            }
        }
    }

    showInstallPrompt() {
        // Create install banner if not already shown
        if (localStorage.getItem('pwa_install_dismissed')) return;
        
        const banner = document.createElement('div');
        banner.className = 'pwa-install-banner';
        banner.innerHTML = `
            <div class="pwa-install-content">
                <div class="pwa-install-icon">
                    <i class="fas fa-mobile-alt"></i>
                </div>
                <div class="pwa-install-text">
                    <strong>Install STILL STANDING App</strong>
                    <p>Get quick access, offline support, and instant notifications</p>
                </div>
                <div class="pwa-install-buttons">
                    <button class="pwa-install-btn" id="pwaInstallBtn">Install</button>
                    <button class="pwa-dismiss-btn" id="pwaDismissBtn">Not Now</button>
                </div>
            </div>
        `;
        
        // Add styles
        banner.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 20px;
            right: 20px;
            background: white;
            border-radius: 12px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
            z-index: 10000;
            animation: slideUp 0.5s ease;
            max-width: 400px;
            margin: 0 auto;
        `;
        
        document.body.appendChild(banner);
        
        // Add install handler
        const installBtn = document.getElementById('pwaInstallBtn');
        if (installBtn) {
            installBtn.addEventListener('click', async () => {
                if (this.deferredPrompt) {
                    this.deferredPrompt.prompt();
                    const { outcome } = await this.deferredPrompt.userChoice;
                    if (outcome === 'accepted') {
                        console.log('User accepted the install prompt');
                    }
                    this.deferredPrompt = null;
                }
                banner.remove();
            });
        }
        
        // Add dismiss handler
        const dismissBtn = document.getElementById('pwaDismissBtn');
        if (dismissBtn) {
            dismissBtn.addEventListener('click', () => {
                localStorage.setItem('pwa_install_dismissed', 'true');
                banner.remove();
            });
        }
    }

    onAppInstalled() {
        console.log('App was installed');
        // Show success message
        this.showNotification('STILL STANDING installed successfully!');
        
        // Hide install prompt
        const banner = document.querySelector('.pwa-install-banner');
        if (banner) banner.remove();
    }

    checkIfInstalled() {
        // Check if app is running in standalone mode (installed)
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
        if (isStandalone) {
            console.log('App is running in standalone mode');
            // Hide install prompts
            localStorage.setItem('pwa_install_dismissed', 'true');
        }
    }

    setupOfflineDetection() {
        window.addEventListener('online', () => {
            this.showNotification('You are back online!', 'success');
            this.syncOfflineData();
        });
        
        window.addEventListener('offline', () => {
            this.showNotification('You are offline. Some features may be limited.', 'warning');
        });
        
        // Check initial status
        if (!navigator.onLine) {
            this.showNotification('You are offline. Previous content is still available.', 'info');
        }
    }

    async syncOfflineData() {
        // Sync any pending data from IndexedDB
        if ('indexedDB' in window) {
            // Implementation for syncing offline data
            console.log('Syncing offline data...');
        }
    }

    showUpdateNotification() {
        const notification = document.createElement('div');
        notification.className = 'pwa-update-notification';
        notification.innerHTML = `
            <div class="update-content">
                <i class="fas fa-sync-alt"></i>
                <span>New version available! Refresh to update.</span>
                <button id="refreshBtn">Refresh</button>
            </div>
        `;
        
        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: var(--secondary-color);
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 10000;
            animation: slideInRight 0.5s ease;
        `;
        
        document.body.appendChild(notification);
        
        const refreshBtn = document.getElementById('refreshBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                window.location.reload();
            });
        }
        
        setTimeout(() => {
            notification.remove();
        }, 10000);
    }

    showNotification(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `pwa-toast toast-${type}`;
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            bottom: 80px;
            left: 20px;
            right: 20px;
            background: ${type === 'success' ? '#2ecc71' : type === 'warning' ? '#f39c12' : '#3498db'};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 10000;
            animation: slideUp 0.3s ease;
            max-width: 350px;
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // Check if service worker supports push notifications
    async requestPushPermission() {
        if ('Notification' in window && 'serviceWorker' in navigator) {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                console.log('Push notifications granted');
                await this.subscribeToPush();
            }
        }
    }

    async subscribeToPush() {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: this.urlBase64ToUint8Array('YOUR_VAPID_PUBLIC_KEY')
        });
        
        // Send subscription to server
        await fetch('/api/push/subscribe', {
            method: 'POST',
            body: JSON.stringify(subscription),
            headers: { 'Content-Type': 'application/json' }
        });
    }

    urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }
}

// Initialize PWA manager
document.addEventListener('DOMContentLoaded', () => {
    window.pwaManager = new PWAManager();
});