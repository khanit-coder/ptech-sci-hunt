-- ============================================================
-- MIGRATION: External Student Support + Column Additions
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- 1. Add external_qr to verification_method enum (if not exists)
DO $$ BEGIN
    ALTER TYPE public.verification_method ADD VALUE IF NOT EXISTS 'external_qr';
EXCEPTION
    WHEN others THEN NULL;
END $$;

-- 2. Add missing columns to students table
ALTER TABLE public.students
    ADD COLUMN IF NOT EXISTS nickname TEXT,
    ADD COLUMN IF NOT EXISTS school_name TEXT,
    ADD COLUMN IF NOT EXISTS phone TEXT,
    ADD COLUMN IF NOT EXISTS qr_token TEXT UNIQUE,
    ADD COLUMN IF NOT EXISTS notes TEXT;

-- 3. Update student_status to support ''external''
-- (it is already TEXT so no enum change needed)

-- 4. Index for fast QR token lookup
CREATE INDEX IF NOT EXISTS idx_students_qr_token ON public.students(qr_token);
CREATE INDEX IF NOT EXISTS idx_students_school_name ON public.students(school_name);
CREATE INDEX IF NOT EXISTS idx_students_external_id ON public.students(external_id);

-- Done!
SELECT 'Migration completed successfully' AS result;
