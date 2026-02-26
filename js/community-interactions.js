// js/community-interactions.js

document.addEventListener('DOMContentLoaded', function () {
    const storiesGrid = document.getElementById('storiesGrid');
    const loadMoreBtn = document.getElementById('loadMoreStories');
    const storyForm = document.getElementById('storyForm');

    let currentPage = 1;
    let currentCategory = 'all';
    let isLoading = false;

    // Initialize
    loadStories();

    // Event Listeners
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', () => {
            currentPage++;
            loadStories(true);
        });
    }

    // Category Filters
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            // Update active state
            filterBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            // Update filter
            currentCategory = this.getAttribute('data-filter');
            currentPage = 1;
            loadStories(false);
        });
    });

    // Story Form Submission
    if (storyForm) {
        storyForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            if (!API.token) {
                alert('Please log in to share your story.');
                window.location.href = 'booking-portal.html'; // Redirect to login
                return;
            }

            const submitBtn = this.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sharing...';
            submitBtn.disabled = true;

            try {
                const categoryBtn = document.querySelector('.category-btn.active');
                const category = categoryBtn ? categoryBtn.getAttribute('data-category') : 'general';

                const storyData = {
                    content: document.getElementById('storyText').value,
                    title: document.getElementById('storyTitle').value,
                    category: category,
                    is_anonymous: document.getElementById('shareAnonymously').checked,
                    allow_comments: document.getElementById('allowComments').checked
                };

                const result = await API.createStory(storyData);

                // Show success message
                alert('Thank you for sharing your story. It has been submitted for review and will appear once approved.');
                storyForm.reset();

            } catch (error) {
                console.error('Error sharing story:', error);
                alert(error.message || 'Failed to share story. Please try again.');
            } finally {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        });
    }

    // Category Selection in Form
    const categoryBtns = document.querySelectorAll('.category-btn');
    categoryBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            categoryBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // Load Stories Function
    async function loadStories(append = false) {
        if (isLoading) return;
        isLoading = true;

        if (!append) {
            storiesGrid.innerHTML = '<div class="loading-spinner" style="grid-column: 1/-1; text-align: center;"><i class="fas fa-spinner fa-spin fa-2x"></i></div>';
        } else {
            loadMoreBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
        }

        try {
            const params = {
                page: currentPage,
                limit: 6
            };

            if (currentCategory !== 'all') {
                params.category = currentCategory;
            }

            const result = await API.getStories(params);

            if (!append) {
                storiesGrid.innerHTML = '';
            }

            if (result.stories.length === 0 && !append) {
                storiesGrid.innerHTML = `
                    <div class="no-stories" style="grid-column: 1/-1; text-align: center; padding: 40px;">
                        <i class="far fa-file-alt fa-3x" style="color: #ccc; margin-bottom: 20px;"></i>
                        <h3>No stories found yet</h3>
                        <p>Be the first to share your journey in this category.</p>
                    </div>
                `;
            } else {
                result.stories.forEach(story => {
                    const storyCard = createStoryCard(story);
                    storiesGrid.appendChild(storyCard);
                });
            }

            // Handle Load More button visibility
            if (result.currentPage >= result.totalPages) {
                if (loadMoreBtn) loadMoreBtn.style.display = 'none';
            } else {
                if (loadMoreBtn) {
                    loadMoreBtn.style.display = 'block';
                    loadMoreBtn.innerHTML = '<i class="fas fa-plus"></i> Load More Stories';
                }
            }

        } catch (error) {
            console.error('Error loading stories:', error);
            if (!append) {
                storiesGrid.innerHTML = `
                    <div class="error-state" style="grid-column: 1/-1; text-align: center; color: #e74c3c;">
                        <p>Failed to load stories. Please try again later.</p>
                        <button class="btn-outline" onclick="location.reload()">Retry</button>
                    </div>
                `;
            }
        } finally {
            isLoading = false;
        }
    }

    // Create Story Card HTML
    function createStoryCard(story) {
        const div = document.createElement('div');
        div.className = 'story-card animate-fade-in';
        div.setAttribute('data-category', story.category);

        const date = new Date(story.created_at).toLocaleDateString(undefined, {
            year: 'numeric', month: 'short', day: 'numeric'
        });

        // Category Colors
        const categoryColors = {
            'grief': 'category-grief',
            'recovery': 'category-recovery',
            'mental-health': 'category-mental', // Adjusted to match CSS expectation if needed, or mapping
            'mental': 'category-mental',
            'hope': 'category-hope',
            'general': 'category-hope'
        };
        const categoryClass = categoryColors[story.category] || 'category-hope';
        const categoryLabel = story.category === 'mental' ? 'Mental Health' :
            story.category.charAt(0).toUpperCase() + story.category.slice(1);

        div.innerHTML = `
            <div class="story-header">
                <span class="story-category ${categoryClass}">${categoryLabel}</span>
                ${story.title ? `<h3>${escapeHtml(story.title)}</h3>` : ''}
                <div class="story-meta">
                    <span class="story-author">${escapeHtml(story.author_name)}</span>
                    <span class="story-date">${date}</span>
                </div>
            </div>
            <div class="story-content">
                <p>${escapeHtml(story.content).substring(0, 200)}${story.content.length > 200 ? '...' : ''}</p>
                ${story.content.length > 200 ? `<a href="#" class="read-more" data-id="${story.id}">Read full story</a>` : ''}
            </div>
            <div class="story-footer">
                <div class="story-actions">
                    <button class="story-action-btn like-btn" data-id="${story.id}">
                        <i class="far fa-heart"></i> <span>${story.likes || 0}</span>
                    </button>
                    <button class="story-action-btn comment-btn" data-id="${story.id}">
                        <i class="far fa-comment"></i> <span>${story.comment_count || 0}</span>
                    </button>
                    <button class="story-action-btn support-btn" onclick="window.location.href='booking-portal.html'">
                        <i class="fas fa-hands-helping"></i> Support
                    </button>
                </div>
            </div>
            <div class="comments-section" id="comments-${story.id}" style="display: none; padding: 20px; border-top: 1px solid #eee; background: #fafafa;">
                <div class="comments-list"></div>
                ${API.token ? `
                    <form class="comment-form" data-id="${story.id}" style="margin-top: 15px;">
                        <input type="text" placeholder="Write a supportive comment..." required style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px; margin-bottom: 10px;">
                        <button type="submit" class="btn-sm btn-primary">Post</button>
                    </form>
                ` : '<p><a href="booking-portal.html">Log in</a> to comment</p>'}
            </div>
        `;

        // Interaction Event Listeners for this card
        const likeBtn = div.querySelector('.like-btn');
        likeBtn.addEventListener('click', async function () {
            if (!API.token) return window.location.href = 'booking-portal.html';

            try {
                // Optimistic update
                const span = this.querySelector('span');
                const icon = this.querySelector('i');
                let count = parseInt(span.textContent);

                // Assuming we can't track 'liked' state perfectly without DB user_likes table, 
                // we'll just allow liking and incrementing for now (as per controller logic)
                // In a full app, we'd check if user already liked.

                span.textContent = count + 1;
                icon.className = 'fas fa-heart';
                icon.style.color = '#e74c3c';
                this.classList.add('liked');

                await API.request(`/stories/${this.getAttribute('data-id')}/like`, 'POST');
            } catch (error) {
                console.error('Like failed', error);
                // Revert if failed
                span.textContent = count;
            }
        });

        const commentBtn = div.querySelector('.comment-btn');
        commentBtn.addEventListener('click', function () {
            const commentsSection = div.querySelector(`#comments-${this.getAttribute('data-id')}`);
            if (commentsSection.style.display === 'none') {
                commentsSection.style.display = 'block';
                loadComments(this.getAttribute('data-id'), commentsSection.querySelector('.comments-list'));
            } else {
                commentsSection.style.display = 'none';
            }
        });

        const commentForm = div.querySelector('.comment-form');
        if (commentForm) {
            commentForm.addEventListener('submit', async function (e) {
                e.preventDefault();
                const input = this.querySelector('input');
                const storyId = this.getAttribute('data-id');

                try {
                    const result = await API.request(`/stories/${storyId}/comment`, 'POST', { content: input.value });

                    // Add new comment to list
                    const list = div.querySelector('.comments-list');
                    const commentEl = document.createElement('div');
                    commentEl.className = 'comment-item animate-fade-in';
                    commentEl.innerHTML = `
                        <p><strong>${escapeHtml(result.comment.author_name)}</strong>: ${escapeHtml(result.comment.content)}</p>
                        <small class="text-muted">Just now</small>
                    `;
                    list.prepend(commentEl);
                    input.value = '';

                    // Update count
                    const commentCountSpan = commentBtn.querySelector('span');
                    commentCountSpan.textContent = parseInt(commentCountSpan.textContent) + 1;

                } catch (error) {
                    alert('Failed to post comment');
                }
            });
        }

        return div;
    }

    async function loadComments(storyId, container) {
        container.innerHTML = '<p>Loading comments...</p>';
        try {
            const response = await API.request(`/stories/${storyId}/comments`);
            container.innerHTML = '';

            if (response.comments.length === 0) {
                container.innerHTML = '<p class="text-muted">No comments yet. Be the first to support.</p>';
                return;
            }

            response.comments.forEach(comment => {
                const el = document.createElement('div');
                el.className = 'comment-item';
                el.style.marginBottom = '10px';
                el.innerHTML = `
                    <p style="margin-bottom: 2px;"><strong>${escapeHtml(comment.author_name)}</strong>: ${escapeHtml(comment.content)}</p>
                    <small style="color: #999;">${new Date(comment.created_at).toLocaleDateString()}</small>
                `;
                container.appendChild(el);
            });
        } catch (error) {
            container.innerHTML = '<p class="text-danger">Failed to load comments.</p>';
        }
    }

    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
});
