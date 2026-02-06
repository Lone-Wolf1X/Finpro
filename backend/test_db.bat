@echo off
echo Testing Database Connection and User Lookup
echo ============================================
echo.

psql -U postgres -d fintech_saas -p 5433 -c "SELECT id, email, user_id, staff_id, role, status FROM users WHERE user_id = '100' OR id = 100;"

echo.
echo Testing Password Hash
echo =====================
psql -U postgres -d fintech_saas -p 5433 -c "SELECT id, user_id, LEFT(password_hash, 60) as password_hash FROM users WHERE user_id = '100' OR id = 100;"

pause
