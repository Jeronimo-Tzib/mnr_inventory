-- ============================================================
-- INVENTORY DASHBOARD - DATABASE MIGRATION
-- ============================================================

-- 1. Inventory Records Table
-- Stores all hardware inventory items
CREATE TABLE IF NOT EXISTS inventory_records (
    id              TEXT PRIMARY KEY,
    model           TEXT NOT NULL,
    service_tag     TEXT NOT NULL,
    status          TEXT NOT NULL CHECK (status IN ('Working', 'Not Working')),
    problem_description TEXT NOT NULL DEFAULT '',
    disposition     TEXT NOT NULL CHECK (disposition IN ('Keep', 'Discard')),
    date_added      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Index for fast lookups by service tag
CREATE INDEX IF NOT EXISTS idx_inventory_service_tag ON inventory_records (service_tag);

-- Index for filtering by status
CREATE INDEX IF NOT EXISTS idx_inventory_status ON inventory_records (status);

-- Index for filtering by disposition
CREATE INDEX IF NOT EXISTS idx_inventory_disposition ON inventory_records (disposition);

-- Index for ordering by date
CREATE INDEX IF NOT EXISTS idx_inventory_date_added ON inventory_records (date_added DESC);


-- 2. Activity Log Table
-- Tracks all add/delete actions for the Intelligence Center
CREATE TABLE IF NOT EXISTS activity_log (
    id                  TEXT PRIMARY KEY,
    timestamp           TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    action              TEXT NOT NULL CHECK (action IN ('added', 'deleted')),
    item_model          TEXT NOT NULL,
    item_service_tag    TEXT NOT NULL,
    item_status         TEXT NOT NULL,
    item_disposition    TEXT NOT NULL
);

-- Index for ordering by timestamp (most recent first)
CREATE INDEX IF NOT EXISTS idx_activity_log_timestamp ON activity_log (timestamp DESC);

-- Index for filtering by action type
CREATE INDEX IF NOT EXISTS idx_activity_log_action ON activity_log (action);
