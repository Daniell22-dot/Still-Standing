# 🎗️ STILL STANDING

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D%2016.x-brightgreen.svg)](https://nodejs.org/)
[![NPM Version](https://img.shields.io/badge/npm-%3E%3D%208.x-blue.svg)](https://www.npmjs.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Stability: Stable](https://img.shields.io/badge/Stability-Stable-success.svg)]()

**STILL STANDING** is a comprehensive mental health and recovery platform designed to provide support, resources, and community for individuals overcoming addiction, grief, and mental health challenges. Our mission is to ensure that no one has to walk their journey alone.

---

## 🚀 Features

-   **🏥 Support Directory**: A searchable database of counseling centers, rehabs, and shelters.
*   **🗓️ Events Calendar**: Dynamic scheduling for workshops, webinars, and peer support meetings.
*   **📖 Healing Blog**: Curated articles and stories on recovery and resilience.
*   **🤝 Community Hub**: A safe space for users to share stories and interact via our QA system.
*   **💾 Resource Downloads**: PDF guides and worksheets for self-paced healing.
*   **🆘 Crisis Toolkit**: Immediate access to hotlines and a personalized safety plan builder.
*   **🫂 Virtual Hug**: A real-time support widget for immediate comfort.

---

## 🛠️ Tech Stack

### Frontend
-   **Structure**: Semantic HTML5
-   **Styling**: Vanilla CSS3 (Glassmorphism & Modern UI)
-   **Logic**: JavaScript (ES6+)
-   **Integrations**: FontAwesome, Google Fonts

### Backend
-   **Runtime**: [Node.js](https://nodejs.org/)
-   **Framework**: [Express.js](https://expressjs.com/)
-   **Database**: MySQL (via `mysql2`)
-   **Security**: JWT, Helmet, XSS-Clean, Rate Limiting, BcryptJS

---

## 📦 Getting Started

### Prerequisites
-   [Node.js](https://nodejs.org/) (v16+)
-   [NPM](https://www.npmjs.com/) (v8+)
-   [MySQL](https://www.mysql.com/) database

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/Daniell22-dot/Still-Standing.git
    cd Still-Standing
    ```

2.  **Setup Backend**
    ```bash
    cd backend
    npm install
    ```

3.  **Configure Environment Variables**
    Create a `.env` file in the `backend` directory:
    ```env
    PORT=5000
    DB_HOST=localhost
    DB_USER=your_user
    DB_PASS=your_password
    DB_NAME=still_standing
    JWT_SECRET=your_jwt_secret
    ```

4.  **Run the application**
    ```bash
    # Development mode
    npm run dev

    # Production mode
    npm start
    ```

---

## 📂 Project Structure

```text
├── backend/            # Express.js Server & Logic
│   ├── config/         # Database & App config
│   ├── controllers/    # API Request Handlers
│   ├── middleware/     # Security & Auth middleware
│   ├── routes/         # API Endpoint Definitions
│   └── server.js       # Entry Point
├── css/                # Global Stylesheets
├── js/                 # Centralized API Service & UI Logic
├── assets/             # Images & Media
└── *.html              # Frontend Pages
```

---

## 🛡️ Security
We take security seriously. The backend includes:
-   **XSS Protection**: Sanitization of user input.
-   **Rate Limiting**: Protection against brute force and DDoS.
-   **JWT Auth**: Secure state-less authentication.
-   **Helmet**: Hardening HTTP headers.

---

## 🤝 Contributing
Contributions are what make the community such an amazing place to learn, inspire, and create.
1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License
Distributed under the MIT License. See `LICENSE` for more information.

**STILL STANDING** - *You are not alone.* 🎗️
