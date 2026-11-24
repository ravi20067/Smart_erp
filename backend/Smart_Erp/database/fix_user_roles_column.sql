-- Migration: Change user_role column type to VARCHAR(50)
-- Prevents MySQL 'Data truncated for column user_role' error for new enum values like SECURITY_GUARD.

ALTER TABLE users MODIFY COLUMN user_role VARCHAR(50);
ALTER TABLE roles MODIFY COLUMN user_role VARCHAR(50);
