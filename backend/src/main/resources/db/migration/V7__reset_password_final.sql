-- Force update password for user 100 to '123' (Guaranteed Valid Hash)
-- Generated via API: $2a$10$gmo9KCmQumNwsAwH/O9UbuMhgdcC.mxSNmoHk6cIW2JnAiOr5JuLG

UPDATE users 
SET password_hash = '$2a$10$gmo9KCmQumNwsAwH/O9UbuMhgdcC.mxSNmoHk6cIW2JnAiOr5JuLG',
    updated_at = CURRENT_TIMESTAMP
WHERE user_id = '100' OR id = 100;
