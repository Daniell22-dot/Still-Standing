/**
 * Progress Tracker Logic for STILL STANDING
 * Handles stats, charts, and daily updates
 */

document.addEventListener('DOMContentLoaded', () => {
    // Only run if we are on a page with progress elements
    if (!document.getElementById('recoveryDays')) return;

    loadProgressData();
    setupEventListeners();
    renderCharts();
});

// Default Data
const defaultStats = {
    recoveryDays: 0,
    moodHistory: [], // { date: 'YYYY-MM-DD', score: 1-5 }
    selfCareHistory: [], // { date: 'YYYY-MM-DD', score: 0-100 }
    sessionsAttended: 0
};

function getStats() {
    const stored = localStorage.getItem('still_standing_stats');
    return stored ? JSON.parse(stored) : defaultStats;
}

function saveStats(stats) {
    localStorage.setItem('still_standing_stats', JSON.stringify(stats));
    updateUI(stats);
}

function loadProgressData() {
    const stats = getStats();
    updateUI(stats);
}

function updateUI(stats) {
    // Update simple metrics
    const recoveryDaysEl = document.getElementById('recoveryDays');
    if (recoveryDaysEl) recoveryDaysEl.textContent = stats.recoveryDays;

    // Calculate Mood Average (Last 7 entries)
    const moodAvgEl = document.getElementById('moodAverage');
    if (moodAvgEl) {
        const recentMoods = stats.moodHistory.slice(-7);
        if (recentMoods.length > 0) {
            const sum = recentMoods.reduce((a, b) => a + b.score, 0);
            const avg = (sum / recentMoods.length).toFixed(1);
            let moodLabel = 'Neutral';
            if (avg >= 4) moodLabel = 'Excellent';
            else if (avg >= 3) moodLabel = 'Good';
            else if (avg >= 2) moodLabel = 'Okay';
            else moodLabel = 'Struggling';

            moodAvgEl.innerHTML = `${avg} <span style="font-size: 0.8rem; color: #666;">(${moodLabel})</span>`;
        } else {
            moodAvgEl.textContent = '-';
        }
    }

    // Update charts if they exist
    renderCharts(stats);
}

function setupEventListeners() {
    // Add Recovery Day Button
    const addDayBtn = document.getElementById('addRecoveryDay');
    if (addDayBtn) {
        addDayBtn.addEventListener('click', () => {
            const stats = getStats();
            stats.recoveryDays++;
            saveStats(stats);

            // Animation effect
            const valEl = document.getElementById('recoveryDays');
            valEl.style.transform = 'scale(1.2)';
            setTimeout(() => valEl.style.transform = 'scale(1)', 200);
        });
    }

    // Daily Check-in Button (if not already handled by main.js)
    // We'll listen for a custom event or shared handler if needed
    // For now, let's assume main.js opens the modal, and we handle the "save" here if strictly separated
    // But typically main.js or a dedicated script handles the modal. 
}

// Simple Chart Rendering using CSS Gradients/Divs
function renderCharts(stats = getStats()) {
    renderMoodChart(stats.moodHistory);
    renderSessionChart(stats.sessionsAttended);
}

function renderMoodChart(history) {
    const container = document.getElementById('moodChart');
    if (!container) return;

    // Mock data if empty
    const data = history.length > 0 ? history.slice(-7) : [
        { date: 'Mon', score: 3 },
        { date: 'Tue', score: 4 },
        { date: 'Wed', score: 2 },
        { date: 'Thu', score: 5 },
        { date: 'Fri', score: 4 },
        { date: 'Sat', score: 3 },
        { date: 'Sun', score: 4 }
    ];

    let html = '<div style="display: flex; align-items: flex-end; height: 150px; justify-content: space-between; gap: 5px;">';

    data.forEach(day => {
        const height = (day.score / 5) * 100;
        const color = height > 60 ? '#2ecc71' : (height > 40 ? '#f1c40f' : '#e74c3c');

        html += `
            <div style="display: flex; flex-direction: column; align-items: center; flex: 1;">
                <div style="width: 80%; background: ${color}; height: ${height}%; border-radius: 5px 5px 0 0; transition: height 1s ease;"></div>
                <span style="font-size: 0.7rem; margin-top: 5px;">${day.date.substring ? day.date.substring(0, 3) : (new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' }))}</span>
            </div>
        `;
    });

    html += '</div>';
    container.innerHTML = html;
}

function renderSessionChart(count) {
    const container = document.getElementById('sessionChart');
    if (!container) return;

    // Placeholder visualization
    container.innerHTML = `
        <div style="text-align: center; padding: 20px;">
            <div style="font-size: 3rem; font-weight: bold; color: var(--secondary-color);">${count}</div>
            <p>Total Sessions Completed</p>
            <div style="width: 100%; background: #eee; height: 10px; border-radius: 5px; margin-top: 10px; overflow: hidden;">
                <div style="width: ${Math.min(count * 10, 100)}%; background: var(--secondary-color); height: 100%;"></div>
            </div>
            <small>${10 - (count % 10)} more to next milestone</small>
        </div>
    `;
}

// Expose update function for other scripts
window.progressTracker = {
    addMoodEntry: (score) => {
        const stats = getStats();
        const today = new Date().toISOString().split('T')[0];
        stats.moodHistory.push({ date: today, score: parseInt(score) });
        saveStats(stats);
    },
    incrementSessions: () => {
        const stats = getStats();
        stats.sessionsAttended++;
        saveStats(stats);
    }
};
