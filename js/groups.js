// Support Groups JavaScript
let currentFilter = '';
let userGroups = [];

// Load all groups
async function loadGroups(topic = '') {
    const grid = document.getElementById('groupsGrid');
    if (!grid) return;

    grid.innerHTML = '<div class="glass-panel" style="padding: 40px; text-align: center;"><i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: var(--primary-color);"></i><p>Loading groups...</p></div>';

    try {
        const endpoint = topic ? `/groups?topic=${topic}` : '/groups';
        const data = await API.request(endpoint);

        if (data.success && data.groups.length > 0) {
            grid.innerHTML = data.groups.map(group => `
                <div class="group-card" onclick="viewGroup(${group.id})">
                    <span class="group-topic topic-${group.topic}">${formatTopic(group.topic)}</span>
                    <h3>${group.name}</h3>
                    <p style="color: var(--gray-color); margin: 10px 0;">${group.description || 'No description'}</p>
                    <div class="group-stats">
                        <div class="group-stat">
                            <i class="fas fa-users"></i>
                            <span>${group.actual_member_count} members</span>
                        </div>
                        <div class="group-stat">
                            <i class="fas fa-user"></i>
                            <span>${group.creator_name}</span>
                        </div>
                    </div>
                </div>
            `).join('');
        } else {
            grid.innerHTML = '<div class="glass-panel" style="padding: 40px; text-align: center;"><p>No groups found. Be the first to create one!</p></div>';
        }
    } catch (error) {
        console.error('Load groups error:', error);
        grid.innerHTML = '<div class="glass-panel" style="padding: 40px; text-align: center; color: var(--accent-color);"><p>Error loading groups</p></div>';
    }
}

function filterGroups(topic) {
    currentFilter = topic;

    // Update active tab
    document.querySelectorAll('.filter-tab').forEach(tab => tab.classList.remove('active'));
    event.target.classList.add('active');

    loadGroups(topic);
}

function formatTopic(topic) {
    return topic.charAt(0).toUpperCase() + topic.slice(1);
}

async function viewGroup(groupId) {
    try {
        const data = await API.request(`/groups/${groupId}`);

        if (data.success) {
            showGroupModal(data.group);
        }
    } catch (error) {
        console.error('View group error:', error);
        alert('Error loading group details');
    }
}

function showGroupModal(group) {
    // Check if user is member
    const token = localStorage.getItem('still_standing_token');
    const isMember = false; // Check against userGroups

    const modal = document.createElement('div');
    modal.className = 'group-detail-modal';
    modal.innerHTML = `
        <div class="group-detail-content">
            <div style="padding: 30px;">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 20px;">
                    <div>
                        <span class="group-topic topic-${group.topic}">${formatTopic(group.topic)}</span>
                        <h2 style="margin: 10px 0;">${group.name}</h2>
                        <p style="color: var(--gray-color);">${group.description || 'No description'}</p>
                    </div>
                    <button onclick="this.closest('.group-detail-modal').remove()" style="background: none; border: none; font-size: 1.5rem; cursor: pointer;">&times;</button>
                </div>

                <div class="group-stats" style="margin-bottom: 30px;">
                    <div class="group-stat">
                        <i class="fas fa-users"></i>
                        <span>${group.members.length} members</span>
                    </div>
                    <div class="group-stat">
                        <i class="fas fa-calendar"></i>
                        <span>Created ${new Date(group.created_at).toLocaleDateString()}</span>
                    </div>
                </div>

                ${!isMember ? `
                    <button class="btn-primary" onclick="joinGroup(${group.id})" style="width: 100%; margin-bottom: 20px;">
                        <i class="fas fa-user-plus"></i> Join Group
                    </button>
                ` : `
                    <div id="groupPosts-${group.id}" style="margin-top: 20px;">
                        <h3>Discussion</h3>
                        <div class="loading">Loading posts...</div>
                    </div>
                    <button class="btn-outline" onclick="showNewPostForm(${group.id})">
                        <i class="fas fa-plus"></i> New Post
                    </button>
                `}
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    if (isMember) {
        loadGroupPosts(group.id);
    }
}

async function joinGroup(groupId) {
    const token = localStorage.getItem('still_standing_token');
    if (!token) {
        alert('Please log in to join groups');
        return;
    }

    try {
        const data = await API.request(`/groups/${groupId}/join`, 'POST');
        if (data.success) {
            alert('Successfully joined group!');
            document.querySelector('.group-detail-modal').remove();
            loadGroups(currentFilter);
        } else {
            alert(data.error);
        }
    } catch (error) {
        console.error('Join group error:', error);
        alert('Error joining group');
    }
}

function showCreateGroupModal() {
    const token = localStorage.getItem('still_standing_token');
    if (!token) {
        alert('Please log in to create a group');
        return;
    }

    const modal = document.createElement('div');
    modal.className = 'group-detail-modal';
    modal.innerHTML = `
        <div class="group-detail-content" style="max-width: 600px;">
            <div style="padding: 30px;">
                <h2 style="margin-bottom: 20px;">Create Support Group</h2>
                <form id="createGroupForm" onsubmit="handleCreateGroup(event)">
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; margin-bottom: 5px; font-weight: 600;">Group Name</label>
                        <input type="text" id="groupName" required style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
                    </div>
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; margin-bottom: 5px; font-weight: 600;">Topic</label>
                        <select id="groupTopic" required style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
                            <option value="">Select topic...</option>
                            <option value="grief">Grief & Loss</option>
                            <option value="addiction">Addiction Recovery</option>
                            <option value="ptsd">PTSD</option>
                            <option value="anxiety">Anxiety</option>
                            <option value="depression">Depression</option>
                            <option value="parenting">Parenting</option>
                            <option value="relationships">Relationships</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; margin-bottom: 5px; font-weight: 600;">Description</label>
                        <textarea id="groupDescription" rows="4" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;"></textarea>
                    </div>
                    <div style="display: flex; gap: 10px;">
                        <button type="submit" class="btn-primary" style="flex: 1;">Create Group</button>
                        <button type="button" class="btn-outline" onclick="this.closest('.group-detail-modal').remove()">Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
}

async function handleCreateGroup(e) {
    e.preventDefault();

    const name = document.getElementById('groupName').value;
    const topic = document.getElementById('groupTopic').value;
    const description = document.getElementById('groupDescription').value;
    const token = localStorage.getItem('still_standing_token');

    try {
        const data = await API.request('/groups', 'POST', { name, topic, description });
        if (data.success) {
            alert('Group created successfully!');
            document.querySelector('.group-detail-modal').remove();
            loadGroups();
        } else {
            alert(data.error);
        }
    } catch (error) {
        console.error('Create group error:', error);
        alert('Error creating group');
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadGroups();
});
