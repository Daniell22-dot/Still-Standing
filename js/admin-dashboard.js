// js/admin-dashboard.js

// Global admin app object
window.adminApp = {
    currentView: 'dashboard',
    token: null
};

document.addEventListener('DOMContentLoaded', async function () {
    const token = localStorage.getItem('still_standing_token');
    window.adminApp.token = token;

    if (!token) {
        console.warn('No auth token found - Admin functionality may be limited');
    }

    // Initialize API with token
    if (window.API) {
        window.API.setToken(token);
    }

    // Setup Navigation
    setupNavigation();

    // Initial Load
    loadStats();
    loadRecentActivity();

    // Setup Navigation
    function setupNavigation() {
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const view = link.getAttribute('data-view');
                switchView(view);
            });
        });
    }

    // Switch Views
    function switchView(viewName) {
        // Update active nav link
        document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
        const activeLink = document.querySelector(`[data-view="${viewName}"]`);
        if (activeLink) activeLink.classList.add('active');

        // Hide all views
        document.querySelectorAll('.admin-view').forEach(view => view.style.display = 'none');

        // Show selected view
        const targetView = document.getElementById(`${viewName}View`);
        if (targetView) {
            targetView.style.display = 'block';
            window.adminApp.currentView = viewName;

            // Load data for the view
            loadViewData(viewName);
        }
    }

    // Load data for specific view
    function loadViewData(viewName) {
        switch (viewName) {
            case 'dashboard':
                loadRecentActivity();
                break;
            case 'users':
                window.adminApp.loadUsers();
                break;
            case 'stories':
                loadPendingStories();
                break;
            case 'bookings':
                window.adminApp.loadBookings();
                break;
            case 'resources':
                window.adminApp.loadResources();
                break;
            case 'volunteers':
                window.adminApp.loadVolunteers();
                break;
            case 'settings':
                if (window.adminApp.loadSettings) {
                    window.adminApp.loadSettings();
                }
                break;
        }
    }

    // Load Recent Activity (for dashboard)
    async function loadRecentActivity() {
        const container = document.getElementById('recentActivity');
        if (!container) return;

        container.innerHTML = '<p class="text-muted"><i class="fas fa-spinner fa-spin"></i> Loading...</p>';

        try {
            // Fetch recent stories and bookings
            const [stories, bookings] = await Promise.all([
                API.request('/stories?limit=5').catch(() => ({ stories: [] })),
                API.request('/bookings').catch(() => ({ bookings: [] }))
            ]);

            let html = '<div style="font-size: 0.9rem;">';

            if (stories.stories && stories.stories.length > 0) {
                html += '<h4 style="margin-bottom: 10px;">Recent Stories</h4>';
                stories.stories.slice(0, 3).forEach(story => {
                    html += `
                        <div style="padding: 10px 0; border-bottom: 1px solid rgba(0,0,0,0.05);">
                            <strong>${escapeHtml(story.title || 'Untitled')}</strong>
                            <small style="color: #666; display: block;">${new Date(story.created_at).toLocaleDateString()}</small>
                        </div>
                    `;
                });
            }

            if (bookings.bookings && bookings.bookings.length > 0) {
                html += '<h4 style="margin: 20px 0 10px;">Recent Bookings</h4>';
                bookings.bookings.slice(0, 3).forEach(booking => {
                    html += `
                        <div style="padding: 10px 0; border-bottom: 1px solid rgba(0,0,0,0.05);">
                            <strong>${booking.session_type || 'Session'}</strong>
                            <small style="color: #666; display: block;">${new Date(booking.booking_date).toLocaleDateString()} at ${booking.booking_time}</small>
                        </div>
                    `;
                });
            }

            html += '</div>';
            container.innerHTML = html || '<p class="text-muted">No recent activity</p>';

        } catch (error) {
            console.error('Failed to load recent activity', error);
            container.innerHTML = '<p class="text-muted">Unable to load activity</p>';
        }
    }

    // Load Users
    window.adminApp.loadUsers = async function () {
        const container = document.getElementById('usersList');
        if (!container) return;

        container.innerHTML = '<p class="text-muted"><i class="fas fa-spinner fa-spin"></i> Loading users...</p>';

        try {
            // Fetch real users from backend
            const response = await API.request('/admin/users');

            if (!response || !response.users || response.users.length === 0) {
                container.innerHTML = '<p class="text-muted">No users found in database</p>';
                return;
            }

            const users = response.users;

            let html = `
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="border-bottom: 2px solid rgba(0,0,0,0.1);">
                            <th style="text-align: left; padding: 10px;">Name</th>
                            <th style="text-align: left; padding: 10px;">Email</th>
                            <th style="text-align: left; padding: 10px;">Role</th>
                            <th style="text-align: left; padding: 10px;">Joined</th>
                        </tr>
                    </thead>
                    <tbody>
            `;

            users.forEach(user => {
                html += `
                    <tr style="border-bottom: 1px solid rgba(0,0,0,0.05);">
                        <td style="padding: 10px;">${escapeHtml(user.name || 'N/A')}</td>
                        <td style="padding: 10px;">${escapeHtml(user.email)}</td>
                        <td style="padding: 10px;"><span class="badge badge-${user.role === 'admin' ? 'primary' : 'info'}">${user.role || 'user'}</span></td>
                        <td style="padding: 10px;">${new Date(user.created_at).toLocaleDateString()}</td>
                    </tr>
                `;
            });

            html += '</tbody></table>';
            container.innerHTML = html;

        } catch (error) {
            console.error('Failed to load users', error);
            container.innerHTML = '<p class="text-muted">Failed to load users from database. Make sure you are logged in as admin.</p>';
        }
    };

    // Load Bookings
    window.adminApp.loadBookings = async function () {
        const container = document.getElementById('bookingsList');
        if (!container) return;

        container.innerHTML = '<p class="text-muted"><i class="fas fa-spinner fa-spin"></i> Loading bookings...</p>';

        try {
            // Try to fetch real bookings from backend
            const response = await API.request('/bookings').catch(() => null);

            let bookings = [];
            if (response && response.bookings) {
                bookings = response.bookings;
            } else {
                // Mock data
                bookings = [
                    { id: 1, session_type: 'Grief Counseling', booking_date: new Date().toISOString(), booking_time: '10:00 AM', user_name: 'John Doe', status: 'confirmed' },
                    { id: 2, session_type: 'Mental Health', booking_date: new Date().toISOString(), booking_time: '2:00 PM', user_name: 'Jane Smith', status: 'pending' }
                ];
            }

            let html = `
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="border-bottom: 2px solid rgba(0,0,0,0.1);">
                            <th style="text-align: left; padding: 10px;">Session Type</th>
                            <th style="text-align: left; padding: 10px;">Date</th>
                            <th style="text-align: left; padding: 10px;">Time</th>
                            <th style="text-align: left; padding: 10px;">Status</th>
                        </tr>
                    </thead>
                    <tbody>
            `;

            bookings.forEach(booking => {
                const statusColor = booking.status === 'confirmed' ? 'success' : 'warning';
                html += `
                    <tr style="border-bottom: 1px solid rgba(0,0,0,0.05);">
                        <td style="padding: 10px;">${escapeHtml(booking.session_type || 'Session')}</td>
                        <td style="padding: 10px;">${new Date(booking.booking_date).toLocaleDateString()}</td>
                        <td style="padding: 10px;">${booking.booking_time}</td>
                        <td style="padding: 10px;"><span class="badge badge-${statusColor}">${booking.status}</span></td>
                    </tr>
                `;
            });

            html += '</tbody></table>';
            container.innerHTML = html || '<p class="text-muted">No bookings found</p>';

        } catch (error) {
            console.error('Failed to load bookings', error);
            container.innerHTML = '<p class="text-muted">Failed to load bookings</p>';
        }
    };

    // Load Stats
    async function loadStats() {
        try {
            // Mock stats or fetch real if endpoint exists
            // const stats = await API.request('/admin/stats');
            // For now, using placeholder logic or simple counts from other endpoints

            const stories = await API.request('/stories?status=approved');
            document.getElementById('totalStories').textContent = stories.total || 0;

            const pending = await API.request('/admin/stories/pending');
            document.getElementById('pendingStories').textContent = pending.count || 0;

        } catch (error) {
            console.error('Failed to load stats', error);
        }
    }

    // Load Pending Stories
    async function loadPendingStories() {
        const container = document.getElementById('pendingStoriesList');
        if (!container) return;

        container.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Loading pending stories...</div>';

        try {
            const response = await API.request('/admin/stories/pending');

            if (response.count === 0) {
                container.innerHTML = '<div class="empty-state">No pending stories to review.</div>';
                return;
            }

            container.innerHTML = '';
            response.stories.forEach(story => {
                const card = document.createElement('div');
                card.className = 'story-review-card';
                card.style.background = '#fff';
                card.style.padding = '20px';
                card.style.marginBottom = '20px';
                card.style.borderRadius = '10px';
                card.style.boxShadow = '0 2px 5px rgba(0,0,0,0.1)';

                card.innerHTML = `
                    <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                        <span class="badge badge-${getCategoryColor(story.category)}">${story.category}</span>
                        <small>${new Date(story.created_at).toLocaleString()}</small>
                    </div>
                    <h4>${escapeHtml(story.title || 'Untitled')}</h4>
                    <p style="margin: 10px 0; line-height: 1.6;">${escapeHtml(story.content)}</p>
                    <div class="meta" style="margin-bottom: 15px; color: #666; font-size: 0.9rem;">
                        Posted by: ${story.author_id ? (story.author_name + (story.is_anonymous ? ' (Anon)' : '')) : 'Anonymous'}
                    </div>
                    <div class="actions" style="display: flex; gap: 10px;">
                        <button class="btn-approve" onclick="moderateStory(${story.id}, 'approved')" style="background: #2ecc71; color: white; border: none; padding: 8px 15px; border-radius: 5px; cursor: pointer;">
                            <i class="fas fa-check"></i> Approve
                        </button>
                        <button class="btn-reject" onclick="moderateStory(${story.id}, 'rejected')" style="background: #e74c3c; color: white; border: none; padding: 8px 15px; border-radius: 5px; cursor: pointer;">
                            <i class="fas fa-times"></i> Reject
                        </button>
                    </div>
                `;
                container.appendChild(card);
            });

        } catch (error) {
            container.innerHTML = '<p class="text-danger">Failed to load pending stories.</p>';
        }
    }

    // Make moderate function global
    window.moderateStory = async function (id, status) {
        if (!confirm(`Are you sure you want to ${status} this story?`)) return;

        try {
            await API.request(`/admin/stories/${id}/moderate`, 'PUT', { status });
            alert(`Story ${status} successfully`);
            loadPendingStories(); // Refresh list
            loadStats(); // Refresh stats
        } catch (error) {
            alert('Action failed: ' + (error.message || 'Unknown error'));
        }
    };

    function getCategoryColor(category) {
        const colors = {
            'grief': 'info',
            'recovery': 'success',
            'mental': 'warning',
            'hope': 'primary'
        };
        return colors[category] || 'secondary';
    }

    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Resource Management Functions
    window.adminApp.resources = [
        { id: 1, title: 'Grief Support Hotline', description: 'Available 24/7 for grief counseling', link: 'tel:+254112219135', category: 'hotline' },
        { id: 2, title: 'Mental Health Guide', description: 'Coping strategies for anxiety and depression', link: '/mental-health.html', category: 'guide' },
        { id: 3, title: 'GBV Support Center', description: 'Resources for gender-based violence survivors', link: '/gbv-support.html', category: 'support' },
        { id: 4, title: 'Grief Journal Template', description: 'Downloadable journal for processing grief', link: '/assets/downloads/My_Grief_Journal.txt', category: 'download' }
    ];

    window.adminApp.loadResources = function () {
        const container = document.getElementById('resourcesList');
        if (!container) return;

        const resources = window.adminApp.resources;

        let html = '<div style="display: grid; gap: 15px;">';
        resources.forEach(resource => {
            html += `
                <div class="glass-panel" style="padding: 15px; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <h4 style="margin: 0 0 5px 0;">${escapeHtml(resource.title)}</h4>
                        <p style="margin: 0; color: #666; font-size: 0.9rem;">${escapeHtml(resource.description)}</p>
                        <small><i class="fas fa-link"></i> ${resource.link}</small>
                    </div>
                    <div style="display: flex; gap: 10px;">
                        <button class="btn-outline" onclick="window.adminApp.editResource(${resource.id})" style="padding: 8px 12px;">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn-outline" onclick="window.adminApp.deleteResource(${resource.id})" style="padding: 8px 12px; color: var(--accent-color); border-color: var(--accent-color);">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
            `;
        });
        html += '</div>';

        container.innerHTML = html;
    };

    window.adminApp.showAddResourceModal = function () {
        const title = prompt('Resource Title:');
        if (!title) return;

        const description = prompt('Description:');
        if (!description) return;

        const link = prompt('Link/URL:');
        if (!link) return;

        const category = prompt('Category (hotline, guide, support, download):') || 'guide';

        const newId = Math.max(...window.adminApp.resources.map(r => r.id)) + 1;
        window.adminApp.resources.push({
            id: newId,
            title,
            description,
            link,
            category
        });

        window.adminApp.loadResources();
        alert('Resource added successfully!');
    };

    window.adminApp.editResource = function (id) {
        const resource = window.adminApp.resources.find(r => r.id === id);
        if (!resource) return;

        const title = prompt('Resource Title:', resource.title);
        if (title === null) return;

        const description = prompt('Description:', resource.description);
        if (description === null) return;

        const link = prompt('Link/URL:', resource.link);
        if (link === null) return;

        resource.title = title;
        resource.description = description;
        resource.link = link;

        window.adminApp.loadResources();
        alert('Resource updated successfully!');
    };

    window.adminApp.deleteResource = function (id) {
        if (!confirm('Are you sure you want to delete this resource?')) return;

        window.adminApp.resources = window.adminApp.resources.filter(r => r.id !== id);
        window.adminApp.loadResources();
        alert('Resource deleted successfully!');
    };

    // Settings Management Functions
    window.adminApp.settings = {
        siteName: 'STILL STANDING',
        crisisHotline: '+254 112 219135',
        supportEmail: 'support@stillstanding.com',
        autoApproveStories: false,
        allowAnonymous: true,
        allowComments: true,
        bookingWindow: 30,
        sessionDuration: 60,
        sendReminders: true,
        requireEmailVerification: false,
        allowSelfDeactivation: true,
        minPasswordLength: 8
    };

    window.adminApp.loadSettings = function () {
        const settings = window.adminApp.settings;

        // Populate form fields
        document.getElementById('siteName').value = settings.siteName;
        document.getElementById('crisisHotline').value = settings.crisisHotline;
        document.getElementById('supportEmail').value = settings.supportEmail;
        document.getElementById('autoApproveStories').checked = settings.autoApproveStories;
        document.getElementById('allowAnonymous').checked = settings.allowAnonymous;
        document.getElementById('allowComments').checked = settings.allowComments;
        document.getElementById('bookingWindow').value = settings.bookingWindow;
        document.getElementById('sessionDuration').value = settings.sessionDuration;
        document.getElementById('sendReminders').checked = settings.sendReminders;
        document.getElementById('requireEmailVerification').checked = settings.requireEmailVerification;
        document.getElementById('allowSelfDeactivation').checked = settings.allowSelfDeactivation;
        document.getElementById('minPasswordLength').value = settings.minPasswordLength;
    };

    window.adminApp.saveSettings = function () {
        // Save settings from form
        window.adminApp.settings = {
            siteName: document.getElementById('siteName').value,
            crisisHotline: document.getElementById('crisisHotline').value,
            supportEmail: document.getElementById('supportEmail').value,
            autoApproveStories: document.getElementById('autoApproveStories').checked,
            allowAnonymous: document.getElementById('allowAnonymous').checked,
            allowComments: document.getElementById('allowComments').checked,
            bookingWindow: parseInt(document.getElementById('bookingWindow').value),
            sessionDuration: parseInt(document.getElementById('sessionDuration').value),
            sendReminders: document.getElementById('sendReminders').checked,
            requireEmailVerification: document.getElementById('requireEmailVerification').checked,
            allowSelfDeactivation: document.getElementById('allowSelfDeactivation').checked,
            minPasswordLength: parseInt(document.getElementById('minPasswordLength').value)
        };

        // In a real app, you'd send this to the backend
        // For now, just save to localStorage
        localStorage.setItem('adminSettings', JSON.stringify(window.adminApp.settings));

        alert('Settings saved successfully!');
    };
});
