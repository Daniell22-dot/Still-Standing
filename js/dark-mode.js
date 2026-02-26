// Dark Mode Implementation

// Create dark mode CSS variables
const darkModeStyles = `
:root[data-theme="dark"] {
    /* Dark Theme Colors */
    --dark-bg: #0f0f23;
    --dark-bg-light: #1a1a2e;
    --dark-surface: #16213e;
    --dark-surface-light: #1f2a44;
    --dark-text: #e4e4e7;
    --dark-text-muted: #a1a1aa;
    --dark-border: #27272a;
    --dark-primary: #8b5cf6;
    --dark-secondary: #a78bfa;
    --dark-accent: #f87171;
    --dark-healing: #34d399;
    
    /* Override light theme variables */
    --background-color: var(--dark-bg);
    --surface-color: var(--dark-surface);
    --dark-color: var(--dark-text);
    --gray-color: var(--dark-text-muted);
    --border-color: var(--dark-border);
    --primary-color: var(--dark-primary);
    --secondary-color: var(--dark-secondary);
    --accent-color: var(--dark-accent);
    --healing-color: var(--dark-healing);
    
    /* Glassmorphism for dark mode */
    --glass-bg: rgba(30, 30, 46, 0.7);
    --glass-border: rgba(255, 255, 255, 0.1);
}

:root[data-theme="dark"] body {
    background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%);
    color: var(--dark-text);
}

:root[data-theme="dark"] .glass-panel {
    background: var(--glass-bg);
    border: 1px solid var(--glass-border);
    box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
}

:root[data-theme="dark"] .main-nav {
    background: rgba(15, 15, 35, 0.95);
    border-bottom: 1px solid var(--dark-border);
}

:root[data-theme="dark"] .nav-link {
    color: var(--dark-text);
}

:root[data-theme="dark"] .nav-link:hover {
    background: rgba(139, 92, 246, 0.1);
    color: var(--dark-primary);
}

:root[data-theme="dark"] input,
:root[data-theme="dark"] textarea,
:root[data-theme="dark"] select {
    background: var(--dark-surface-light);
    border: 1px solid var(--dark-border);
    color: var(--dark-text);
}

:root[data-theme="dark"] input:focus,
:root[data-theme="dark"] textarea:focus,
:root[data-theme="dark"] select:focus {
    border-color: var(--dark-primary);
    background: var(--dark-surface);
}

:root[data-theme="dark"] .admin-table {
    background: var(--glass-bg);
    border: 1px solid var(--glass-border);
}

:root[data-theme="dark"] .admin-table th {
    background: var(--dark-surface-light);
    color: var(--dark-text);
    border-bottom: 2px solid var(--dark-border);
}

:root[data-theme="dark"] .admin-table td {
    border-bottom: 1px solid var(--dark-border);
    color: var(--dark-text);
}

:root[data-theme="dark"] .admin-table tr:hover {
    background: rgba(139, 92, 246, 0.05);
}

:root[data-theme="dark"] .btn-primary {
    background: var(--dark-primary);
    color: white;
}

:root[data-theme="dark"] .btn-primary:hover {
    background: var(--dark-secondary);
}

:root[data-theme="dark"] .btn-outline {
    border: 1px solid var(--dark-primary);
    color: var(--dark-primary);
}

:root[data-theme="dark"] .btn-outline:hover {
    background: var(--dark-primary);
    color: white;
}

:root[data-theme="dark"] .modal-overlay {
    background: rgba(0, 0, 0, 0.85);
}

:root[data-theme="dark"] .modal-content {
    background: var(--dark-surface);
    color: var(--dark-text);
    border: 1px solid var(--dark-border);
}

:root[data-theme="dark"] .text-muted {
    color: var(--dark-text-muted);
}

:root[data-theme="dark"] .admin-sidebar {
    background: var(--dark-bg-light);
    border-right: 1px solid var(--dark-border);
}

:root[data-theme="dark"] .stat-card {
    background: var(--dark-surface);
    border: 1px solid var(--dark-border);
}

:root[data-theme="dark"] canvas#particle-canvas {
    opacity: 0.3;
}

/* Dark mode toggle button */
.dark-mode-toggle {
    position: fixed;
    bottom: 30px;
    right: 30px;
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: var(--primary-color);
    color: white;
    border: none;
    cursor: pointer;
    font-size: 1.4rem;
    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
    transition: all 0.3s ease;
    z-index: 999;
    display: flex;
    align-items: center;
    justify-content: center;
}

.dark-mode-toggle:hover {
    transform: scale(1.1);
    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
}

.dark-mode-toggle i {
    transition: transform 0.3s ease;
}

.dark-mode-toggle:active i {
    transform: rotate(360deg);
}

:root[data-theme="dark"] .dark-mode-toggle {
    background: var(--dark-secondary);
}
`;

// Inject dark mode styles
const styleSheet = document.createElement('style');
styleSheet.textContent = darkModeStyles;
document.head.appendChild(styleSheet);

// Dark Mode Toggle Functionality
class DarkModeManager {
    constructor() {
        this.theme = localStorage.getItem('still_standing_theme') || 'light';
        this.init();
    }

    init() {
        // Apply saved theme
        this.applyTheme(this.theme);

        // Create toggle button
        this.createToggleButton();

        // Listen for system preference changes
        if (window.matchMedia) {
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
                if (!localStorage.getItem('still_standing_theme')) {
                    this.setTheme(e.matches ? 'dark' : 'light');
                }
            });
        }
    }

    createToggleButton() {
        const button = document.createElement('button');
        button.className = 'dark-mode-toggle';
        button.setAttribute('aria-label', 'Toggle dark mode');
        button.setAttribute('title', 'Toggle dark mode');
        button.innerHTML = this.theme === 'dark' ?
            '<i class="fas fa-sun"></i>' :
            '<i class="fas fa-moon"></i>';

        button.addEventListener('click', () => this.toggleTheme());

        document.body.appendChild(button);
        this.toggleButton = button;
    }

    toggleTheme() {
        const newTheme = this.theme === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);
    }

    setTheme(theme) {
        this.theme = theme;
        this.applyTheme(theme);
        localStorage.setItem('still_standing_theme', theme);

        // Update button icon
        if (this.toggleButton) {
            this.toggleButton.innerHTML = theme === 'dark' ?
                '<i class="fas fa-sun"></i>' :
                '<i class="fas fa-moon"></i>';
        }
    }

    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);

        // Add transition for smooth theme change
        document.documentElement.style.transition = 'background-color 0.3s ease, color 0.3s ease';
        setTimeout(() => {
            document.documentElement.style.transition = '';
        }, 300);
    }

    getCurrentTheme() {
        return this.theme;
    }
}

// Initialize dark mode on page load
let darkModeManager;
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        darkModeManager = new DarkModeManager();
    });
} else {
    darkModeManager = new DarkModeManager();
}

// Export for use in other scripts
window.darkModeManager = darkModeManager;
