-- EMERGENCY PASSWORD RESET
-- This script directly updates the password without going through Flyway
-- Password: 123
-- BCrypt hash for "123" with strength 10

UPDATE users 
SET password_hash = '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    updated_at = CURRENT_TIMESTAMP
WHERE user_id = '100' OR id = 100;

-- Verify
SELECT id, user_id, email, role, LENGTH(password_hash) as hash_length 
FROM users 
WHERE user_id = '100' OR id = 100;
