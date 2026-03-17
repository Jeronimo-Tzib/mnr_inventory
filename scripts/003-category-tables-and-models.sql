-- ============================================================
-- INVENTORY DASHBOARD - PHASE 2 MIGRATION
-- ============================================================

-- 1. Hardware Models Table
CREATE TABLE IF NOT EXISTS hardware_models (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    category_id TEXT REFERENCES hardware_categories(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Add table_name to categories to track dynamic tables
ALTER TABLE hardware_categories 
ADD COLUMN IF NOT EXISTS table_name TEXT;

-- Update existing seeded categories with their dynamic table names
UPDATE hardware_categories SET table_name = 'hw_displays' WHERE name = 'Displays';
UPDATE hardware_categories SET table_name = 'hw_system_units' WHERE name = 'System Units';
UPDATE hardware_categories SET table_name = 'hw_printers' WHERE name = 'Printers';
UPDATE hardware_categories SET table_name = 'hw_mouses' WHERE name = 'Mouses';

-- 3. Create initial dynamic tables
CREATE TABLE IF NOT EXISTS hw_displays (
    id TEXT PRIMARY KEY,
    model TEXT NOT NULL,
    service_tag TEXT,
    serial_number TEXT,
    status TEXT NOT NULL CHECK (status IN ('Working', 'Not Working')),
    problem_description TEXT NOT NULL DEFAULT '',
    disposition TEXT NOT NULL CHECK (disposition IN ('Keep', 'Discard')),
    category_id TEXT REFERENCES hardware_categories(id) ON DELETE CASCADE,
    date_added TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hw_system_units (
    id TEXT PRIMARY KEY,
    model TEXT NOT NULL,
    service_tag TEXT,
    serial_number TEXT,
    status TEXT NOT NULL CHECK (status IN ('Working', 'Not Working')),
    problem_description TEXT NOT NULL DEFAULT '',
    disposition TEXT NOT NULL CHECK (disposition IN ('Keep', 'Discard')),
    category_id TEXT REFERENCES hardware_categories(id) ON DELETE CASCADE,
    date_added TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hw_printers (
    id TEXT PRIMARY KEY,
    model TEXT NOT NULL,
    service_tag TEXT,
    serial_number TEXT,
    status TEXT NOT NULL CHECK (status IN ('Working', 'Not Working')),
    problem_description TEXT NOT NULL DEFAULT '',
    disposition TEXT NOT NULL CHECK (disposition IN ('Keep', 'Discard')),
    category_id TEXT REFERENCES hardware_categories(id) ON DELETE CASCADE,
    date_added TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hw_mouses (
    id TEXT PRIMARY KEY,
    model TEXT NOT NULL,
    service_tag TEXT,
    serial_number TEXT,
    status TEXT NOT NULL CHECK (status IN ('Working', 'Not Working')),
    problem_description TEXT NOT NULL DEFAULT '',
    disposition TEXT NOT NULL CHECK (disposition IN ('Keep', 'Discard')),
    category_id TEXT REFERENCES hardware_categories(id) ON DELETE CASCADE,
    date_added TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 4. Migrate Data from old inventory_records (assuming they are all System Units)
DO $$ 
DECLARE
    system_unit_cat_id TEXT;
BEGIN
    -- Get the ID for System Units
    SELECT id INTO system_unit_cat_id FROM hardware_categories WHERE name = 'System Units' LIMIT 1;

    -- If the old table exists, move data
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'inventory_records') THEN
        
        -- Insert into hw_system_units
        INSERT INTO hw_system_units (id, model, service_tag, status, problem_description, disposition, category_id, date_added)
        SELECT 
            id, 
            model, 
            service_tag, 
            status, 
            problem_description, 
            disposition, 
            system_unit_cat_id, 
            date_added
        FROM inventory_records
        ON CONFLICT DO NOTHING;

        -- Extract unique models into hardware_models
        INSERT INTO hardware_models (id, name, category_id)
        SELECT DISTINCT 
            'MOD-' || gen_random_uuid(), 
            model, 
            system_unit_cat_id
        FROM inventory_records
        WHERE model IS NOT NULL AND model != ''
        ON CONFLICT (name) DO NOTHING;
        
        -- After successful migration we can drop the old table.
        -- We will leave it for manual deletion or do it safely here:
        -- DROP TABLE inventory_records;
    END IF;
END $$;
