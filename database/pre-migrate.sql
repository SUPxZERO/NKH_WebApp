-- Pre-migration script to ensure critical columns exist
-- This runs before Laravel migrations to handle edge cases

-- Fix menu_items table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'menu_items') THEN
        RAISE NOTICE 'menu_items table does not exist yet, skipping';
    ELSE
        -- Add deleted_at column if it doesn't exist (for soft deletes)
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'menu_items' AND column_name = 'deleted_at'
        ) THEN
            ALTER TABLE menu_items ADD COLUMN deleted_at TIMESTAMP NULL;
        END IF;

        -- Add is_featured column if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'menu_items' AND column_name = 'is_featured'
        ) THEN
            ALTER TABLE menu_items ADD COLUMN is_featured BOOLEAN DEFAULT false;
        END IF;

        -- Add featured_order column if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'menu_items' AND column_name = 'featured_order'
        ) THEN
            ALTER TABLE menu_items ADD COLUMN featured_order INTEGER DEFAULT 0;
        END IF;

        -- Add badge column if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'menu_items' AND column_name = 'badge'
        ) THEN
            ALTER TABLE menu_items ADD COLUMN badge VARCHAR(50);
        END IF;

        -- Add display_order column if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'menu_items' AND column_name = 'display_order'
        ) THEN
            ALTER TABLE menu_items ADD COLUMN display_order INTEGER DEFAULT 0;
        END IF;
    END IF;
END $$;

-- Fix categories table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'categories') THEN
        RAISE NOTICE 'categories table does not exist yet, skipping';
    ELSE
        -- Add deleted_at column if it doesn't exist (for soft deletes)
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'categories' AND column_name = 'deleted_at'
        ) THEN
            ALTER TABLE categories ADD COLUMN deleted_at TIMESTAMP NULL;
        END IF;

        -- Add display_order column if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'categories' AND column_name = 'display_order'
        ) THEN
            ALTER TABLE categories ADD COLUMN display_order INTEGER DEFAULT 0;
        END IF;
    END IF;
END $$;
