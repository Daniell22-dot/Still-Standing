// Volunteer Management Functions - Add to admin-dashboard.js

// Load Volunteers
window.adminApp.loadVolunteers = async function (status = '') {
    const tbody = document.getElementById('volunteersTableBody');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="7" class="text-center"><i class="fas fa-spinner fa-spin"></i> Loading...</td></tr>';

    try {
        const token = localStorage.getItem('still_standing_token');
        const API_BASE_URL = 'http://localhost:5000/api/v1';
        const url = status ?
            `${API_BASE_URL}/volunteers/admin/all?status=${status}` :
            `${API_BASE_URL}/volunteers/admin/all`;

        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (data.success && data.volunteers.length > 0) {
            tbody.innerHTML = data.volunteers.map(vol => `
                <tr>
                    <td><strong>${vol.full_name}</strong></td>
                    <td>${vol.email}</td>
                    <td>
                        ${vol.roles.map(r => `<span style="background: rgba(102, 126, 234, 0.1); padding: 3px 8px; border-radius: 3px; font-size: 0.85rem; margin-right: 5px;">${formatRole(r)}</span>`).join('')}
                    </td>
                    <td>${vol.hours_per_week}</td>
                    <td>${getStatusBadge(vol.status)}</td>
                    <td>${new Date(vol.created_at).toLocaleDateString()}</td>
                    <td>
                        <button class="action-btn" onclick="window.adminApp.viewVolunteerDetails(${vol.id})" title="View Details">
                            <i class="fas fa-eye"></i>
                        </button>
                        ${vol.status === 'pending' ? `
                            <button class="action-btn" onclick="window.adminApp.approveVolunteer(${vol.id})" title="Approve" style="color: var(--healing-color);">
                                <i class="fas fa-check"></i>
                            </button>
                            <button class="action-btn" onclick="window.adminApp.rejectVolunteer(${vol.id})" title="Reject" style="color: var(--accent-color);">
                                <i class="fas fa-times"></i>
                            </button>
                        ` : ''}
                    </td>
                </tr>
            `).join('');
        } else {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center">No volunteer applications found</td></tr>';
        }
    } catch (error) {
        console.error('Load volunteers error:', error);
        tbody.innerHTML = '<tr><td colspan="7" class="text-center" style="color: var(--accent-color);">Error loading volunteers</td></tr>';
    }
};

function formatRole(role) {
    const roleMap = {
        'peer_support': 'Peer Support',
        'crisis_chat': 'Crisis Chat',
        'content_moderator': 'Moderator',
        'facilitator': 'Facilitator',
        'technical': 'Technical',
        'content_creator': 'Content Creator'
    };
    return roleMap[role] || role;
}

function getStatusBadge(status) {
    const badges = {
        'pending': '<span style="background: #ffc107; color: white; padding: 4px 12px; border-radius: 12px; font-size: 0.85rem;">Pending</span>',
        'approved': '<span style="background: var(--healing-color); color: white; padding: 4px 12px; border-radius: 12px; font-size: 0.85rem;">Approved</span>',
        'training': '<span style="background: var(--secondary-color); color: white; padding: 4px 12px; border-radius: 12px; font-size: 0.85rem;">Training</span>',
        'rejected': '<span style="background: var(--accent-color); color: white; padding: 4px 12px; border-radius: 12px; font-size: 0.85rem;">Rejected</span>'
    };
    return badges[status] || status;
}

window.adminApp.viewVolunteerDetails = function (id) {
    fetch(`http://localhost:5000/api/volunteers/admin/all`, {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('still_standing_token')}`
        }
    })
        .then(res => res.json())
        .then(data => {
            const volunteer = data.volunteers.find(v => v.id === id);
            if (volunteer) {
                showVolunteerModal(volunteer);
            }
        });
};

function showVolunteerModal(vol) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 700px;">
            <div class="modal-header">
                <h3><i class="fas fa-user"></i> ${vol.full_name}</h3>
                <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">&times;</button>
            </div>
            <div class="modal-body" style="max-height: 70vh; overflow-y: auto;">
                <div style="display: grid; gap: 20px;">
                    <div>
                        <h4 style="margin-bottom: 10px; color: var(--primary-color);">Contact Information</h4>
                        <p><strong>Email:</strong> ${vol.email}</p>
                        <p><strong>Phone:</strong> ${vol.phone}</p>
                        <p><strong>Location:</strong> ${vol.location}</p>
                        ${vol.age ? `<p><strong>Age:</strong> ${vol.age}</p>` : ''}
                    </div>
                    
                    <div>
                        <h4 style="margin-bottom: 10px; color: var(--primary-color);">Volunteer Interests</h4>
                        <p><strong>Roles:</strong> ${vol.roles.map(formatRole).join(', ')}</p>
                        <p><strong>Hours/Week:</strong> ${vol.hours_per_week}</p>
                        <p><strong>Available Days:</strong> ${vol.available_days.join(', ')}</p>
                    </div>
                    
                    ${vol.experience ? `
                    <div>
                        <h4 style="margin-bottom: 10px; color: var(--primary-color);">Experience</h4>
                        <p style="white-space: pre-line;">${vol.experience}</p>
                    </div>
                    ` : ''}
                    
                    <div>
                        <h4 style="margin-bottom: 10px; color: var(--primary-color);">Motivation</h4>
                        <p style="white-space: pre-line;">${vol.motivation}</p>
                    </div>
                    
                    ${vol.skills ? `
                    <div>
                        <h4 style="margin-bottom: 10px; color: var(--primary-color);">Skills</h4>
                        <p>${vol.skills}</p>
                    </div>
                    ` : ''}
                    
                    <div>
                        <h4 style="margin-bottom: 10px; color: var(--primary-color);">Status</h4>
                        <p><strong>Application Status:</strong> ${getStatusBadge(vol.status)}</p>
                        <p><strong>Background Check:</strong> ${vol.background_check_status}</p>
                        <p><strong>Training Completed:</strong> ${vol.training_completed ? 'Yes' : 'No'}</p>
                        <p><strong>Applied:</strong> ${new Date(vol.created_at).toLocaleString()}</p>
                    </div>
                </div>
            </div>
            <div class="modal-footer" style="display: flex; gap: 10px; justify-content: flex-end;">
                ${vol.status === 'pending' ? `
                    <button class="btn-primary" onclick="window.adminApp.approveVolunteer(${vol.id}); this.closest('.modal-overlay').remove();">
                        <i class="fas fa-check"></i> Approve
                    </button>
                    <button class="btn-outline" onclick="window.adminApp.rejectVolunteer(${vol.id}); this.closest('.modal-overlay').remove();">
                        <i class="fas fa-times"></i> Reject
                    </button>
                ` : ''}
                <button class="btn-outline" onclick="this.closest('.modal-overlay').remove();">Close</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

window.adminApp.approveVolunteer = async function (id) {
    if (!confirm('Approve this volunteer application?')) return;

    try {
        const token = localStorage.getItem('still_standing_token');
        const response = await fetch(`http://localhost:5000/api/volunteers/admin/${id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: 'approved' })
        });

        const data = await response.json();
        if (data.success) {
            alert('Volunteer approved successfully!');
            window.adminApp.loadVolunteers();
        } else {
            alert('Error: ' + data.error);
        }
    } catch (error) {
        console.error('Approve volunteer error:', error);
        alert('Error approving volunteer');
    }
};

window.adminApp.rejectVolunteer = async function (id) {
    const reason = prompt('Please provide a reason for rejection (optional):');
    if (reason === null) return;

    try {
        const token = localStorage.getItem('still_standing_token');
        const response = await fetch(`http://localhost:5000/api/volunteers/admin/${id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                status: 'rejected',
                adminNotes: reason || 'Rejected'
            })
        });

        const data = await response.json();
        if (data.success) {
            alert('Volunteer application rejected');
            window.adminApp.loadVolunteers();
        } else {
            alert('Error: ' + data.error);
        }
    } catch (error) {
        console.error('Reject volunteer error:', error);
        alert('Error rejecting volunteer');
    }
};

// Add filter event listener
document.addEventListener('DOMContentLoaded', function () {
    const volunteerFilter = document.getElementById('volunteerFilter');
    if (volunteerFilter) {
        volunteerFilter.addEventListener('change', function () {
            window.adminApp.loadVolunteers(this.value);
        });
    }
});
