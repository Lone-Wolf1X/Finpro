-- Create default tenant
INSERT INTO tenants (id, tenant_key, company_name, subdomain, contact_email, contact_phone, status, created_at, updated_at)
VALUES (1, 'nextgen', 'Next Gen Innovations Nepal', 'nextgen', 'nextgeninnovationsprivatelimit@gmail.com', '+977-1-XXXXXXX', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

-- Create SUPERADMIN user
-- Password: 123 (hashed with BCrypt)
-- BCrypt hash for "123": $2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi
INSERT INTO users (id, email, password_hash, user_id, staff_id, name, first_name, last_name, role, status, tenant_id, created_at, updated_at)
VALUES (
    100,
    'nextgeninnovationsprivatelimit@gmail.com',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    '100',
    '100',
    'Next Gen Innovations',
    'Next Gen',
    'Innovations',
    'SUPERADMIN',
    'ACTIVE',
    1,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT (id) DO UPDATE SET
    password_hash = '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    updated_at = CURRENT_TIMESTAMP;

-- Reset sequences to start after our manual inserts
SELECT setval('tenants_id_seq', (SELECT MAX(id) FROM tenants));
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));
