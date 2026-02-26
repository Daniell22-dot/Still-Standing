// Story Reactions Component
class StoryReactions {
    constructor(storyId, containerId) {
        this.storyId = storyId;
        this.container = document.getElementById(containerId);
        this.reactions = {
            love: 0,
            support: 0,
            strength: 0,
            gratitude: 0
        };
        this.userReaction = null;
        this.init();
    }

    async init() {
        await this.loadReactions();
        this.render();
    }

    async loadReactions() {
        try {
            const response = await fetch(`http://localhost:5000/api/v1/reactions/story/${this.storyId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('still_standing_token')}`
                }
            });

            const data = await response.json();
            if (data.success) {
                this.reactions = data.reactions;
                this.userReaction = data.userReaction;
            }
        } catch (error) {
            console.error('Load reactions error:', error);
        }
    }

    render() {
        if (!this.container) return;

        const reactionConfig = {
            love: { emoji: '❤️', label: 'Love' },
            support: { emoji: '🤗', label: 'Support' },
            strength: { emoji: '💪', label: 'Strength' },
            gratitude: { emoji: '🙏', label: 'Gratitude' }
        };

        this.container.innerHTML = `
            <div class="story-reactions">
                ${Object.keys(reactionConfig).map(type => `
                    <button 
                        class="reaction-btn ${this.userReaction === type ? 'active' : ''}"
                        data-type="${type}"
                        onclick="window.storyReactions['${this.storyId}'].toggleReaction('${type}')"
                        title="${reactionConfig[type].label}"
                    >
                        <span class="reaction-emoji">${reactionConfig[type].emoji}</span>
                        <span class="reaction-count">${this.reactions[type] || 0}</span>
                    </button>
                `).join('')}
            </div>
        `;
    }

    async toggleReaction(type) {
        const token = localStorage.getItem('still_standing_token');
        if (!token) {
            alert('Please log in to react to stories');
            return;
        }

        try {
            const response = await fetch(`http://localhost:5000/api/v1/reactions/story/${this.storyId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ reactionType: type })
            });

            const data = await response.json();
            if (data.success) {
                // Update local state
                if (data.action === 'removed') {
                    this.reactions[type]--;
                    this.userReaction = null;
                } else if (data.action === 'added') {
                    this.reactions[type]++;
                    this.userReaction = type;
                } else if (data.action === 'updated') {
                    // Remove from old reaction
                    if (this.userReaction) {
                        this.reactions[this.userReaction]--;
                    }
                    // Add to new reaction
                    this.reactions[type]++;
                    this.userReaction = type;
                }
                this.render();
            }
        } catch (error) {
            console.error('Toggle reaction error:', error);
            alert('Error updating reaction. Please try again.');
        }
    }
}

// Global registry for story reactions
window.storyReactions = {};

// Initialize reactions for all stories on page
function initializeStoryReactions() {
    document.querySelectorAll('[data-story-id]').forEach(element => {
        const storyId = element.getAttribute('data-story-id');
        const containerId = `reactions-${storyId}`;

        // Create container if it doesn't exist
        if (!document.getElementById(containerId)) {
            const reactionsDiv = document.createElement('div');
            reactionsDiv.id = containerId;
            element.appendChild(reactionsDiv);
        }

        window.storyReactions[storyId] = new StoryReactions(storyId, containerId);
    });
}

// Social Share Component
class SocialShare {
    constructor(config) {
        this.url = config.url || window.location.href;
        this.title = config.title || document.title;
        this.text = config.text || '';
        this.hashtags = config.hashtags || ['MentalHealth', 'StillStanding'];
    }

    shareToFacebook() {
        const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(this.url)}`;
        this.openShareWindow(shareUrl);
    }

    shareToTwitter() {
        const text = `${this.text}\n\n${this.hashtags.map(tag => `#${tag}`).join(' ')}`;
        const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(this.url)}`;
        this.openShareWindow(shareUrl);
    }

    shareToWhatsApp() {
        const text = `${this.title}\n${this.text}\n${this.url}`;
        const shareUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
        this.openShareWindow(shareUrl);
    }

    shareToLinkedIn() {
        const shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(this.url)}`;
        this.openShareWindow(shareUrl);
    }

    async copyLink() {
        try {
            await navigator.clipboard.writeText(this.url);
            this.showToast('Link copied to clipboard!');
        } catch (error) {
            // Fallback for older browsers
            const input = document.createElement('input');
            input.value = this.url;
            document.body.appendChild(input);
            input.select();
            document.execCommand('copy');
            document.body.removeChild(input);
            this.showToast('Link copied to clipboard!');
        }
    }

    openShareWindow(url) {
        window.open(url, 'share', 'width=600,height=400,scrollbars=yes,resizable=yes');
    }

    showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'share-toast';
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            bottom: 30px;
            left: 50%;
            transform: translateX(-50%);
            background: #333;
            color: white;
            padding: 15px 25px;
            border-radius: 8px;
            font-size: 0.9rem;
            z-index: 9999;
            animation: fadeInOut 2s ease;
        `;

        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 2000);
    }

    renderButtons(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `
            <div class="social-share-buttons">
                <button onclick="this.shareInstance.shareToFacebook()" class="share-btn facebook" title="Share on Facebook">
                    <i class="fab fa-facebook"></i>
                </button>
                <button onclick="this.shareInstance.shareToTwitter()" class="share-btn twitter" title="Share on Twitter">
                    <i class="fab fa-twitter"></i>
                </button>
                <button onclick="this.shareInstance.shareToWhatsApp()" class="share-btn whatsapp" title="Share on WhatsApp">
                    <i class="fab fa-whatsapp"></i>
                </button>
                <button onclick="this.shareInstance.shareToLinkedIn()" class="share-btn linkedin" title="Share on LinkedIn">
                    <i class="fab fa-linkedin"></i>
                </button>
                <button onclick="this.shareInstance.copyLink()" class="share-btn copy" title="Copy Link">
                    <i class="fas fa-link"></i>
                </button>
            </div>
        `;

        // Attach instance to container for button access
        container.querySelector('.social-share-buttons').shareInstance = this;
    }
}

// CSS for reactions and social share
const styles = `
    .story-reactions {
        display: flex;
        gap: 10px;
        margin: 15px 0;
        flex-wrap: wrap;
    }

    .reaction-btn {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 8px 14px;
        border: 2px solid #e0e0e0;
        border-radius: 20px;
        background: white;
        cursor: pointer;
        transition: all 0.3s ease;
        font-family: inherit;
    }

    .reaction-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        border-color: var(--primary-color);
    }

    .reaction-btn.active {
        background: var(--primary-color);
        border-color: var(--primary-color);
        color: white;
    }

    .reaction-btn.active .reaction-emoji {
        transform: scale(1.2);
    }

    .reaction-emoji {
        font-size: 1.2rem;
        transition: transform 0.3s ease;
    }

    .reaction-count {
        font-size: 0.9rem;
        font-weight: 600;
        min-width: 20px;
        text-align: center;
    }

    .social-share-buttons {
        display: flex;
        gap: 10px;
        margin: 15px 0;
        flex-wrap: wrap;
    }

    .share-btn {
        width: 44px;
        height: 44px;
        border-radius: 50%;
        border: none;
        cursor: pointer;
        color: white;
        font-size: 1.2rem;
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .share-btn:hover {
        transform: translateY(-3px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    }

    .share-btn.facebook {
        background: #1877f2;
    }

    .share-btn.twitter {
        background: #1da1f2;
    }

    .share-btn.whatsapp {
        background: #25d366;
    }

    .share-btn.linkedin {
        background: #0a66c2;
    }

    .share-btn.copy {
        background: #6c757d;
    }

    @keyframes fadeInOut {
        0%, 100% { opacity: 0; }
        10%, 90% { opacity: 1; }
    }

    :root[data-theme="dark"] .reaction-btn {
        background: var(--dark-surface);
        border-color: var(--dark-border);
        color: var(--dark-text);
    }

    :root[data-theme="dark"] .reaction-btn:hover {
        border-color: var(--dark-primary);
    }

    :root[data-theme="dark"] .reaction-btn.active {
        background: var(--dark-primary);
    }
`;

// Inject styles
const styleSheet = document.createElement('style');
styleSheet.textContent = styles;
document.head.appendChild(styleSheet);

// Export for use
window.SocialShare = SocialShare;
window.initializeStoryReactions = initializeStoryReactions;
