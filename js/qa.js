// Q&A JavaScript
let currentQAFilter = '';

// Load all questions
async function loadQuestions(status = '') {
    const list = document.getElementById('questionsList');
    if (!list) return;

    list.innerHTML = '<div class="glass-panel" style="padding: 40px; text-align: center;"><i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: var(--primary-color);"></i><p>Loading questions...</p></div>';

    try {
        const url = status ?
            `http://localhost:5000/api/v1/qa/questions?status=${status}` :
            'http://localhost:5000/api/v1/qa/questions';

        const response = await fetch(url);
        const data = await response.json();

        if (data.success && data.questions.length > 0) {
            list.innerHTML = data.questions.map(q => `
                <div class="question-card" onclick="viewQuestion(${q.id})">
                    <div class="question-header">
                        <div style="flex: 1;">
                            <h3 style="margin-bottom: 10px;">${q.question}</h3>
                            <div class="question-stats">
                                <div class="stat-item">
                                    <i class="fas fa-user"></i>
                                    <span>${q.author_name || 'Anonymous'}</span>
                                </div>
                                <div class="stat-item">
                                    <i class="fas fa-comments"></i>
                                    <span>${q.answer_count} answers</span>
                                </div>
                                <div class="stat-item">
                                    <i class="fas fa-eye"></i>
                                    <span>${q.views} views</span>
                                </div>
                                <div class="stat-item">
                                    <i class="fas fa-arrow-up"></i>
                                    <span>${q.upvotes}</span>
                                </div>
                            </div>
                        </div>
                        <span class="status-badge status-${q.status}">${q.status}</span>
                    </div>
                </div>
            `).join('');
        } else {
            list.innerHTML = '<div class="glass-panel" style="padding: 40px; text-align: center;"><p>No questions found. Be the first to ask!</p></div>';
        }
    } catch (error) {
        console.error('Load questions error:', error);
        list.innerHTML = '<div class="glass-panel" style="padding: 40px; text-align: center; color: var(--accent-color);"><p>Error loading questions</p></div>';
    }
}

function filterQuestions(status) {
    currentQAFilter = status;

    // Update active tab
    document.querySelectorAll('.filter-tab').forEach(tab => tab.classList.remove('active'));
    event.target.classList.add('active');

    loadQuestions(status);
}

async function viewQuestion(questionId) {
    try {
        const response = await fetch(`http://localhost:5000/api/qa/questions/${questionId}`);
        const data = await response.json();

        if (data.success) {
            showQuestionModal(data.question);
        }
    } catch (error) {
        console.error('View question error:', error);
        alert('Error loading question');
    }
}

function showQuestionModal(question) {
    const modal = document.createElement('div');
    modal.className = 'group-detail-modal';
    modal.innerHTML = `
        <div class="group-detail-content" style="max-width: 900px;">
            <div style="padding: 30px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
                    <h2 style="flex: 1; margin-right: 20px;">${question.question}</h2>
                    <button onclick="this.closest('.group-detail-modal').remove()" style="background: none; border: none; font-size: 1.5rem; cursor: pointer;">&times;</button>
                </div>

                <div class="question-stats" style="margin-bottom: 30px;">
                    <div class="stat-item">
                        <i class="fas fa-user"></i>
                        <span>${question.author_name || 'Anonymous'}</span>
                    </div>
                    <div class="stat-item">
                        <i class="fas fa-eye"></i>
                        <span>${question.views} views</span>
                    </div>
                    <div class="stat-item">
                        <i class="fas fa-calendar"></i>
                        <span>${new Date(question.created_at).toLocaleDateString()}</span>
                    </div>
                    <button class="upvote-btn ${question.user_upvoted ? 'active' : ''}" onclick="toggleUpvote('question', ${question.id}, event)">
                        <i class="fas fa-arrow-up"></i>
                        <span>${question.upvotes}</span>
                    </button>
                </div>

                <h3 style="margin: 30px 0 20px;">Answers (${question.answers.length})</h3>
                
                ${question.answers.length > 0 ? question.answers.map(answer => `
                    <div class="answer-card ${answer.is_accepted ? 'accepted-answer' : ''}">
                        ${answer.is_accepted ? '<div style="margin-bottom: 10px;"><i class="fas fa-check-circle" style="color: var(--healing-color);"></i> <strong>Accepted Answer</strong></div>' : ''}
                        <div class="answer-header">
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <strong>${answer.author_name || 'Anonymous'}</strong>
                                ${answer.is_expert ? '<span class="expert-badge">Expert</span>' : ''}
                            </div>
                            <button class="upvote-btn" onclick="toggleUpvote('answer', ${answer.id}, event)">
                                <i class="fas fa-arrow-up"></i>
                                <span>${answer.upvotes}</span>
                            </button>
                        </div>
                        <p style="margin: 15px 0; white-space: pre-line;">${answer.answer}</p>
                        <small style="color: var(--gray-color);">${new Date(answer.created_at).toLocaleString()}</small>
                    </div>
                `).join('') : '<p style="color: var(--gray-color); text-align: center; padding: 20px;">No answers yet. Be the first to help!</p>'}

                <button class="btn-primary" onclick="showAnswerForm(${question.id})" style="width: 100%; margin-top: 20px;">
                    <i class="fas fa-plus"></i> Add Answer
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
}

function showAskQuestionModal() {
    const token = localStorage.getItem('still_standing_token');
    if (!token) {
        alert('Please log in to ask a question');
        return;
    }

    const modal = document.createElement('div');
    modal.className = 'group-detail-modal';
    modal.innerHTML = `
        <div class="group-detail-content" style="max-width: 600px;">
            <div style="padding: 30px;">
                <h2 style="margin-bottom: 20px;">Ask a Question</h2>
                <form id="askQuestionForm" onsubmit="handleAskQuestion(event)">
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; margin-bottom: 5px; font-weight: 600;">Your Question</label>
                        <textarea id="questionText" rows="5" required placeholder="What would you like to know?" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;"></textarea>
                    </div>
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; margin-bottom: 5px; font-weight: 600;">Category (optional)</label>
                        <input type="text" id="questionCategory" placeholder="e.g., anxiety, relationships" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
                    </div>
                    <div style="margin-bottom: 20px;">
                        <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
                            <input type="checkbox" id="isAnonymous" checked>
                            <span>Ask anonymously</span>
                        </label>
                    </div>
                    <div style="display: flex; gap: 10px;">
                        <button type="submit" class="btn-primary" style="flex: 1;">Submit Question</button>
                        <button type="button" class="btn-outline" onclick="this.closest('.group-detail-modal').remove()">Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
}

async function handleAskQuestion(e) {
    e.preventDefault();

    const question = document.getElementById('questionText').value;
    const category = document.getElementById('questionCategory').value;
    const isAnonymous = document.getElementById('isAnonymous').checked;
    const token = localStorage.getItem('still_standing_token');

    try {
        const response = await fetch('http://localhost:5000/api/qa/questions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ question, category, isAnonymous })
        });

        const data = await response.json();
        if (data.success) {
            alert('Question submitted successfully!');
            document.querySelector('.group-detail-modal').remove();
            loadQuestions();
        } else {
            alert(data.error);
        }
    } catch (error) {
        console.error('Ask question error:', error);
        alert('Error submitting question');
    }
}

function showAnswerForm(questionId) {
    const token = localStorage.getItem('still_standing_token');
    if (!token) {
        alert('Please log in to answer questions');
        return;
    }

    const modal = document.createElement('div');
    modal.className = 'group-detail-modal';
    modal.innerHTML = `
        <div class="group-detail-content" style="max-width: 600px;">
            <div style="padding: 30px;">
                <h2 style="margin-bottom: 20px;">Your Answer</h2>
                <form id="answerForm" onsubmit="handleSubmitAnswer(event, ${questionId})">
                    <div style="margin-bottom: 20px;">
                        <textarea id="answerText" rows="8" required placeholder="Share your answer..." style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;"></textarea>
                    </div>
                    <div style="display: flex; gap: 10px;">
                        <button type="submit" class="btn-primary" style="flex: 1;">Submit Answer</button>
                        <button type="button" class="btn-outline" onclick="this.closest('.group-detail-modal').remove()">Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
}

async function handleSubmitAnswer(e, questionId) {
    e.preventDefault();

    const answer = document.getElementById('answerText').value;
    const token = localStorage.getItem('still_standing_token');

    try {
        const response = await fetch(`http://localhost:5000/api/qa/questions/${questionId}/answers`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ answer })
        });

        const data = await response.json();
        if (data.success) {
            alert('Answer submitted successfully!');
            document.querySelectorAll('.group-detail-modal').forEach(m => m.remove());
            viewQuestion(questionId);
        } else {
            alert(data.error);
        }
    } catch (error) {
        console.error('Submit answer error:', error);
        alert('Error submitting answer');
    }
}

async function toggleUpvote(targetType, targetId, event) {
    event.stopPropagation();

    const token = localStorage.getItem('still_standing_token');
    if (!token) {
        alert('Please log in to upvote');
        return;
    }

    try {
        const response = await fetch('http://localhost:5000/api/qa/upvote', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ targetType, targetId })
        });

        const data = await response.json();
        if (data.success) {
            // Reload the question to show updated counts
            const questionId = targetType === 'question' ? targetId : null;
            if (questionId) {
                viewQuestion(questionId);
            } else {
                loadQuestions(currentQAFilter);
            }
        }
    } catch (error) {
        console.error('Toggle upvote error:', error);
        alert('Error toggling upvote');
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadQuestions();
});
