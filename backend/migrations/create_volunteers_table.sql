-- Create volunteers table
CREATE TABLE IF NOT EXISTS volunteers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(50) NOT NULL,
    age INT,
    location VARCHAR(255) NOT NULL,
    roles JSON NOT NULL,
    experience TEXT,
    motivation TEXT NOT NULL,
    skills VARCHAR(500),
    hours_per_week VARCHAR(50) NOT NULL,
    available_days JSON,
    references JSON,
    status ENUM('pending', 'approved', 'rejected', 'training') DEFAULT 'pending',
    admin_notes TEXT,
    background_check_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    training_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP NULL,
    reviewed_by INT NULL,
    INDEX idx_status (status),
    INDEX idx_email (email),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE
    SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;