// js/utils.js
function showLoading(message = 'Loading...') {
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'loading-overlay';
    loadingDiv.innerHTML = `
        <div class="loading-modal">
            <div class="loading-spinner"></div>
            <p>${message}</p>
        </div>
    `;
    document.body.appendChild(loadingDiv);
    return loadingDiv;
}

function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.innerHTML = `
        <div class="error-content">
            <i class="fas fa-exclamation-circle"></i>
            <span>${message}</span>
            <button class="error-close">&times;</button>
        </div>
    `;
    
    document.body.appendChild(errorDiv);
    
    setTimeout(() => {
        errorDiv.classList.add('show');
    }, 10);
    
    errorDiv.querySelector('.error-close').addEventListener('click', () => {
        errorDiv.remove();
    });
    
    setTimeout(() => {
        if (errorDiv.parentNode) {
            errorDiv.remove();
        }
    }, 5000);
}

function showSuccess(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.innerHTML = `
        <div class="success-content">
            <i class="fas fa-check-circle"></i>
            <span>${message}</span>
            <button class="success-close">&times;</button>
        </div>
    `;
    
    document.body.appendChild(successDiv);
    
    setTimeout(() => {
        successDiv.classList.add('show');
    }, 10);
    
    successDiv.querySelector('.success-close').addEventListener('click', () => {
        successDiv.remove();
    });
    
    setTimeout(() => {
        if (successDiv.parentNode) {
            successDiv.remove();
        }
    }, 3000);
}

function loadUserData() {
    try {
        const user = JSON.parse(localStorage.getItem('still_standing_user'));
        if (user) {
            // Update UI with user data
            document.getElementById('userName').textContent = user.name || user.email.split('@')[0];
            document.getElementById('userEmail').textContent = user.email;
            
            // Set avatar initials
            const initials = user.name 
                ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
                : user.email.substring(0, 2).toUpperCase();
            document.getElementById('userAvatar').innerHTML = initials || '<i class="fas fa-user"></i>';
            
            // Load dashboard data
            loadDashboardData();
        }
    } catch (error) {
        console.error('Error loading user data:', error);
    }
}

async function loadDashboardData() {
    try {
        const result = await API.getDashboardStats();
        if (result.success) {
            const dashboard = result.dashboard;
            
            // Update statistics
            document.getElementById('sessionCount').textContent = dashboard.statistics.completed_sessions || 0;
            document.getElementById('streakCount').textContent = dashboard.user.recovery_days || 0;
            document.getElementById('currentStreak').textContent = dashboard.statistics.current_streak || 0 + ' days';
            
            // Update next booking
            if (dashboard.next_booking) {
                const booking = dashboard.next_booking;
                const date = new Date(booking.booking_date).toLocaleDateString();
                document.getElementById('nextSessionDate').innerHTML = `
                    ${date} at ${booking.booking_time}<br>
                    with ${booking.counselor_name || 'Counselor'}
                `;
            }
        }
    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}