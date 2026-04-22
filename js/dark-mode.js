/**
 * STILL STANDING - Dark Mode Manager
 * Handles theme switching, persistence, and user preferences
 */

class DarkModeManager {
    constructor() {
        this.theme = localStorage.getItem('still_standing_theme') || 'light';
        this.toggleButton = null;
        this.init();
    }

    init() {
        // Apply saved theme
        this.applyTheme(this.theme);
        
        // Create toggle button if it doesn't exist
        this.createToggleButton();
        
        // Listen for system preference changes
        this.listenForSystemPreference();
        
        // Listen for storage changes (sync across tabs)
        window.addEventListener('storage', (e) => {
            if (e.key === 'still_standing_theme') {
                this.applyTheme(e.newValue);
            }
        });
    }

    applyTheme(theme) {
        const root = document.documentElement;
        
        if (theme === 'dark') {
            root.setAttribute('data-theme', 'dark');
            this.updateToggleButton(true);
            document.body.style.background = '#0f0f1a';
        } else {
            root.removeAttribute('data-theme');
            this.updateToggleButton(false);
            document.body.style.background = '';
        }
        
        this.theme = theme;
        localStorage.setItem('still_standing_theme', theme);
        
        // Dispatch event for other components
        window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme } }));
    }

    createToggleButton() {
        // Check if button already exists
        if (document.querySelector('.dark-mode-toggle')) return;
        
        // Find navigation container
        const navContainer = document.querySelector('.nav-container');
        if (!navContainer) return;
        
        // Create toggle button
        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'dark-mode-toggle';
        toggleBtn.setAttribute('aria-label', 'Toggle dark mode');
        toggleBtn.innerHTML = `
            <i class="fas fa-moon"></i>
            <i class="fas fa-sun" style="display: none;"></i>
        `;
        
        // Add styles
        toggleBtn.style.cssText = `
            background: none;
            border: none;
            cursor: pointer;
            font-size: 1.2rem;
            color: var(--gray-700);
            padding: 8px;
            border-radius: 50%;
            transition: all 0.3s ease;
            margin-left: 15px;
        `;
        
        // Add hover effect
        toggleBtn.addEventListener('mouseenter', () => {
            toggleBtn.style.background = 'rgba(0,0,0,0.05)';
        });
        toggleBtn.addEventListener('mouseleave', () => {
            toggleBtn.style.background = 'none';
        });
        
        // Add click handler
        toggleBtn.addEventListener('click', () => this.toggle());
        
        // Insert after crisis button or at end of nav-container
        const crisisAlert = document.querySelector('.crisis-alert');
        if (crisisAlert) {
            crisisAlert.after(toggleBtn);
        } else {
            navContainer.appendChild(toggleBtn);
        }
        
        this.toggleButton = toggleBtn;
        this.updateToggleButton(this.theme === 'dark');
    }

    updateToggleButton(isDark) {
        if (!this.toggleButton) return;
        
        const moonIcon = this.toggleButton.querySelector('.fa-moon');
        const sunIcon = this.toggleButton.querySelector('.fa-sun');
        
        if (isDark) {
            moonIcon.style.display = 'none';
            sunIcon.style.display = 'inline-block';
            this.toggleButton.style.color = '#f39c12';
        } else {
            moonIcon.style.display = 'inline-block';
            sunIcon.style.display = 'none';
            this.toggleButton.style.color = '';
        }
    }

    toggle() {
        const newTheme = this.theme === 'light' ? 'dark' : 'light';
        this.applyTheme(newTheme);
        
        // Show feedback
        this.showToast(`Dark mode ${newTheme === 'dark' ? 'enabled' : 'disabled'}`);
    }

    listenForSystemPreference() {
        // Check if user hasn't set a preference
        if (!localStorage.getItem('still_standing_theme')) {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            if (prefersDark) {
                this.applyTheme('dark');
            }
        }
        
        // Listen for system preference changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            // Only apply if user hasn't manually set a preference
            if (!localStorage.getItem('still_standing_theme')) {
                this.applyTheme(e.matches ? 'dark' : 'light');
            }
        });
    }

    showToast(message) {
        // Create toast if it doesn't exist
        let toast = document.querySelector('.dark-mode-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.className = 'dark-mode-toast';
            toast.style.cssText = `
                position: fixed;
                bottom: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: var(--gray-800);
                color: white;
                padding: 10px 20px;
                border-radius: 8px;
                font-size: 0.9rem;
                z-index: 10000;
                opacity: 0;
                transition: opacity 0.3s ease;
                pointer-events: none;
            `;
            document.body.appendChild(toast);
        }
        
        toast.textContent = message;
        toast.style.opacity = '1';
        
        setTimeout(() => {
            toast.style.opacity = '0';
        }, 2000);
    }

    // Get current theme
    getTheme() {
        return this.theme;
    }

    // Check if dark mode is active
    isDark() {
        return this.theme === 'dark';
    }
}

// Initialize dark mode when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.darkMode = new DarkModeManager();
});