// ===== SECURITY MEASURES =====
document.addEventListener('DOMContentLoaded', function() {
    
    // 1. Basic Right-Click Protection (with message)
    document.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        showSecurityMessage('Content is protected to respect our community\'s stories. Thank you for understanding.');
    });
    
    // 2. Disable Developer Tools Shortcuts (Basic)
    document.addEventListener('keydown', function(e) {
        // Disable F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
        if (
            e.keyCode === 123 || // F12
            (e.ctrlKey && e.shiftKey && e.keyCode === 73) || // Ctrl+Shift+I
            (e.ctrlKey && e.shiftKey && e.keyCode === 74) || // Ctrl+Shift+J
            (e.ctrlKey && e.keyCode === 85) // Ctrl+U
        ) {
            e.preventDefault();
            showSecurityMessage('Developer tools are disabled on this page to protect community content.');
        }
    });
    
    // 3. Detect Console Opening (Advanced)
    let devtools = /./;
    devtools.toString = function() {
        showSecurityMessage('Please respect the privacy of our community.');
        return '';
    };
    
    console.log('%c', devtools);
    
    // 4. Blur on Tab Switch (For Booking/Private Pages)
    if (window.location.pathname.includes('booking-portal') || 
        window.location.pathname.includes('progress')) {
        
        document.addEventListener('visibilitychange', function() {
            if (document.hidden) {
                document.title = "Please return to STILL STANDING";
                showSecurityMessage('Your session is protected. Please return to the page for security.');
            } else {
                document.title = "STILL STANDING - Your Secure Space";
            }
        });
    }
    
    // 5. Encrypt Email (Optional - Basic obfuscation)
    const emailElement = document.querySelector('a[href^="mailto:"]');
    if (emailElement) {
        // This is a simple obfuscation - for real protection, use backend solutions
        const email = 'manyasadaniel630@gmail.com';
        emailElement.setAttribute('href', 'mailto:' + email);
        emailElement.textContent = email;
    }
    
    // 6. Security Notification Function
    function showSecurityMessage(message) {
        // Remove existing message if any
        const existingMsg = document.getElementById('security-alert');
        if (existingMsg) existingMsg.remove();
        
        // Create security message
        const securityAlert = document.createElement('div');
        securityAlert.id = 'security-alert';
        securityAlert.innerHTML = `
            <div style="position: fixed; top: 20px; right: 20px; background: #2c3e50; 
                       color: white; padding: 15px; border-radius: 5px; 
                       box-shadow: 0 4px 12px rgba(0,0,0,0.2); z-index: 9999;
                       max-width: 300px; animation: slideInRight 0.5s ease;">
                <i class="fas fa-shield-alt" style="margin-right: 10px;"></i>
                ${message}
                <button onclick="this.parentElement.remove()" 
                        style="background: none; border: none; color: #3498db; 
                               cursor: pointer; margin-left: 10px; float: right;">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        document.body.appendChild(securityAlert);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (securityAlert.parentElement) {
                securityAlert.remove();
            }
        }, 5000);
    }
    
    // 7. Session Management (For Booking Portal)
    if (window.location.pathname.includes('booking-portal')) {
        let idleTimer;
        
        function resetIdleTimer() {
            clearTimeout(idleTimer);
            idleTimer = setTimeout(() => {
                // After 30 minutes of inactivity
                if (confirm('Your session will expire due to inactivity. Continue?')) {
                    resetIdleTimer();
                } else {
                    window.location.href = 'index.html';
                }
            }, 30 * 60 * 1000); // 30 minutes
        }
        
        // Reset timer on user activity
        ['click', 'mousemove', 'keypress', 'scroll'].forEach(event => {
            document.addEventListener(event, resetIdleTimer);
        });
        
        resetIdleTimer();
    }
});

// 8. Prevent Frame Embedding (Clickjacking protection)
if (self !== top) {
    top.location = self.location;
}

// 9. Log Page Views (For Security Monitoring)
window.addEventListener('load', function() {
    // In a real implementation, this would send to your server
    console.log('STILL STANDING: Page loaded - ' + window.location.pathname);
    
    // Record page view (for analytics and security)
    const pageView = {
        page: window.location.pathname,
        timestamp: new Date().toISOString(),
        referrer: document.referrer
    };
    
    // Store locally (in real app, send to server)
    try {
        const views = JSON.parse(localStorage.getItem('page_views') || '[]');
        views.push(pageView);
        if (views.length > 100) views.shift(); // Keep only last 100
        localStorage.setItem('page_views', JSON.stringify(views));
    } catch (e) {
        // Silent fail
    }
});