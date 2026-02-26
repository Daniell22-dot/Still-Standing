// js/booking-calendar.js

document.addEventListener('DOMContentLoaded', function () {
    const calendarGrid = document.getElementById('calendarGrid');
    const currentMonthDisplay = document.getElementById('currentMonth');
    const prevMonthBtn = document.getElementById('prevMonth');
    const nextMonthBtn = document.getElementById('nextMonth');
    const timeSlotsContainer = document.getElementById('timeSlotsContainer');
    const availableSlotsSection = document.getElementById('availableSlots');
    const bookingForm = document.getElementById('bookingForm');

    let currentDate = new Date();
    let selectedDate = null;
    let selectedTime = null;
    let selectedCounselor = null;

    // Initialize
    renderCalendar(currentDate);

    // Event Listeners
    if (prevMonthBtn) {
        prevMonthBtn.addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() - 1);
            renderCalendar(currentDate);
        });
    }

    if (nextMonthBtn) {
        nextMonthBtn.addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() + 1);
            renderCalendar(currentDate);
        });
    }

    // Function to render calendar
    function renderCalendar(date) {
        if (!calendarGrid || !currentMonthDisplay) return;

        const year = date.getFullYear();
        const month = date.getMonth();

        // Update header
        const monthNames = ["January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ];
        currentMonthDisplay.textContent = `${monthNames[month]} ${year}`;

        // Clear grid
        calendarGrid.innerHTML = '';

        // Add day headers
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        dayNames.forEach(day => {
            const dayHeader = document.createElement('div');
            dayHeader.className = 'calendar-day-header';
            dayHeader.textContent = day;
            calendarGrid.appendChild(dayHeader);
        });

        // Get first day of month and days in month
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        // Today's date for comparison
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Blank spaces for days before first day
        for (let i = 0; i < firstDay; i++) {
            const blank = document.createElement('div');
            blank.className = 'calendar-day blank';
            calendarGrid.appendChild(blank);
        }

        // Days
        for (let i = 1; i <= daysInMonth; i++) {
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day';
            dayElement.textContent = i;

            const checkDate = new Date(year, month, i);

            // Disable past dates
            if (checkDate < today) {
                dayElement.classList.add('disabled');
            } else {
                dayElement.addEventListener('click', () => selectDate(checkDate, dayElement));
            }

            // Highlight selected
            if (selectedDate && checkDate.toDateString() === selectedDate.toDateString()) {
                dayElement.classList.add('selected');
            }

            calendarGrid.appendChild(dayElement);
        }
    }

    // Handle Date Selection
    async function selectDate(date, element) {
        // Update UI
        document.querySelectorAll('.calendar-day').forEach(el => el.classList.remove('selected'));
        element.classList.add('selected');
        selectedDate = date;
        selectedTime = null; // Reset time

        // Show Slots Section
        if (availableSlotsSection) {
            availableSlotsSection.style.display = 'block';
            timeSlotsContainer.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Loading slots...</div>';

            // Smooth scroll to slots
            availableSlotsSection.scrollIntoView({ behavior: 'smooth' });
        }

        // Fetch Availability
        try {
            const dateStr = date.toISOString().split('T')[0];
            let url = `/bookings/availability/${dateStr}`;
            if (selectedCounselor) {
                url += `?counselor_id=${selectedCounselor}`;
            }

            // Use window.api.request
            const response = await window.api.request(url);
            renderTimeSlots(response.availableSlots || []); // Handle potential undefined slots

        } catch (error) {
            console.error('Failed to fetch availability', error);
            // Mock data if API fails (for demonstration)
            // renderTimeSlots([{time: '10:00', display: '10:00 AM'}, {time: '14:00', display: '02:00 PM'}]);
            timeSlotsContainer.innerHTML = '<p class="text-danger">Failed to load available slots. Please try again.</p>';
        }
    }

    // Render Time Slots
    function renderTimeSlots(slots) {
        timeSlotsContainer.innerHTML = '';

        if (!slots || slots.length === 0) {
            timeSlotsContainer.innerHTML = '<p class="text-muted">No slots available for this date.</p>';
            return;
        }

        const grid = document.createElement('div');
        grid.className = 'time-slots-grid';
        grid.style.display = 'grid';
        grid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(100px, 1fr))';
        grid.style.gap = '10px';
        grid.style.marginTop = '15px';

        slots.forEach(slot => {
            const btn = document.createElement('button');
            btn.className = 'time-slot-btn';
            btn.textContent = slot.display;
            btn.setAttribute('data-time', slot.time);
            btn.style.padding = '10px';
            btn.style.border = '1px solid #ddd';
            btn.style.borderRadius = '5px';
            btn.style.background = 'white';
            btn.style.cursor = 'pointer';

            btn.addEventListener('click', function () {
                document.querySelectorAll('.time-slot-btn').forEach(b => {
                    b.style.background = 'white';
                    b.style.color = 'inherit';
                    b.style.borderColor = '#ddd';
                });
                this.style.background = 'var(--primary-color)';
                this.style.color = 'white';
                this.style.borderColor = 'var(--primary-color)';
                selectedTime = slot.time;

                // Show booking form or confirm button
                updateBookingSummary();
            });

            grid.appendChild(btn);
        });

        timeSlotsContainer.appendChild(grid);
    }

    function updateBookingSummary() {
        const summaryDiv = document.getElementById('bookingSummary');
        const confirmationSection = document.getElementById('bookingConfirmation');

        if (selectedDate && selectedTime) {
            if (confirmationSection) {
                confirmationSection.style.display = 'block';
                confirmationSection.scrollIntoView({ behavior: 'smooth' });
            }

            const dateSpan = document.getElementById('summaryDate');
            if (dateSpan) dateSpan.textContent = selectedDate.toDateString();

            const timeSpan = document.getElementById('summaryTime');
            if (timeSpan) timeSpan.textContent = selectedTime;
        }
    }

    // Confirm Booking
    const bookingFormEl = document.getElementById('bookingForm');
    if (bookingFormEl) {
        bookingFormEl.addEventListener('submit', async function (e) {
            e.preventDefault();

            // Check login using window.api.getToken()
            if (!window.api.getToken()) {
                alert('Please log in to book a session');
                return;
            }

            if (!selectedDate || !selectedTime) {
                alert('Please select a date and time');
                return;
            }

            const submitBtn = this.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Booking...';
            submitBtn.disabled = true;

            try {
                const bookingData = {
                    booking_date: selectedDate.toISOString().split('T')[0],
                    booking_time: selectedTime,
                    session_type: document.getElementById('sessionType')?.value || 'one-on-one',
                    notes: document.getElementById('bookingNotes')?.value
                };

                await window.api.createBooking(bookingData);

                // Success
                alert('Booking confirmed! You will receive an email confirmation.');
                window.location.reload();

            } catch (error) {
                console.error(error);
                alert(error.message || 'Booking failed');
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        });
    }
});
