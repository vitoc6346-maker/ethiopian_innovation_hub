CREATE DATABASE IF NOT EXISTS ethiopian_innovation;
USE ethiopian_innovation;

-- 1. Departments Table
CREATE TABLE departments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    department_name VARCHAR(100) NOT NULL UNIQUE
);

-- Seed initial departments
INSERT INTO departments (department_name) VALUES 
('Maintenance & Engineering'),
('Flight Operations'),
('Commercial & Passenger Services'),
('Information Technology (IT)'),
('Ground Services');

-- 2. Users Table
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    department_id INT,
    role ENUM('Employee', 'Evaluator', 'Admin') DEFAULT 'Employee',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(id)
);

-- 3. Submissions Table (Ideas & Creations with SHA-256 Hash)
CREATE TABLE submissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    department_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    file_path VARCHAR(255),
    file_hash CHAR(64) NOT NULL, -- SHA-256 cryptographic proof fingerprint
    status ENUM('Submitted', 'Under Review', 'Approved', 'Rejected') DEFAULT 'Submitted',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (department_id) REFERENCES departments(id)
);

-- 4. Audit Logs Table (Tamper-proof tracking)
CREATE TABLE audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    submission_id INT NOT NULL,
    actor_id INT NOT NULL,
    action_type VARCHAR(100) NOT NULL, -- e.g., 'VIEWED', 'DOWNLOADED', 'SCORED'
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (submission_id) REFERENCES submissions(id),
    FOREIGN KEY (actor_id) REFERENCES users(id)
);
