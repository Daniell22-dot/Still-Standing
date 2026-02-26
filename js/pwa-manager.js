// PWA Installer and Manager
class PWAManager {
    constructor() {
        this.deferredPrompt = null;
        this.init();
    }

    init() {
        // Register service worker
        if ('serviceWorker' in navigator) {
            this.registerServiceWorker();
        }

        // Listen for install prompt
        window.addEventListener('beforeinstallprompt', (e) => {
            console.log('[PWA] Install prompt available');
            e.preventDefault();
            this.deferredPrompt = e;
            this.showInstallButton();
        });

        // Listen for app installed
        window.addEventListener('appinstalled', () => {
            console.log('[PWA] App installed successfully');
            this.deferredPrompt = null;
            this.hideInstallButton();
            this.showToast('App installed successfully! You can now use STILL STANDING offline.');
        });

        // Check if already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            console.log('[PWA] Running in standalone mode');
        }
    }

    async registerServiceWorker() {
        try {
            const registration = await navigator.serviceWorker.register('/service-worker.js', {
                scope: '/'
            });

            console.log('[PWA] Service Worker registered:', registration.scope);

            // Check for updates
            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                console.log('[PWA] New service worker found');

                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'activated') {
                        this.showUpdateNotification();
                    }
                });
            });

            // Check for updates every hour
            setInterval(() => {
                registration.update();
            }, 60 * 60 * 1000);

        } catch (error) {
            console.error('[PWA] Service Worker registration failed:', error);
        }
    }

    showInstallButton() {
        // Create install button if it doesn't exist
        if (document.getElementById('pwa-install-btn')) return;

        const installBtn = document.createElement('button');
        installBtn.id = 'pwa-install-btn';
        installBtn.className = 'pwa-install-button';
        installBtn.innerHTML = `
            <i class="fas fa-download"></i>
            <span>Install App</span>
        `;
        installBtn.addEventListener('click', () => this.promptInstall());

        document.body.appendChild(installBtn);

        // Add styles
        const styles = `
            .pwa-install-button {
                position: fixed;
                top: 80px;
                right: 20px;
                background: var(--healing-color);
                color: white;
                border: none;
                padding: 12px 20px;
                border-radius: 25px;
                font-size: 0.9rem;
                font-weight: 600;
                cursor: pointer;
                box-shadow: 0 4px 15px rgba(52, 211, 153, 0.4);
                transition: all 0.3s ease;
                z-index: 998;
                display: flex;
                align-items: center;
                gap: 8px;
                animation: slideInRight 0.5s ease;
            }

            .pwa-install-button:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(52, 211, 153, 0.6);
            }

            .pwa-install-button i {
                font-size: 1.1rem;
            }

            @keyframes slideInRight {
                from {
                    transform: translateX(100px);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }

            @media (max-width: 768px) {
                .pwa-install-button {
                    top: auto;
                    bottom: 80px;
                    right: 20px;
                    font-size: 0.85rem;
                    padding: 10px 16px;
                }
            }
        `;

        const styleSheet = document.createElement('style');
        styleSheet.textContent = styles;
        document.head.appendChild(styleSheet);
    }

    hideInstallButton() {
        const btn = document.getElementById('pwa-install-btn');
        if (btn) {
            btn.style.animation = 'slideOutRight 0.5s ease';
            setTimeout(() => btn.remove(), 500);
        }
    }

    async promptInstall() {
        if (!this.deferredPrompt) {
            console.log('[PWA] Install prompt not available');
            return;
        }

        // Show install prompt
        this.deferredPrompt.prompt();

        // Wait for user choice
        const { outcome } = await this.deferredPrompt.userChoice;
        console.log(`[PWA] User ${outcome} the install prompt`);

        this.deferredPrompt = null;
        this.hideInstallButton();
    }

    showUpdateNotification() {
        const notification = document.createElement('div');
        notification.className = 'pwa-update-notification';
        notification.innerHTML = `
            <div class="pwa-update-content">
                <i class="fas fa-sync-alt"></i>
                <span>A new version is available!</span>
                <button onclick="window.location.reload()">Update Now</button>
            </div>
        `;

        document.body.appendChild(notification);

        const styles = `
            .pwa-update-notification {
                position: fixed;
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: var(--primary-color);
                color: white;
                padding: 15px 25px;
                border-radius: 10px;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
                z-index: 9999;
                animation: slideInDown 0.5s ease;
            }

            .pwa-update-content {
                display: flex;
                align-items: center;
                gap: 15px;
            }

            .pwa-update-content button {
                background: white;
                color: var(--primary-color);
                border: none;
                padding: 8px 16px;
                border-radius: 5px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
            }

            .pwa-update-content button:hover {
                transform: scale(1.05);
            }

            @keyframes slideInDown {
                from {
                    transform: translate(-50%, -100px);
                    opacity: 0;
                }
                to {
                    transform: translate(-50%, 0);
                    opacity: 1;
                }
            }
        `;

        const styleSheet = document.createElement('style');
        styleSheet.textContent = styles;
        document.head.appendChild(styleSheet);
    }

    showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'pwa-toast';
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            bottom: 30px;
            left: 50%;
            transform: translateX(-50%);
            background: #333;
            color: white;
            padding: 15px 25px;
            border-radius: 8px;
            font-size: 0.9rem;
            z-index: 9999;
            animation: fadeInOut 3s ease;
        `;

        document.body.appendChild(toast);

        setTimeout(() => toast.remove(), 3000);
    }

    // Check if offline
    checkOnlineStatus() {
        window.addEventListener('online', () => {
            this.showToast('✅ Back online!');
        });

        window.addEventListener('offline', () => {
            this.showToast('⚠️ You are offline. Some features may be limited.');
        });
    }
}

// Initialize PWA Manager
let pwaManager;
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        pwaManager = new PWAManager();
        pwaManager.checkOnlineStatus();
    });
} else {
    pwaManager = new PWAManager();
    pwaManager.checkOnlineStatus();
}

window.pwaManager = pwaManager;
