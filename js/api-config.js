// js/api-config.js
const API_CONFIG = {
    BASE_URL: '/api',
    ENDPOINTS: {
        AUTH: {
            LOGIN: '/auth/login',
            REGISTER: '/auth/register',
            ME: '/auth/me',
            UPDATE: '/auth/update'
        },
        BOOKINGS: {
            CREATE: '/bookings',
            MY_BOOKINGS: '/bookings/my-bookings',
            AVAILABILITY: '/bookings/availability',
            COUNSELOR_SCHEDULE: '/bookings/counselor/schedule'
        },
        USERS: {
            PROGRESS: '/users/progress',
            DASHBOARD: '/users/dashboard',
            SETTINGS: '/users/settings'
        },
        STORIES: {
            CREATE: '/stories',
            LIST: '/stories',
            MY_STORIES: '/stories/my-stories'
        }
    }
};

// API Utility Functions
class APIService {
    constructor() {
        this.token = localStorage.getItem('still_standing_token');
        this.baseURL = API_CONFIG.BASE_URL;
    }

    setToken(token) {
        this.token = token;
        localStorage.setItem('still_standing_token', token);
    }

    getHeaders() {
        const headers = {
            'Content-Type': 'application/json'
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        return headers;
    }

    async request(endpoint, method = 'GET', data = null) {
        const url = `${this.baseURL}${endpoint}`;
        const options = {
            method,
            headers: this.getHeaders()
        };

        if (data) {
            options.body = JSON.stringify(data);
        }

        try {
            const response = await fetch(url, options);
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'API request failed');
            }

            return result;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    // Auth methods
    async login(email, password) {
        const result = await this.request(API_CONFIG.ENDPOINTS.AUTH.LOGIN, 'POST', { email, password });
        if (result.token) {
            this.setToken(result.token);
        }
        return result;
    }

    async register(userData) {
        const result = await this.request(API_CONFIG.ENDPOINTS.AUTH.REGISTER, 'POST', userData);
        if (result.token) {
            this.setToken(result.token);
        }
        return result;
    }

    async getCurrentUser() {
        return await this.request(API_CONFIG.ENDPOINTS.AUTH.ME);
    }

    // Booking methods
    async createBooking(bookingData) {
        return await this.request(API_CONFIG.ENDPOINTS.BOOKINGS.CREATE, 'POST', bookingData);
    }

    async getMyBookings() {
        return await this.request(API_CONFIG.ENDPOINTS.BOOKINGS.MY_BOOKINGS);
    }

    async getAvailability(date, counselorId = null) {
        let endpoint = `${API_CONFIG.ENDPOINTS.BOOKINGS.AVAILABILITY}/${date}`;
        if (counselorId) {
            endpoint += `?counselor_id=${counselorId}`;
        }
        return await this.request(endpoint);
    }

    // User progress methods
    async updateProgress(progressData) {
        return await this.request(API_CONFIG.ENDPOINTS.USERS.PROGRESS, 'POST', progressData);
    }

    async getDashboardStats() {
        return await this.request(API_CONFIG.ENDPOINTS.USERS.DASHBOARD);
    }

    // Story methods
    async createStory(storyData) {
        return await this.request(API_CONFIG.ENDPOINTS.STORIES.CREATE, 'POST', storyData);
    }

    async getStories(filters = {}) {
        const query = new URLSearchParams(filters).toString();
        const endpoint = `${API_CONFIG.ENDPOINTS.STORIES.LIST}${query ? `?${query}` : ''}`;
        return await this.request(endpoint);
    }
}

// Create global API instance
window.API = new APIService();