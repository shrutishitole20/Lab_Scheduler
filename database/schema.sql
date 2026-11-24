
CREATE DATABASE IF NOT EXISTS lab_scheduler;
USE lab_scheduler;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('ADMIN', 'STAFF') NOT NULL DEFAULT 'STAFF',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_users_username UNIQUE (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS priorities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    rank_order INT NOT NULL,
    target_minutes INT NOT NULL,
    CONSTRAINT uq_priorities_name UNIQUE (name),
    CONSTRAINT uq_priorities_rank UNIQUE (rank_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS test_types (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    description VARCHAR(255) NULL,
    CONSTRAINT uq_test_types_name UNIQUE (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS machines (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    capacity INT NOT NULL DEFAULT 1,
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS machine_test_types (
    machine_id VARCHAR(50) NOT NULL,
    test_type_id INT NOT NULL,
    PRIMARY KEY (machine_id, test_type_id),
    CONSTRAINT fk_mtt_machine FOREIGN KEY (machine_id)
        REFERENCES machines (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_mtt_test_type FOREIGN KEY (test_type_id)
        REFERENCES test_types (id) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_mtt_test_type (test_type_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS machine_downtime (
    id INT AUTO_INCREMENT PRIMARY KEY,
    machine_id VARCHAR(50) NOT NULL,
    down_start DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    down_end DATETIME NULL,
    reason VARCHAR(255) NOT NULL,
    reported_by VARCHAR(50) NULL DEFAULT 'SYSTEM',
    CONSTRAINT fk_downtime_machine FOREIGN KEY (machine_id)
        REFERENCES machines (id) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_downtime_machine (machine_id),
    INDEX idx_downtime_active (machine_id, down_end)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS samples (
    id VARCHAR(50) PRIMARY KEY,
    test_type_id INT NOT NULL,
    priority_id INT NOT NULL,
    sample_type VARCHAR(50) NOT NULL DEFAULT 'Blood',
    test_category VARCHAR(50) NOT NULL DEFAULT 'General',
    processing_type VARCHAR(50) NOT NULL DEFAULT 'Routine',
    received_time DATETIME NOT NULL,
    target_minutes INT NOT NULL,
    status ENUM('RECEIVED', 'QUEUED', 'PROCESSING', 'COMPLETED', 'ON_HOLD') NOT NULL DEFAULT 'RECEIVED',
    machine_id VARCHAR(50) NULL,
    start_time DATETIME NULL,
    completion_time DATETIME NULL,
    CONSTRAINT fk_samples_test_type FOREIGN KEY (test_type_id)
        REFERENCES test_types (id) ON UPDATE CASCADE,
    CONSTRAINT fk_samples_priority FOREIGN KEY (priority_id)
        REFERENCES priorities (id) ON UPDATE CASCADE,
    CONSTRAINT fk_samples_machine FOREIGN KEY (machine_id)
        REFERENCES machines (id) ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX idx_samples_status (status),
    INDEX idx_samples_received_time (received_time),
    INDEX idx_samples_test_type (test_type_id),
    INDEX idx_samples_priority (priority_id),
    INDEX idx_samples_machine (machine_id),
    INDEX idx_samples_status_received (status, received_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS sample_assignments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sample_id VARCHAR(50) NOT NULL,
    machine_id VARCHAR(50) NOT NULL,
    assigned_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    started_at DATETIME NULL,
    completed_at DATETIME NULL,
    status ENUM('ASSIGNED', 'PROCESSING', 'COMPLETED', 'CANCELLED', 'REASSIGNED') NOT NULL DEFAULT 'ASSIGNED',
    notes VARCHAR(255) NULL,
    CONSTRAINT fk_assign_sample FOREIGN KEY (sample_id)
        REFERENCES samples (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_assign_machine FOREIGN KEY (machine_id)
        REFERENCES machines (id) ON DELETE RESTRICT ON UPDATE CASCADE,
    INDEX idx_assign_sample (sample_id),
    INDEX idx_assign_machine (machine_id),
    INDEX idx_assign_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS sample_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sample_id VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    details TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_history_sample_id (sample_id),
    INDEX idx_history_created_at (created_at),
    INDEX idx_history_action (action)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO users (username, password_hash, role) VALUES
('admin', '$2a$10$ZGFURnjTM/LBWqfDoJ0gXub8OjFHpJe6XZdmw08IVUrq/I4mJn9k2', 'ADMIN'),
('staff', '$2a$10$htZl8.2E/95zqDiqovctSObkKQtv4dEhXBo7M6ZxE7xr336scw7IS', 'STAFF')
ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash), role = VALUES(role);

INSERT INTO priorities (id, name, rank_order, target_minutes) VALUES
(1, 'EMERGENCY', 1, 15),
(2, 'HIGH',      2, 30),
(3, 'NORMAL',    3, 120),
(4, 'LOW',       4, 240)
ON DUPLICATE KEY UPDATE name = VALUES(name), rank_order = VALUES(rank_order), target_minutes = VALUES(target_minutes);

INSERT INTO test_types (id, name, description) VALUES
(1, 'Blood', 'Hematology, CBC, Coagulation and Blood Chemistry'),
(2, 'Urine', 'Urinalysis, Microscopic and Biochemical testing'),
(3, 'Thyroid', 'Immunoassay for TSH, Free T3, and Free T4 markers')
ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description);

INSERT INTO machines (id, name, capacity, is_available) VALUES
('M1', 'Hematology & Chemistry Analyzer', 2, TRUE),
('M2', 'Endocrine & Immunoassay Analyzer', 1, TRUE)
ON DUPLICATE KEY UPDATE name = VALUES(name), capacity = VALUES(capacity), is_available = VALUES(is_available);

INSERT IGNORE INTO machine_test_types (machine_id, test_type_id) VALUES
('M1', 1),
('M1', 2),
('M2', 1),
('M2', 3);

INSERT INTO samples (id, test_type_id, priority_id, sample_type, test_category, processing_type, received_time, target_minutes, status, machine_id, start_time, completion_time) VALUES
('S001', 1, 2, 'Blood', 'Hematology', 'Routine', '2026-11-18 09:00:00', 30,  'QUEUED', NULL, NULL, NULL),
('S002', 2, 3, 'Urine', 'Biochemistry', 'Routine', '2026-11-18 09:00:00', 120, 'QUEUED', NULL, NULL, NULL),
('S003', 1, 1, 'Blood', 'Hematology', 'Stat',    '2026-11-18 09:00:00', 15,  'QUEUED', NULL, NULL, NULL),
('S004', 3, 3, 'Serum', 'Endocrinology', 'Routine', '2026-11-18 09:00:00', 180, 'QUEUED', NULL, NULL, NULL),
('S005', 1, 2, 'Blood', 'Hematology', 'Routine', '2026-11-18 09:00:00', 45,  'QUEUED', NULL, NULL, NULL)
ON DUPLICATE KEY UPDATE
    test_type_id = VALUES(test_type_id),
    priority_id = VALUES(priority_id),
    sample_type = VALUES(sample_type),
    test_category = VALUES(test_category),
    processing_type = VALUES(processing_type),
    target_minutes = VALUES(target_minutes),
    status = VALUES(status);

INSERT INTO sample_history (sample_id, action, details, created_at) VALUES
('S001', 'RECEIVED', 'Specimen Blood received for Hematology', '2026-11-18 09:00:00'),
('S001', 'QUEUED', 'Sample placed in priority queue (Position: #1)', '2026-11-18 09:00:00'),
('S002', 'RECEIVED', 'Specimen Urine received for Biochemistry', '2026-11-18 09:00:00'),
('S002', 'QUEUED', 'Sample placed in priority queue (Position: #2)', '2026-11-18 09:00:00'),
('S003', 'RECEIVED', 'Specimen Blood received for Stat Hematology', '2026-11-18 09:00:00'),
('S003', 'QUEUED', 'Sample placed in priority queue with EMERGENCY priority', '2026-11-18 09:00:00');
