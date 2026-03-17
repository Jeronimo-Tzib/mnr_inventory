-- ============================================================
-- INVENTORY DASHBOARD - AUTH & CATEGORIES MIGRATION
-- ============================================================

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('Admin', 'Employee')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed default users (password hashes are SHA-256 of 'admin' and 'employee')
-- 'admin' -> 8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918
-- 'employee' -> 2fdc0177057d3a5c6c2c0821e01f4fa8d90f9a3bb7afd82b0db526af98d68de8
INSERT INTO users (id, username, password_hash, role) 
VALUES 
  ('USR-ADMIN', 'admin', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', 'Admin'),
  ('USR-EMP', 'employee', '2fdc0177057d3a5c6c2c0821e01f4fa8d90f9a3bb7afd82b0db526af98d68de8', 'Employee')
ON CONFLICT (username) DO NOTHING;

-- 2. Hardware Categories Table
CREATE TABLE IF NOT EXISTS hardware_categories (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed initial categories
INSERT INTO hardware_categories (id, name)
VALUES 
  ('CAT-1', 'Displays'),
  ('CAT-2', 'System Units'),
  ('CAT-3', 'Printers'),
  ('CAT-4', 'Mouses')
ON CONFLICT (name) DO NOTHING;

-- 3. Modify Inventory Records
-- Add category_id (nullable initially to prevent errors on existing rows, then we can update)
ALTER TABLE inventory_records 
ADD COLUMN IF NOT EXISTS category_id TEXT REFERENCES hardware_categories(id);

-- If there are existing records, assign them to a default category or leave them null.
-- For now, we'll leave existing records with category_id = NULL.

-- 4. Migrate Logs
-- The user requested to "migrate the existing logs in inventory_logs".
-- Check if inventory_logs table exists and migrate to activity_log.
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'inventory_logs') THEN
        INSERT INTO activity_log (id, timestamp, action, item_model, item_service_tag, item_status, item_disposition)
        SELECT 
            'LOG-MIG-' || gen_random_uuid(), -- Generate a new ID or use old if suitable
            COALESCE(log_date, NOW()), 
            'added', -- Assuming old logs were additions, adjust if needed
            COALESCE(model, 'Unknown'),
            COALESCE(service_tag, 'Unknown'),
            COALESCE(status, 'Working'),
            'Keep'
        FROM inventory_logs
        -- Add a constraint or ON CONFLICT if necessary to avoid duplicates
        ON CONFLICT DO NOTHING;
    END IF;
END $$;
