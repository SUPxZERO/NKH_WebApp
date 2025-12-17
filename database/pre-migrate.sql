-- ============================================================================
-- COMPREHENSIVE PRE-MIGRATION SCRIPT
-- ============================================================================
-- This script ensures ALL critical columns exist before Laravel migrations run
-- It's designed to handle cases where migrations fail partway through
-- ============================================================================

-- ====================
-- MENU_ITEMS TABLE
-- ====================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'menu_items') THEN
        -- Soft deletes
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'menu_items' AND column_name = 'deleted_at') THEN
            ALTER TABLE menu_items ADD COLUMN deleted_at TIMESTAMP NULL;
        END IF;

        -- Featured fields
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'menu_items' AND column_name = 'is_featured') THEN
            ALTER TABLE menu_items ADD COLUMN is_featured BOOLEAN DEFAULT false;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'menu_items' AND column_name = 'featured_order') THEN
            ALTER TABLE menu_items ADD COLUMN featured_order INTEGER DEFAULT 0;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'menu_items' AND column_name = 'badge') THEN
            ALTER TABLE menu_items ADD COLUMN badge VARCHAR(50);
        END IF;

        -- Display and ordering
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'menu_items' AND column_name = 'display_order') THEN
            ALTER TABLE menu_items ADD COLUMN display_order INTEGER DEFAULT 0;
        END IF;

        -- Ratings and reviews
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'menu_items' AND column_name = 'rating') THEN
            ALTER TABLE menu_items ADD COLUMN rating DECIMAL(3,2);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'menu_items' AND column_name = 'review_count') THEN
            ALTER TABLE menu_items ADD COLUMN review_count INTEGER DEFAULT 0;
        END IF;

        -- Active status
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'menu_items' AND column_name = 'is_active') THEN
            ALTER TABLE menu_items ADD COLUMN is_active BOOLEAN DEFAULT true;
        END IF;
    END IF;
END $$;

-- ====================
-- CATEGORIES TABLE
-- ====================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'categories') THEN
        -- Soft deletes
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'categories' AND column_name = 'deleted_at') THEN
            ALTER TABLE categories ADD COLUMN deleted_at TIMESTAMP NULL;
        END IF;

        -- Display and ordering
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'categories' AND column_name = 'display_order') THEN
            ALTER TABLE categories ADD COLUMN display_order INTEGER DEFAULT 0;
        END IF;

        -- Parent-child relationship
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'categories' AND column_name = 'parent_id') THEN
            ALTER TABLE categories ADD COLUMN parent_id BIGINT;
        END IF;

        -- Active status
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'categories' AND column_name = 'is_active') THEN
            ALTER TABLE categories ADD COLUMN is_active BOOLEAN DEFAULT true;
        END IF;

        -- Slug for URLs
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'categories' AND column_name = 'slug') THEN
            ALTER TABLE categories ADD COLUMN slug VARCHAR(255);
        END IF;
    END IF;
END $$;

-- ====================
-- CUSTOMERS TABLE
-- ====================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'customers') THEN
        -- User relationship
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'user_id') THEN
            ALTER TABLE customers ADD COLUMN user_id BIGINT;
        END IF;
    END IF;
END $$;

-- ====================
-- FEEDBACKS TABLE
-- ====================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'feedbacks') THEN
        -- Visibility for testimonials
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'feedbacks' AND column_name = 'visibility') THEN
            ALTER TABLE feedbacks ADD COLUMN visibility VARCHAR(20) DEFAULT 'private';
        END IF;

        -- Rating
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'feedbacks' AND column_name = 'rating') THEN
            ALTER TABLE feedbacks ADD COLUMN rating INTEGER DEFAULT 5;
        END IF;

        -- Customer relationship
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'feedbacks' AND column_name = 'customer_id') THEN
            ALTER TABLE feedbacks ADD COLUMN customer_id BIGINT;
        END IF;
    END IF;
END $$;

-- ====================
-- USERS TABLE
-- ====================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        -- Profile fields
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'phone') THEN
            ALTER TABLE users ADD COLUMN phone VARCHAR(20);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'image_path') THEN
            ALTER TABLE users ADD COLUMN image_path VARCHAR(255);
        END IF;
    END IF;
END $$;

-- ====================
-- ORDERS TABLE
-- ====================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders') THEN
        -- Customer relationship
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'customer_id') THEN
            ALTER TABLE orders ADD COLUMN customer_id BIGINT;
        END IF;
    END IF;
END $$;

-- Final notice
DO $$
BEGIN
    RAISE NOTICE 'Pre-migration script completed successfully';
END $$;
