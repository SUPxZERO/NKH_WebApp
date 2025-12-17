-- Pre-migration script to ensure critical columns exist
-- This runs before Laravel migrations to handle edge cases

-- Add is_featured column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'menu_items' AND column_name = 'is_featured'
    ) THEN
        ALTER TABLE menu_items ADD COLUMN is_featured BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Add featured_order column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'menu_items' AND column_name = 'featured_order'
    ) THEN
        ALTER TABLE menu_items ADD COLUMN featured_order INTEGER DEFAULT 0;
    END IF;
END $$;

-- Add badge column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'menu_items' AND column_name = 'badge'
    ) THEN
        ALTER TABLE menu_items ADD COLUMN badge VARCHAR(50);
    END IF;
END $$;
