// ===== BOOKING SYSTEM =====
document.addEventListener('DOMContentLoaded', function() {
    
    if (!window.location.pathname.includes('booking-portal')) return;
    
    // 1. Authentication Check (Simplified - In real app, use proper auth)
    function checkAuth() {
        const user = JSON.parse(localStorage.getItem('still_standing_user'));
        if (!user) {
            window.location.href = 'index.html?redirect=booking';
            return null;
        }
        return user;
    }
    
    // 2. Initialize Booking Calendar
    function initBookingCalendar() {
        const calendarEl = document.getElementById('bookingCalendar');
        if (!calendarEl) return;
        
        // Simplified calendar - in real app, use FullCalendar library
        const today = new Date();
        const monthNames = ["January", "February", "March", "April", "May", "June",
                          "July", "August", "September", "October", "November", "December"];
        
        let calendarHTML = `
            <div class="calendar-header">
                <h3>${monthNames[today.getMonth()]} ${today.getFullYear()}</h3>
                <div class="calendar-nav">
                    <button id="prevMonth"><i class="fas fa-chevron-left"></i></button>
                    <button id="nextMonth"><i class="fas fa-chevron-right"></i></button>
                </div>
            </div>
            <div class="calendar-grid">
                <div class="calendar-weekdays">
                    <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
                </div>
                <div class="calendar-days" id="calendarDays">
                    <!-- Days will be populated by JavaScript -->
                </div>
            </div>
        `;
        
        calendarEl.innerHTML = calendarHTML;
        renderCalendarDays(today);
        
        // Add event listeners for navigation
        document.getElementById('prevMonth').addEventListener('click', function() {
            const currentDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
            renderCalendarDays(currentDate);
        });
        
        document.getElementById('nextMonth').addEventListener('click', function() {
            const currentDate = new Date(today.getFullYear(), today.getMonth() + 1, 1);
            renderCalendarDays(currentDate);
        });
    }
    
    function renderCalendarDays(date) {
        const year = date.getFullYear();
        const month = date.getMonth();
        
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        
        const calendarDaysEl = document.getElementById('calendarDays');
        let daysHTML = '';
        
        // Add empty cells for days before first day of month
        for (let i = 0; i < firstDay.getDay(); i++) {
            daysHTML += '<div class="calendar-day empty"></div>';
        }
        
        // Add days of the month
        const today = new Date();
        for (let day = 1; day <= daysInMonth; day++) {
            const currentDate = new Date(year, month, day);
            const isToday = currentDate.toDateString() === today.toDateString();
            const isPast = currentDate < today;
            
            let dayClass = 'calendar-day';
            if (isToday) dayClass += ' today';
            if (isPast) dayClass += ' past';
            if (!isPast) dayClass += ' available';
            
            daysHTML += `
                <div class="${dayClass}" data-date="${currentDate.toISOString().split('T')[0]}">
                    ${day}
                    ${!isPast ? '<div class="day-dots"><span></span><span></span></div>' : ''}
                </div>
            `;
        }
        
        calendarDaysEl.innerHTML = daysHTML;
        
        // Add click event to available days
        document.querySelectorAll('.calendar-day.available').forEach(day => {
            day.addEventListener('click', function() {
                const selectedDate = this.getAttribute('data-date');
                showTimeSlots(selectedDate);
            });
        });
    }
    
    // 3. Time Slot Selection
    function showTimeSlots(date) {
        const timeSlots = [
            '09:00 AM', '10:00 AM', '11:00 AM', 
            '02:00 PM', '03:00 PM', '04:00 PM'
        ];
        
        const modalHTML = `
            <div class="modal-overlay active">
                <div class="modal">
                    <div class="modal-header">
                        <h3>Select Time Slot - ${new Date(date).toLocaleDateString()}</h3>
                        <button class="close-modal"><i class="fas fa-times"></i></button>
                    </div>
                    <div class="modal-body">
                        <div class="time-slots">
                            ${timeSlots.map(slot => `
                                <div class="time-slot" data-time="${slot}">
                                    <span>${slot}</span>
                                    <small>Available</small>
                                </div>
                            `).join('')}
                        </div>
                        <div class="booking-details" id="bookingDetails" style="display:none;">
                            <h4>Confirm Your Booking</h4>
                            <div class="form-group">
                                <label>Session Type:</label>
                                <select id="sessionType">
                                    <option value="peer-support">Peer Support Session</option>
                                    <option value="grief-counseling">Grief Counseling</option>
                                    <option value="recovery-checkin">Recovery Check-in</option>
                                    <option value="general-support">General Support</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Notes (Optional):</label>
                                <textarea id="bookingNotes" placeholder="Any specific concerns or topics you'd like to discuss..."></textarea>
                            </div>
                            <button id="confirmBooking" class="btn-primary">Confirm Booking</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Remove any existing modal
        document.querySelectorAll('.modal-overlay').forEach(el => el.remove());
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Close modal
        document.querySelector('.close-modal').addEventListener('click', function() {
            document.querySelector('.modal-overlay').remove();
        });
        
        // Time slot selection
        document.querySelectorAll('.time-slot').forEach(slot => {
            slot.addEventListener('click', function() {
                // Remove active class from all slots
                document.querySelectorAll('.time-slot').forEach(s => s.classList.remove('active'));
                // Add active class to clicked slot
                this.classList.add('active');
                // Show booking details
                document.getElementById('bookingDetails').style.display = 'block';
                
                // Set up confirm booking
                document.getElementById('confirmBooking').onclick = function() {
                    const sessionType = document.getElementById('sessionType').value;
                    const notes = document.getElementById('bookingNotes').value;
                    const time = document.querySelector('.time-slot.active').getAttribute('data-time');
                    
                    createBooking({
                        date: date,
                        time: time,
                        type: sessionType,
                        notes: notes
                    });
                };
            });
        });
    }
    
    // 4. Create Booking
    function createBooking(bookingData) {
        const user = checkAuth();
        if (!user) return;
        
        // Generate booking ID
        const bookingId = 'BK-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        
        const booking = {
            id: bookingId,
            userId: user.id,
            date: bookingData.date,
            time: bookingData.time,
            type: bookingData.type,
            notes: bookingData.notes,
            status: 'confirmed',
            createdAt: new Date().toISOString()
        };
        
        // Save to localStorage (in real app, send to server)
        let bookings = JSON.parse(localStorage.getItem('still_standing_bookings') || '[]');
        bookings.push(booking);
        localStorage.setItem('still_standing_bookings', JSON.stringify(bookings));
        
        // Close modal and show confirmation
        document.querySelector('.modal-overlay').remove();
        
        // Show success message
        showBookingNotification(`Booking confirmed! Your session is scheduled for ${bookingData.date} at ${bookingData.time}. Booking ID: ${bookingId}`, 'success');
        
        // Refresh bookings list
        loadUserBookings();
    }
    
    // 5. Load User's Bookings
    function loadUserBookings() {
        const user = checkAuth();
        if (!user) return;
        
        const bookingsList = document.getElementById('bookingsList');
        if (!bookingsList) return;
        
        let bookings = JSON.parse(localStorage.getItem('still_standing_bookings') || '[]');
        bookings = bookings.filter(b => b.userId === user.id);
        
        if (bookings.length === 0) {
            bookingsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-calendar-plus"></i>
                    <h3>No Upcoming Sessions</h3>
                    <p>Book your first support session to begin your journey.</p>
                    <button class="btn-primary" onclick="initBookingCalendar()">Book a Session</button>
                </div>
            `;
            return;
        }
        
        // Sort by date (soonest first)
        bookings.sort((a, b) => new Date(a.date) - new Date(b.date));
        
        let bookingsHTML = `
            <div class="bookings-header">
                <h3>Your Upcoming Sessions (${bookings.length})</h3>
                <button class="btn-outline" onclick="initBookingCalendar()">+ New Booking</button>
            </div>
            <div class="bookings-grid">
        `;
        
        bookings.forEach(booking => {
            const bookingDate = new Date(booking.date);
            const now = new Date();
            const isPast = bookingDate < now;
            
            bookingsHTML += `
                <div class="booking-card ${isPast ? 'past' : ''}">
                    <div class="booking-header">
                        <span class="booking-id">${booking.id}</span>
                        <span class="booking-status ${booking.status}">${booking.status}</span>
                    </div>
                    <div class="booking-details">
                        <div class="booking-date">
                            <i class="fas fa-calendar-alt"></i>
                            <span>${bookingDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                        </div>
                        <div class="booking-time">
                            <i class="fas fa-clock"></i>
                            <span>${booking.time}</span>
                        </div>
                        <div class="booking-type">
                            <i class="fas fa-hand-holding-heart"></i>
                            <span>${booking.type.replace('-', ' ').toUpperCase()}</span>
                        </div>
                        ${booking.notes ? `
                            <div class="booking-notes">
                                <i class="fas fa-sticky-note"></i>
                                <span>${booking.notes}</span>
                            </div>
                        ` : ''}
                    </div>
                    <div class="booking-actions">
                        ${!isPast ? `
                            <button class="btn-cancel" data-booking-id="${booking.id}">
                                <i class="fas fa-times"></i> Cancel
                            </button>
                            <button class="btn-reschedule" data-booking-id="${booking.id}">
                                <i class="fas fa-edit"></i> Reschedule
                            </button>
                        ` : `
                            <button class="btn-feedback" data-booking-id="${booking.id}">
                                <i class="fas fa-star"></i> Leave Feedback
                            </button>
                        `}
                    </div>
                </div>
            `;
        });
        
        bookingsHTML += '</div>';
        bookingsList.innerHTML = bookingsHTML;
        
        // Add event listeners for actions
        document.querySelectorAll('.btn-cancel').forEach(btn => {
            btn.addEventListener('click', function() {
                const bookingId = this.getAttribute('data-booking-id');
                cancelBooking(bookingId);
            });
        });
    }
    
    // 6. Cancel Booking
    function cancelBooking(bookingId) {
        if (!confirm('Are you sure you want to cancel this session?')) return;
        
        let bookings = JSON.parse(localStorage.getItem('still_standing_bookings') || '[]');
        bookings = bookings.map(booking => {
            if (booking.id === bookingId) {
                return { ...booking, status: 'cancelled' };
            }
            return booking;
        });
        
        localStorage.setItem('still_standing_bookings', JSON.stringify(bookings));
        
        showBookingNotification('Booking cancelled successfully.', 'info');
        loadUserBookings();
    }
    
    // 7. Booking Notifications
    function showBookingNotification(message, type) {
        // Reuse the showNotification function from main.js or create specific one
        if (typeof showNotification === 'function') {
            showNotification(message, type);
        } else {
            alert(message); // Fallback
        }
    }
    
    // 8. Initialize Booking System
    function initBookingSystem() {
        const user = checkAuth();
        if (!user) return;
        
        // Show welcome message
        document.getElementById('userWelcome').textContent = `Welcome back, ${user.name || 'Friend'}`;
        
        // Initialize components
        initBookingCalendar();
        loadUserBookings();
        
        // Set up logout
        document.getElementById('logoutBtn')?.addEventListener('click', function() {
            localStorage.removeItem('still_standing_user');
            window.location.href = 'index.html';
        });
    }
    
    // 9. Demo Login (For testing - remove in production)
    function setupDemoLogin() {
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', function(e) {
                e.preventDefault();
                
                const email = document.getElementById('loginEmail').value;
                const password = document.getElementById('loginPassword').value;
                
                // DEMO ONLY - In real app, validate with server
                if (email && password) {
                    const user = {
                        id: 'user_' + Date.now(),
                        email: email,
                        name: email.split('@')[0],
                        joined: new Date().toISOString()
                    };
                    
                    localStorage.setItem('still_standing_user', JSON.stringify(user));
                    window.location.href = 'booking-portal.html';
                }
            });
        }
    }
    
    // Initialize based on current page
    if (document.getElementById('bookingCalendar')) {
        initBookingSystem();
    } else if (document.getElementById('loginForm')) {
        setupDemoLogin();
    }
});