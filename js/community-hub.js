// Community Hub JavaScript - Tab Switching and Integration
let currentTab = 'stories';

// Switch between tabs
function switchTab(tabName) {
    currentTab = tabName;

    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    document.getElementById(`${tabName}Tab`).classList.add('active');

    // Update FAB buttons based on active tab
    updateFABs(tabName);

    // Load content if needed
    if (tabName === 'groups' && !window.groupsLoaded) {
        loadGroups();
        window.groupsLoaded = true;
    } else if (tabName === 'qa' && !window.qaLoaded) {
        loadQuestions();
        window.qaLoaded = true;
    }

    // Update URL hash without reload
    window.location.hash = tabName;
}

// Update floating action buttons based on tab
function updateFABs(tabName) {
    const fabContainer = document.querySelector('.fab-container');
    if (!fabContainer) return;

    if (tabName === 'stories') {
        fabContainer.innerHTML = `
            <button class="fab-btn" onclick="showShareStoryModal()" title="Share Your Story">
                <i class="fas fa-pen"></i>
            </button>
        `;
    } else if (tabName === 'groups') {
        fabContainer.innerHTML = `
            <button class="fab-btn" onclick="showCreateGroupModal()" title="Create Group">
                <i class="fas fa-plus"></i>
            </button>
        `;
    } else if (tabName === 'qa') {
        fabContainer.innerHTML = `
            <button class="fab-btn" onclick="showAskQuestionModal()" title="Ask Question">
                <i class="fas fa-question"></i>
            </button>
        `;
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    // Check for hash in URL
    const hash = window.location.hash.substring(1);
    if (hash && ['stories', 'groups', 'qa'].includes(hash)) {
        // Find and click the corresponding tab button
        const tabButtons = document.querySelectorAll('.tab-btn');
        tabButtons.forEach((btn, index) => {
            const tabNames = ['stories', 'groups', 'qa'];
            if (tabNames[index] === hash) {
                btn.click();
            }
        });
    }

    // Initialize FABs for stories tab
    updateFABs('stories');
});

// Handle browser back/forward
window.addEventListener('hashchange', () => {
    const hash = window.location.hash.substring(1);
    if (hash && ['stories', 'groups', 'qa'].includes(hash)) {
        currentTab = hash;
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        document.getElementById(`${hash}Tab`).classList.add('active');
        updateFABs(hash);
    }
});
