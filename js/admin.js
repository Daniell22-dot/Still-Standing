const API_URL = 'http://localhost:5000/api/v1/admin';
const token = localStorage.getItem('token'); // Get token from login

// Initialize Dashboard
async function initDashboard() {
    if (!token) window.location.href = 'login.html';

    fetchStats();
}

async function fetchStats() {
    try {
        const response = await fetch(`${API_URL}/stats`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await response.json();
        if (result.success) {
            document.getElementById('stat-users').innerText = result.data.users;
            document.getElementById('stat-pending').innerText = result.data.pendingAction;
        }
    } catch (err) { console.error("Error loading stats", err); }
}

function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.admin-section').forEach(s => s.style.display = 'none');
    // Show selected
    document.getElementById(sectionId).style.display = 'block';

    // Update Title
    document.getElementById('section-title').innerText = sectionId.charAt(0).toUpperCase() + sectionId.slice(1);

    if (sectionId === 'users') fetchUsers();
}

async function fetchUsers() {
    const response = await fetch(`${API_URL}/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    const tbody = document.getElementById('users-tbody');
    tbody.innerHTML = data.users.map(user => `
        <tr>
            <td>${user.name}</td>
            <td>${user.email}</td>
            <td>${user.role}</td>
            <td><span class="status-pill ${user.status}">${user.status}</span></td>
            <td><button onclick="editUser(${user.id})">Edit</button></td>
        </tr>
    `).join('');
}

initDashboard();