-- J TRADERS - Database Schema
-- PostgreSQL / MySQL compatible
-- Run this to setup the database structure

-- ============================================
-- USERS TABLE
-- ============================================

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    avatar_url VARCHAR(500),
    date_of_birth DATE,
    country VARCHAR(100),
    
    -- Account Status
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    email_verified_at TIMESTAMP,
    
    -- Account Security
    two_factor_enabled BOOLEAN DEFAULT false,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_email (email),
    INDEX idx_created_at (created_at)
);

-- ============================================
-- COURSES TABLE
-- ============================================

CREATE TABLE courses (
    id SERIAL PRIMARY KEY,
    course_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    short_description VARCHAR(500),
    category VARCHAR(100),
    price DECIMAL(10, 2) NOT NULL,
    
    -- Course Content
    total_modules INT,
    total_hours DECIMAL(8, 2),
    difficulty_level VARCHAR(50), -- beginner, intermediate, advanced
    
    -- Features
    includes_live_sessions BOOLEAN DEFAULT false,
    includes_coaching BOOLEAN DEFAULT false,
    includes_bot_access BOOLEAN DEFAULT false,
    includes_community_access BOOLEAN DEFAULT false,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_category (category),
    INDEX idx_is_featured (is_featured)
);

-- Sample Courses
INSERT INTO courses (course_code, name, description, price, total_modules, total_hours, difficulty_level, includes_live_sessions, includes_coaching, is_active) VALUES
('FOUND-001', 'Foundation Trading', 'Learn market fundamentals, technical analysis, and basic trading strategies', 297.00, 12, 20, 'beginner', true, false, true),
('ADV-001', 'Advanced Strategy Mastery', 'Master advanced trading strategies, risk management, and portfolio optimization', 797.00, 24, 40, 'intermediate', true, true, true),
('ELITE-001', 'Elite Trading System', 'Complete trading system with algorithmic strategies and advanced market analysis', 1497.00, 36, 60, 'advanced', true, true, true),
('MENT-001', 'Premium Mentorship', '1-on-1 personalized coaching from certified trading experts', 2997.00, 0, 0, 'all', false, true, true);

-- ============================================
-- PURCHASES TABLE (Main Transaction Table)
-- ============================================

CREATE TABLE purchases (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id),
    course_id INT NOT NULL REFERENCES courses(id),
    
    -- Purchase Information
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    
    -- Payment Information
    stripe_payment_intent_id VARCHAR(255),
    stripe_charge_id VARCHAR(255),
    payment_method VARCHAR(50), -- card, bank_transfer, etc.
    
    -- Access Control
    access_status VARCHAR(50) DEFAULT 'active', -- active, expired, suspended
    purchase_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expiration_date TIMESTAMP NOT NULL,
    renewal_count INT DEFAULT 0,
    
    -- Refund Information
    is_refunded BOOLEAN DEFAULT false,
    refund_date TIMESTAMP,
    refund_amount DECIMAL(10, 2),
    refund_reason VARCHAR(500),
    
    -- Additional
    transaction_id VARCHAR(255) UNIQUE,
    notes TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_user_id (user_id),
    INDEX idx_course_id (course_id),
    INDEX idx_access_status (access_status),
    INDEX idx_expiration_date (expiration_date),
    INDEX idx_purchase_date (purchase_date),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (course_id) REFERENCES courses(id)
);

-- ============================================
-- COURSE MODULES TABLE
-- ============================================

CREATE TABLE course_modules (
    id SERIAL PRIMARY KEY,
    course_id INT NOT NULL REFERENCES courses(id),
    module_number INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    video_url VARCHAR(500),
    video_duration INT, -- in seconds
    materials_url VARCHAR(500),
    quiz_url VARCHAR(500),
    
    display_order INT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_course_id (course_id),
    INDEX idx_display_order (display_order)
);

-- ============================================
-- LIVE SESSIONS TABLE
-- ============================================

CREATE TABLE live_sessions (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    session_date TIMESTAMP NOT NULL,
    duration_minutes INT,
    instructor_name VARCHAR(255),
    session_url VARCHAR(500),
    
    max_attendees INT,
    current_attendees INT DEFAULT 0,
    
    is_recorded BOOLEAN DEFAULT false,
    recording_url VARCHAR(500),
    
    status VARCHAR(50) DEFAULT 'scheduled', -- scheduled, ongoing, completed, cancelled
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_session_date (session_date),
    INDEX idx_status (status)
);

-- Sample Live Sessions
INSERT INTO live_sessions (title, description, session_date, duration_minutes, instructor_name, status) VALUES
('Morning Market Analysis', 'Daily market setup, trend analysis, and entry/exit opportunities', DATE_ADD(CURDATE(), INTERVAL 2 DAY) + INTERVAL '9:00:00' HOUR, 60, 'Senior Trader', 'scheduled'),
('Strategy Implementation', 'Apply advanced strategies with live broker integration', DATE_ADD(CURDATE(), INTERVAL 3 DAY) + INTERVAL '14:00:00' HOUR, 90, 'Trading Expert', 'scheduled'),
('Weekly Recap & Planning', 'Review the week''s trades and plan for next week', DATE_ADD(CURDATE(), INTERVAL 5 DAY) + INTERVAL '16:00:00' HOUR, 120, 'Head Trader', 'scheduled');

-- ============================================
-- STUDENT PROGRESS TABLE
-- ============================================

CREATE TABLE student_progress (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id),
    course_id INT NOT NULL REFERENCES courses(id),
    
    modules_completed INT DEFAULT 0,
    total_modules INT NOT NULL,
    completion_percentage DECIMAL(5, 2) DEFAULT 0,
    
    last_accessed TIMESTAMP,
    time_spent_hours DECIMAL(8, 2) DEFAULT 0,
    
    quiz_score DECIMAL(5, 2),
    final_score DECIMAL(5, 2),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_user_course (user_id, course_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (course_id) REFERENCES courses(id)
);

-- ============================================
-- SESSION ATTENDANCE TABLE
-- ============================================

CREATE TABLE session_attendance (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id),
    session_id INT NOT NULL REFERENCES live_sessions(id),
    
    joined_at TIMESTAMP NOT NULL,
    left_at TIMESTAMP,
    attendance_minutes INT,
    
    attended BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_user_session (user_id, session_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (session_id) REFERENCES live_sessions(id)
);

-- ============================================
-- TESTIMONIALS TABLE
-- ============================================

CREATE TABLE testimonials (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id),
    course_id INT NOT NULL REFERENCES courses(id),
    
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    rating INT CHECK (rating >= 1 AND rating <= 5),
    
    profit_generated DECIMAL(15, 2),
    success_metric VARCHAR(500),
    
    is_featured BOOLEAN DEFAULT false,
    is_approved BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_course_id (course_id),
    INDEX idx_is_approved (is_approved),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (course_id) REFERENCES courses(id)
);

-- ============================================
-- REFUNDS TABLE
-- ============================================

CREATE TABLE refunds (
    id SERIAL PRIMARY KEY,
    purchase_id INT NOT NULL REFERENCES purchases(id),
    
    amount DECIMAL(10, 2) NOT NULL,
    reason VARCHAR(500) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected, processed
    
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP,
    stripe_refund_id VARCHAR(255),
    
    admin_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_status (status),
    FOREIGN KEY (purchase_id) REFERENCES purchases(id)
);

-- ============================================
-- PAYMENTS TABLE (For detailed payment tracking)
-- ============================================

CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    purchase_id INT NOT NULL REFERENCES purchases(id),
    
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    status VARCHAR(50) DEFAULT 'pending', -- pending, succeeded, failed
    
    payment_method VARCHAR(100),
    card_last_four VARCHAR(4),
    
    stripe_payment_intent_id VARCHAR(255),
    stripe_charge_id VARCHAR(255),
    
    error_message TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_status (status),
    INDEX idx_purchase_id (purchase_id),
    FOREIGN KEY (purchase_id) REFERENCES purchases(id)
);

-- ============================================
-- EMAILS TABLE (For email tracking)
-- ============================================

CREATE TABLE emails (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id),
    
    email_type VARCHAR(100), -- welcome, purchase_confirmation, expiration_warning, renewal_reminder, etc.
    subject VARCHAR(255),
    content TEXT,
    
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    opened_at TIMESTAMP,
    clicked_at TIMESTAMP,
    
    status VARCHAR(50) DEFAULT 'sent', -- sent, bounced, complained, unsubscribed
    error_message TEXT,
    
    INDEX idx_user_id (user_id),
    INDEX idx_email_type (email_type),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- ============================================
-- SUPPORT TICKETS TABLE
-- ============================================

CREATE TABLE support_tickets (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id),
    
    subject VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100), -- technical, billing, course_content, etc.
    priority VARCHAR(50) DEFAULT 'normal', -- low, normal, high, urgent
    
    status VARCHAR(50) DEFAULT 'open', -- open, in_progress, resolved, closed
    
    response_count INT DEFAULT 0,
    assigned_to INT REFERENCES users(id),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_priority (priority),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- ============================================
-- ADMIN AUDIT LOG TABLE
-- ============================================

CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    admin_id INT REFERENCES users(id),
    action VARCHAR(255) NOT NULL,
    entity_type VARCHAR(100),
    entity_id INT,
    
    old_values TEXT,
    new_values TEXT,
    
    ip_address VARCHAR(45),
    user_agent VARCHAR(500),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_admin_id (admin_id),
    INDEX idx_created_at (created_at),
    INDEX idx_action (action)
);

-- ============================================
-- CREATE INDEXES FOR PERFORMANCE
-- ============================================

-- For checking expired courses
CREATE INDEX idx_expiration_check ON purchases(expiration_date, access_status);

-- For getting user's active courses
CREATE INDEX idx_user_active_courses ON purchases(user_id, access_status);

-- For revenue reporting
CREATE INDEX idx_purchase_date_status ON purchases(purchase_date, access_status);

-- ============================================
-- VIEWS FOR COMMON QUERIES
-- ============================================

-- View: Active Student Courses
CREATE VIEW active_student_courses AS
SELECT 
    u.id as user_id,
    u.email,
    u.full_name,
    c.name as course_name,
    p.purchase_date,
    p.expiration_date,
    DATEDIFF(DAY, NOW(), p.expiration_date) as days_remaining,
    p.access_status
FROM purchases p
JOIN users u ON p.user_id = u.id
JOIN courses c ON p.course_id = c.id
WHERE p.access_status IN ('active', 'expiring_soon')
ORDER BY p.expiration_date ASC;

-- View: Revenue Dashboard
CREATE VIEW revenue_dashboard AS
SELECT 
    DATE_TRUNC('month', p.purchase_date)::DATE as month,
    COUNT(*) as total_sales,
    SUM(p.amount) as total_revenue,
    AVG(p.amount) as average_order_value,
    COUNT(DISTINCT p.user_id) as unique_customers
FROM purchases p
WHERE p.access_status != 'refunded'
GROUP BY DATE_TRUNC('month', p.purchase_date)
ORDER BY month DESC;

-- ============================================
-- SAMPLE DATA QUERIES
-- ============================================

-- Count active courses expiring in next 7 days
SELECT COUNT(*) as expiring_soon
FROM purchases
WHERE access_status = 'active'
AND expiration_date <= DATE_ADD(NOW(), INTERVAL 7 DAY)
AND expiration_date > NOW();

-- Calculate total revenue
SELECT SUM(amount) as total_revenue
FROM purchases
WHERE access_status != 'refunded';

-- Find expired courses that need cleanup
SELECT user_id, course_id, expiration_date
FROM purchases
WHERE access_status = 'active'
AND expiration_date < NOW()
ORDER BY expiration_date ASC;

-- ============================================
-- NOTES
-- ============================================

-- 1. Run migrations in order: users → courses → purchases → other tables
-- 2. Update CURRENT_TIMESTAMP syntax for your specific database
-- 3. Adjust data types if using different database (SQLite uses TEXT for dates)
-- 4. Remember to set up proper backup procedures
-- 5. Run ANALYZE on tables after initial data load for query optimization
-- 6. Consider partitioning large tables (purchases) by date for better performance
