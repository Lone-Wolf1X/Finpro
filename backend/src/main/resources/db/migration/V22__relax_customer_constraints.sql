-- Relax constraints to allow partial drafts
ALTER TABLE customers ALTER COLUMN email DROP NOT NULL;
ALTER TABLE customers ALTER COLUMN phone DROP NOT NULL;
