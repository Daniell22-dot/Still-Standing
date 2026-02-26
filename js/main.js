const API_BASE_URL = 'http://localhost:5000/api/v1';

// Load Daily Verse Script
function loadDailyVerse() {
    const script = document.createElement('script');
    script.src = 'js/daily-verse.js';
    script.onload = function () {
        if (window.dailyVerse) {
            window.dailyVerse.display();
        }
    };
    document.body.appendChild(script);
}

// Load Particles Script
function loadParticles() {
    const script = document.createElement('script');
    script.src = 'js/particles.js';
    document.body.appendChild(script);
}

document.addEventListener('DOMContentLoaded', () => {
    loadDailyVerse();
    loadParticles();
});

// Get authentication token from localStorage
const getAuthToken = () => {
    return localStorage.getItem('still_standing_token');
};

// Set up axios or fetch with authentication
const apiRequest = async (endpoint, method = 'GET', data = null) => {
    const token = getAuthToken();
    const headers = {
        'Content-Type': 'application/json',
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const options = {
        method,
        headers,
        body: data ? JSON.stringify(data) : null
    };

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'API request failed');
        }

        return result;
    } catch (error) {
        console.error('API request error:', error);
        throw error;
    }
};

// Example: Login function
const loginUser = async (email, password) => {
    try {
        const response = await apiRequest('/auth/login', 'POST', { email, password });

        if (response.success && response.token) {
            // Save token and user data
            localStorage.setItem('still_standing_token', response.token);
            localStorage.setItem('still_standing_user', JSON.stringify(response.user));

            return response;
        }
    } catch (error) {
        console.error('Login error:', error);
        throw error;
    }
};

// Example: Get user bookings
const getUserBookings = async () => {
    try {
        const response = await apiRequest('/bookings/my-bookings', 'GET');
        return response;
    } catch (error) {
        console.error('Get bookings error:', error);
        throw error;
    }
};

// Example: Create booking
const createBooking = async (bookingData) => {
    try {
        const response = await apiRequest('/bookings', 'POST', bookingData);
        return response;
    } catch (error) {
        console.error('Create booking error:', error);
        throw error;
    }
};

// Example: Submit story
const submitStory = async (storyData) => {
    try {
        const response = await apiRequest('/stories', 'POST', storyData);
        return response;
    } catch (error) {
        console.error('Submit story error:', error);
        throw error;
    }
};

// Example: Update progress
const updateProgress = async (progressData) => {
    try {
        const response = await apiRequest('/progress', 'POST', progressData);
        return response;
    } catch (error) {
        console.error('Update progress error:', error);
        throw error;
    }
};

// Add these functions to window object for global access
window.api = {
    request: apiRequest,
    login: loginUser,
    getBookings: getUserBookings,
    createBooking,
    submitStory,
    updateProgress,
    getToken: getAuthToken
};

// Check if user is logged in on page load
document.addEventListener('DOMContentLoaded', function () {
    const token = getAuthToken();
    if (token) {
        // User is logged in
        console.log('User is authenticated');
        // You can fetch user data or update UI here
    }
});

document.addEventListener('DOMContentLoaded', function () {

    // 1. Remove Loading Screen
    setTimeout(() => {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.style.opacity = '0';
            setTimeout(() => {
                loadingScreen.style.display = 'none';
            }, 500);
        }
    }, 1000);

    // 2. Mobile Menu Toggle
    const menuToggle = document.getElementById('menuToggle');
    const navLinks = document.getElementById('navLinks');

    if (menuToggle) {
        menuToggle.addEventListener('click', function () {
            navLinks.classList.toggle('active');
            menuToggle.innerHTML = navLinks.classList.contains('active')
                ? '<i class="fas fa-times"></i>'
                : '<i class="fas fa-bars"></i>';
        });
    }

    // Close menu when clicking outside
    document.addEventListener('click', function (event) {
        if (navLinks && navLinks.classList.contains('active') &&
            !event.target.closest('.nav-container') &&
            !event.target.closest('#navLinks')) {
            navLinks.classList.remove('active');
            menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
        }
    });

    // 3. Scroll Animations
    const animateOnScroll = function () {
        const elements = document.querySelectorAll('.scroll-animate');

        elements.forEach(element => {
            const elementPosition = element.getBoundingClientRect().top;
            const screenPosition = window.innerHeight / 1.2;

            if (elementPosition < screenPosition) {
                element.classList.add('animated');
            }
        });
    };

    // Initial check
    animateOnScroll();

    // Check on scroll
    window.addEventListener('scroll', animateOnScroll);

    // 4. Set Current Year in Footer
    const currentYear = new Date().getFullYear();
    const yearElement = document.getElementById('currentYear');
    if (yearElement) {
        yearElement.textContent = currentYear;
    }

    // 5. Smooth Scroll for Anchor Links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();

            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 80,
                    behavior: 'smooth'
                });

                // Close mobile menu if open
                if (navLinks.classList.contains('active')) {
                    navLinks.classList.remove('active');
                    menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
                }
            }
        });
    });

    // 6. Emergency Button Animation
    const crisisBtn = document.querySelector('.crisis-btn');
    if (crisisBtn) {
        crisisBtn.addEventListener('mouseenter', function () {
            this.style.animation = 'pulse 0.5s infinite';
        });

        crisisBtn.addEventListener('mouseleave', function () {
            this.style.animation = 'pulse 2s infinite';
        });
    }

    // 7. Back to Top Button (Dynamic)
    const backToTopBtn = document.createElement('button');
    backToTopBtn.innerHTML = '<i class="fas fa-chevron-up"></i>';
    backToTopBtn.className = 'back-to-top';
    backToTopBtn.style.cssText = `
        position: fixed;
        bottom: 30px;
        right: 30px;
        background: var(--secondary-color);
        color: white;
        width: 50px;
        height: 50px;
        border-radius: 50%;
        border: none;
        cursor: pointer;
        opacity: 0;
        transform: translateY(20px);
        transition: all 0.3s ease;
        z-index: 999;
        box-shadow: 0 4px 12px rgba(52, 152, 219, 0.3);
        font-size: 1.2rem;
    `;

    document.body.appendChild(backToTopBtn);

    // Show/hide back to top button
    window.addEventListener('scroll', function () {
        if (window.pageYOffset > 300) {
            backToTopBtn.style.opacity = '1';
            backToTopBtn.style.transform = 'translateY(0)';
        } else {
            backToTopBtn.style.opacity = '0';
            backToTopBtn.style.transform = 'translateY(20px)';
        }
    });

    backToTopBtn.addEventListener('click', function () {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });

    // 8. Form Handling (Contact Forms)
    const contactForms = document.querySelectorAll('.contact-form');
    contactForms.forEach(form => {
        form.addEventListener('submit', function (e) {
            e.preventDefault();

            // Basic validation
            const requiredFields = this.querySelectorAll('[required]');
            let isValid = true;

            requiredFields.forEach(field => {
                if (!field.value.trim()) {
                    field.style.borderColor = 'var(--accent-color)';
                    isValid = false;
                } else {
                    field.style.borderColor = '';
                }
            });

            if (!isValid) {
                showNotification('Please fill in all required fields.', 'error');
                return;
            }

            // Show loading state
            const submitBtn = this.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
            submitBtn.disabled = true;

            // Simulate form submission (In real app, use fetch to your backend)
            setTimeout(() => {
                showNotification('Message sent successfully! We\'ll contact you soon.', 'success');
                form.reset();
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }, 1500);
        });
    });

    // 9. Notification System
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div style="position: fixed; top: 100px; right: 20px; 
                       background: ${type === 'success' ? '#2ecc71' : type === 'error' ? '#e74c3c' : '#3498db'}; 
                       color: white; padding: 15px 20px; border-radius: 5px; 
                       box-shadow: 0 4px 12px rgba(0,0,0,0.2); z-index: 9999;
                       max-width: 300px; animation: slideInRight 0.5s ease;">
                <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}" 
                   style="margin-right: 10px;"></i>
                ${message}
                <button onclick="this.parentElement.remove()" 
                        style="background: none; border: none; color: white; 
                               cursor: pointer; margin-left: 15px; float: right;">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        document.body.appendChild(notification);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }

    // 10. Dynamic Content Loading (For ARR Rules, etc.)
    window.loadContent = function (url, targetElementId) {
        const targetElement = document.getElementById(targetElementId);
        if (!targetElement) return;

        targetElement.innerHTML = '<div class="loading-content"><div class="loading-spinner"></div><p>Loading content...</p></div>';

        // In a real implementation, fetch from server
        setTimeout(() => {
            // This is where you would fetch actual content
            targetElement.innerHTML = '<p>Content loaded. In a real implementation, this would fetch from your server.</p>';
        }, 1000);
    };

    // 11. Accessibility Improvements
    // Add keyboard navigation for dropdowns
    const dropdowns = document.querySelectorAll('.dropdown > a');
    dropdowns.forEach(dropdown => {
        dropdown.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.parentElement.classList.toggle('open');
            }
        });
    });

    // Close dropdowns when clicking escape
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            document.querySelectorAll('.dropdown.open').forEach(dropdown => {
                dropdown.classList.remove('open');
            });
        }
    });

    // 12. Initialize Components
    console.log('STILL STANDING - Initialized');
});