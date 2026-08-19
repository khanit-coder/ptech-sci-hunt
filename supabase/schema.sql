-- ==============================================================================
-- PTECH-Sci : Secret Item Hunt - Supabase PostgreSQL Database Schema
-- Activity: PTECH-Sci : Survive in Mario World
-- Tagline: "The Game Has Begun. Science Is Your Only Way Out."
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. CUSTOM ENUMS
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'staff', 'viewer');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE item_status AS ENUM ('active', 'discovered', 'disabled', 'hidden');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE event_status AS ENUM ('open', 'paused', 'closed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE discovery_status AS ENUM ('confirmed', 'revoked', 'correction_requested');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE verification_method AS ENUM ('external_qr', 'student_id', 'manual_name', 'imported_student');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE student_name_display_mode AS ENUM ('full', 'masked', 'nickname', 'hidden');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. TABLES

-- Table: profiles (Extends auth.users with RBAC)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    display_name TEXT,
    role user_role NOT NULL DEFAULT 'staff',
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: item_types (Dynamic categories of items)
CREATE TABLE IF NOT EXISTS public.item_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT UNIQUE NOT NULL, -- e.g., 'STAR', 'BIO', 'THERMO', 'HYDRO', 'WARP'
    name TEXT NOT NULL,        -- Thai / Primary Name, e.g., 'STAR CORE'
    name_en TEXT NOT NULL,     -- English Name
    description TEXT,          -- Story & lore description
    icon TEXT NOT NULL,        -- Icon identifier or emoji
    color TEXT NOT NULL,       -- Hex color code or gradient tag
    sort_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: items (Secret item records)
CREATE TABLE IF NOT EXISTS public.items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_code TEXT UNIQUE NOT NULL, -- Public label on sticker/card e.g., 'STAR-001'
    name TEXT NOT NULL,             -- Item display name e.g., 'STAR CORE #01'
    item_type_id UUID NOT NULL REFERENCES public.item_types(id) ON DELETE RESTRICT,
    qr_token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'), -- Opaque token inside QR code
    status item_status NOT NULL DEFAULT 'active',
    location_hint TEXT,             -- Where is it hidden
    hint TEXT,                      -- Science clue/puzzle hint
    description TEXT,               -- Sci-Fi backstory
    image_url TEXT,
    reward_name TEXT DEFAULT 'Special Prize',
    reward_quantity INT DEFAULT 1,
    reward_notes TEXT,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: students (Enrolled students database)
CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_code TEXT UNIQUE NOT NULL, -- Student ID number
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    full_name TEXT GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED,
    class_name TEXT,                  -- e.g., 'ปวช.1/1', 'ปวส.2/3'
    department TEXT,                  -- e.g., 'เทคโนโลยีสารสนเทศ'
    level TEXT,                       -- e.g., 'ปวช.', 'ปวส.'
    student_status TEXT DEFAULT 'active',
    external_id TEXT,                 -- ID from college external system
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: discoveries (Single-claim guarantee via UNIQUE(item_id))
CREATE TABLE IF NOT EXISTS public.discoveries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_id UUID UNIQUE NOT NULL REFERENCES public.items(id) ON DELETE RESTRICT,
    student_id UUID REFERENCES public.students(id) ON DELETE SET NULL,
    manual_student_name TEXT,         -- Used if student was entered manually
    manual_student_code TEXT,
    staff_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    verification_method verification_method NOT NULL DEFAULT 'imported_student',
    discovered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status discovery_status NOT NULL DEFAULT 'confirmed',
    reward_claimed BOOLEAN NOT NULL DEFAULT false,
    reward_claimed_at TIMESTAMPTZ,
    reward_given_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    notes TEXT,
    correction_note TEXT,
    idempotency_key TEXT UNIQUE,      -- Prevents double submissions from UI
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: discovery_attempts (Audit trail of every scan attempt including duplicates and invalid scans)
CREATE TABLE IF NOT EXISTS public.discovery_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    qr_token TEXT,
    item_id UUID REFERENCES public.items(id) ON DELETE SET NULL,
    student_id UUID REFERENCES public.students(id) ON DELETE SET NULL,
    staff_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    attempt_result TEXT NOT NULL,      -- 'SUCCESS', 'ALREADY_DISCOVERED', 'INVALID_TOKEN', 'EVENT_PAUSED', 'ERROR'
    error_message TEXT,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: event_settings (Single row configuration for the event)
CREATE TABLE IF NOT EXISTS public.event_settings (
    id INT PRIMARY KEY DEFAULT 1,
    event_name TEXT NOT NULL DEFAULT 'PTECH-Sci : Survive in Mario World',
    tagline TEXT NOT NULL DEFAULT 'The Game Has Begun. Science Is Your Only Way Out.',
    status event_status NOT NULL DEFAULT 'open',
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    total_items_override INT,         -- Optional override, defaults to COUNT(items)
    dashboard_title TEXT NOT NULL DEFAULT 'PTECH-Sci : SURVIVE IN MARIO WORLD',
    dashboard_subtitle TEXT NOT NULL DEFAULT 'MISSION CONTROL - RECOVERY DASHBOARD',
    show_student_name_mode student_name_display_mode NOT NULL DEFAULT 'masked',
    sound_enabled BOOLEAN NOT NULL DEFAULT true,
    animation_enabled BOOLEAN NOT NULL DEFAULT true,
    celebration_enabled BOOLEAN NOT NULL DEFAULT true,
    show_recent_discoveries BOOLEAN NOT NULL DEFAULT true,
    show_item_hints BOOLEAN NOT NULL DEFAULT false,
    maintenance_mode BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT single_row_check CHECK (id = 1)
);

-- Table: audit_logs (Security and operations audit log)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,             -- e.g., 'LOGIN', 'ITEM_DISCOVERED', 'DISCOVERY_REVOKED', etc.
    target_type TEXT,                 -- 'item', 'student', 'discovery', 'setting', 'user'
    target_id TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: import_jobs (Tracking student batch import wizard jobs)
CREATE TABLE IF NOT EXISTS public.import_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    file_name TEXT NOT NULL,
    total_rows INT NOT NULL DEFAULT 0,
    imported_count INT NOT NULL DEFAULT 0,
    updated_count INT NOT NULL DEFAULT 0,
    skipped_count INT NOT NULL DEFAULT 0,
    error_count INT NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending', -- 'processing', 'completed', 'failed'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Table: import_errors (Individual row errors in an import job)
CREATE TABLE IF NOT EXISTS public.import_errors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    import_job_id UUID NOT NULL REFERENCES public.import_jobs(id) ON DELETE CASCADE,
    row_number INT NOT NULL,
    row_data JSONB NOT NULL,
    error_message TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. DATABASE INDEXES FOR 500 CONCURRENT USERS
CREATE INDEX IF NOT EXISTS idx_items_qr_token ON public.items(qr_token);
CREATE INDEX IF NOT EXISTS idx_items_type ON public.items(item_type_id);
CREATE INDEX IF NOT EXISTS idx_items_status ON public.items(status);
CREATE INDEX IF NOT EXISTS idx_students_code ON public.students(student_code);
CREATE INDEX IF NOT EXISTS idx_students_name_search ON public.students(first_name, last_name);
CREATE INDEX IF NOT EXISTS idx_discoveries_item ON public.discoveries(item_id);
CREATE INDEX IF NOT EXISTS idx_discoveries_student ON public.discoveries(student_id);
CREATE INDEX IF NOT EXISTS idx_discoveries_staff ON public.discoveries(staff_id);
CREATE INDEX IF NOT EXISTS idx_discoveries_discovered_at ON public.discoveries(discovered_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON public.audit_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);

-- 5. REAL-TIME VIEWS

-- View: v_dashboard_stats (Aggregated statistics for real-time dashboard)
CREATE OR REPLACE VIEW public.v_dashboard_stats AS
WITH total_calc AS (
    SELECT 
        COALESCE(
            (SELECT total_items_override FROM public.event_settings WHERE id = 1 AND total_items_override > 0),
            (SELECT COUNT(*) FROM public.items WHERE status != 'disabled')
        ) AS total_items,
        (SELECT COUNT(*) FROM public.discoveries WHERE status = 'confirmed') AS discovered_items
)
SELECT
    t.total_items,
    t.discovered_items,
    GREATEST(0, t.total_items - t.discovered_items) AS remaining_items,
    CASE 
        WHEN t.total_items = 0 THEN 0.0
        ELSE ROUND((t.discovered_items::numeric / t.total_items::numeric) * 100.0, 1)
    END AS world_restored_percentage,
    CASE 
        WHEN t.total_items > 0 AND t.discovered_items >= t.total_items THEN 'RESTORATION COMPLETE'
        WHEN (SELECT status FROM public.event_settings WHERE id = 1) = 'paused' THEN 'PAUSED'
        WHEN (SELECT status FROM public.event_settings WHERE id = 1) = 'closed' THEN 'CLOSED'
        ELSE 'ACTIVE'
    END AS mission_status
FROM total_calc t;

-- View: v_items_by_type (Progress broken down by each of the 5 item categories)
CREATE OR REPLACE VIEW public.v_items_by_type AS
SELECT 
    it.id AS type_id,
    it.code AS type_code,
    it.name AS type_name,
    it.name_en AS type_name_en,
    it.icon,
    it.color,
    it.sort_order,
    COUNT(i.id) AS total_count,
    COUNT(d.id) FILTER (WHERE d.status = 'confirmed') AS discovered_count,
    COUNT(i.id) - COUNT(d.id) FILTER (WHERE d.status = 'confirmed') AS remaining_count,
    CASE 
        WHEN COUNT(i.id) = 0 THEN 0.0
        ELSE ROUND((COUNT(d.id) FILTER (WHERE d.status = 'confirmed')::numeric / COUNT(i.id)::numeric) * 100.0, 1)
    END AS progress_percentage
FROM public.item_types it
LEFT JOIN public.items i ON i.item_type_id = it.id AND i.status != 'disabled'
LEFT JOIN public.discoveries d ON d.item_id = i.id
WHERE it.is_active = true
GROUP BY it.id, it.code, it.name, it.name_en, it.icon, it.color, it.sort_order
ORDER BY it.sort_order ASC;

-- View: v_recent_discoveries (Latest 10 discoveries with privacy masking)
CREATE OR REPLACE VIEW public.v_recent_discoveries AS
SELECT 
    d.id AS discovery_id,
    d.discovered_at,
    d.status,
    d.reward_claimed,
    i.id AS item_id,
    i.item_code,
    i.name AS item_name,
    it.name AS type_name,
    it.icon AS type_icon,
    it.color AS type_color,
    s.id AS student_id,
    s.student_code,
    s.full_name AS student_full_name,
    s.class_name,
    s.department,
    -- Privacy masking logic based on settings
    CASE 
        WHEN (SELECT show_student_name_mode FROM public.event_settings WHERE id = 1) = 'full' THEN COALESCE(s.full_name, d.manual_student_name, 'Anonymous Hunter')
        WHEN (SELECT show_student_name_mode FROM public.event_settings WHERE id = 1) = 'masked' THEN 
            CASE 
                WHEN s.full_name IS NOT NULL THEN 
                    SUBSTRING(s.first_name FROM 1 FOR 2) || '*** ' || SUBSTRING(s.last_name FROM 1 FOR 1) || '***'
                WHEN d.manual_student_name IS NOT NULL THEN 
                    SUBSTRING(d.manual_student_name FROM 1 FOR 3) || '***'
                ELSE 'Hunter #***'
            END
        WHEN (SELECT show_student_name_mode FROM public.event_settings WHERE id = 1) = 'hidden' THEN 'Secret Agent'
        ELSE COALESCE(s.first_name, 'Agent')
    END AS student_display_name,
    p.display_name AS staff_name
FROM public.discoveries d
JOIN public.items i ON d.item_id = i.id
JOIN public.item_types it ON i.item_type_id = it.id
LEFT JOIN public.students s ON d.student_id = s.id
LEFT JOIN public.profiles p ON d.staff_id = p.id
WHERE d.status = 'confirmed'
ORDER BY d.discovered_at DESC
LIMIT 10;

-- 6. ATOMIC DATABASE RPC FUNCTIONS (Concurreny & Race-Condition Safe)

-- RPC: confirm_discovery_atomic
-- Purpose: Guarantees that only ONE staff can claim an item when 2 scan at identical moments.
CREATE OR REPLACE FUNCTION public.confirm_discovery_atomic(
    p_qr_token TEXT,
    p_student_id UUID DEFAULT NULL,
    p_manual_student_name TEXT DEFAULT NULL,
    p_manual_student_code TEXT DEFAULT NULL,
    p_staff_id UUID DEFAULT NULL,
    p_verification_method verification_method DEFAULT 'imported_student',
    p_notes TEXT DEFAULT NULL,
    p_idempotency_key TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_item RECORD;
    v_event_status event_status;
    v_existing_discovery RECORD;
    v_new_discovery_id UUID;
    v_student_name TEXT;
BEGIN
    -- 1. Check Event Status
    SELECT status INTO v_event_status FROM public.event_settings WHERE id = 1;
    IF v_event_status = 'paused' THEN
        INSERT INTO public.discovery_attempts (qr_token, staff_id, attempt_result, error_message)
        VALUES (p_qr_token, p_staff_id, 'EVENT_PAUSED', 'Activity is currently paused by admin');
        RETURN jsonb_build_object('success', false, 'code', 'EVENT_PAUSED', 'message', 'ขณะนี้กิจกรรมหยุดชั่วคราวโดยผู้ดูแลระบบ');
    ELSIF v_event_status = 'closed' THEN
        INSERT INTO public.discovery_attempts (qr_token, staff_id, attempt_result, error_message)
        VALUES (p_qr_token, p_staff_id, 'EVENT_CLOSED', 'Activity is closed');
        RETURN jsonb_build_object('success', false, 'code', 'EVENT_CLOSED', 'message', 'กิจกรรมสิ้นสุดลงแล้ว');
    END IF;

    -- 2. Lookup Item by QR Token (Opaque token)
    SELECT * INTO v_item FROM public.items WHERE qr_token = p_qr_token FOR UPDATE;
    IF NOT FOUND THEN
        INSERT INTO public.discovery_attempts (qr_token, staff_id, attempt_result, error_message)
        VALUES (p_qr_token, p_staff_id, 'INVALID_TOKEN', 'Item QR token is invalid');
        RETURN jsonb_build_object('success', false, 'code', 'INVALID_ITEM', 'message', 'ไม่พบข้อมูลไอเทมนี้ในระบบ หรือ QR Code ไม่ถูกต้อง');
    END IF;

    -- 3. Check if Item is Disabled or Hidden
    IF v_item.status = 'disabled' THEN
        INSERT INTO public.discovery_attempts (qr_token, item_id, staff_id, attempt_result, error_message)
        VALUES (p_qr_token, v_item.id, p_staff_id, 'ITEM_DISABLED', 'Item is disabled');
        RETURN jsonb_build_object('success', false, 'code', 'ITEM_DISABLED', 'message', 'ไอเทมนี้ถูกปิดใช้งาน');
    END IF;

    -- 4. Check if Item is ALREADY DISCOVERED (Atomic lock check)
    SELECT d.*, s.full_name AS student_full_name, p.display_name AS staff_name
    INTO v_existing_discovery
    FROM public.discoveries d
    LEFT JOIN public.students s ON d.student_id = s.id
    LEFT JOIN public.profiles p ON d.staff_id = p.id
    WHERE d.item_id = v_item.id AND d.status = 'confirmed';

    IF FOUND THEN
        INSERT INTO public.discovery_attempts (qr_token, item_id, student_id, staff_id, attempt_result, error_message)
        VALUES (p_qr_token, v_item.id, p_student_id, p_staff_id, 'ALREADY_DISCOVERED', 'Item already claimed');
        
        RETURN jsonb_build_object(
            'success', false,
            'code', 'ALREADY_DISCOVERED',
            'message', 'ไอเทมนี้ถูกค้นพบไปแล้ว!',
            'item_code', v_item.item_code,
            'item_name', v_item.name,
            'discovered_at', v_existing_discovery.discovered_at,
            'discovered_by', COALESCE(v_existing_discovery.student_full_name, v_existing_discovery.manual_student_name, 'Unknown'),
            'verified_by', v_existing_discovery.staff_name
        );
    END IF;

    -- 5. Insert Discovery with Atomic Safety
    BEGIN
        INSERT INTO public.discoveries (
            item_id,
            student_id,
            manual_student_name,
            manual_student_code,
            staff_id,
            verification_method,
            notes,
            idempotency_key,
            status
        ) VALUES (
            v_item.id,
            p_student_id,
            p_manual_student_name,
            p_manual_student_code,
            p_staff_id,
            p_verification_method,
            p_notes,
            p_idempotency_key,
            'confirmed'
        ) RETURNING id INTO v_new_discovery_id;

        -- Update Item Status to 'discovered'
        UPDATE public.items SET status = 'discovered', updated_at = NOW() WHERE id = v_item.id;

        -- Log successful attempt
        INSERT INTO public.discovery_attempts (qr_token, item_id, student_id, staff_id, attempt_result)
        VALUES (p_qr_token, v_item.id, p_student_id, p_staff_id, 'SUCCESS');

        -- Log Audit
        INSERT INTO public.audit_logs (user_id, action, target_type, target_id, metadata)
        VALUES (
            p_staff_id,
            'ITEM_DISCOVERED',
            'discovery',
            v_new_discovery_id::text,
            jsonb_build_object('item_code', v_item.item_code, 'student_id', p_student_id, 'method', p_verification_method)
        );

        -- Get student name for response
        IF p_student_id IS NOT NULL THEN
            SELECT full_name INTO v_student_name FROM public.students WHERE id = p_student_id;
        ELSE
            v_student_name := p_manual_student_name;
        END IF;

        RETURN jsonb_build_object(
            'success', true,
            'code', 'DISCOVERY_CONFIRMED',
            'message', 'บันทึกการค้นพบไอเทมสำเร็จ!',
            'discovery_id', v_new_discovery_id,
            'item_id', v_item.id,
            'item_code', v_item.item_code,
            'item_name', v_item.name,
            'reward_name', v_item.reward_name,
            'student_name', v_student_name,
            'discovered_at', NOW()
        );

    EXCEPTION WHEN unique_violation THEN
        -- Race condition: another concurrent transaction claimed it microseconds earlier!
        RETURN jsonb_build_object(
            'success', false,
            'code', 'ALREADY_DISCOVERED',
            'message', 'ไอเทมนี้เพิ่งถูกยืนยันโดยเจ้าหน้าที่ท่านอื่นไปแล้ว'
        );
    END;
END;
$$;

-- RPC: claim_reward_atomic
CREATE OR REPLACE FUNCTION public.claim_reward_atomic(
    p_discovery_id UUID,
    p_staff_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_discovery RECORD;
BEGIN
    SELECT * INTO v_discovery FROM public.discoveries WHERE id = p_discovery_id FOR UPDATE;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'ไม่พบข้อมูลการค้นพบนี้');
    END IF;

    IF v_discovery.reward_claimed THEN
        RETURN jsonb_build_object('success', false, 'message', 'รางวัลสำหรับไอเทมนี้ถูกแจกไปแล้ว', 'claimed_at', v_discovery.reward_claimed_at);
    END IF;

    UPDATE public.discoveries 
    SET reward_claimed = true, reward_claimed_at = NOW(), reward_given_by = p_staff_id, updated_at = NOW()
    WHERE id = p_discovery_id;

    INSERT INTO public.audit_logs (user_id, action, target_type, target_id, metadata)
    VALUES (p_staff_id, 'REWARD_CLAIMED', 'discovery', p_discovery_id::text, '{}'::jsonb);

    RETURN jsonb_build_object('success', true, 'message', 'บันทึกการมอบรางวัลสำเร็จ!');
END;
$$;

-- 7. ROW LEVEL SECURITY (RLS) POLICIES & ROLE HELPERS
-- Configured for Event Public Read / Staff Scanner / Admin Management

-- Helper function to verify Admin privilege
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin' AND is_active = true
  );
$$;

-- Helper function to verify Staff/Admin privilege
CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'staff') AND is_active = true
  );
$$;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.item_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discoveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discovery_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_errors ENABLE ROW LEVEL SECURITY;

-- 1. Profiles Policies
DROP POLICY IF EXISTS "Public read profiles" ON public.profiles;
DROP POLICY IF EXISTS "User or admin manage profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public access profiles" ON public.profiles;

CREATE POLICY "Public read profiles" ON public.profiles 
  FOR SELECT USING (true);

CREATE POLICY "User or admin insert profile" ON public.profiles 
  FOR INSERT WITH CHECK (id = auth.uid() OR public.is_admin());

CREATE POLICY "User or admin update profile" ON public.profiles 
  FOR UPDATE USING (id = auth.uid() OR public.is_admin());

CREATE POLICY "Admin delete profile" ON public.profiles 
  FOR DELETE USING (public.is_admin());

-- 2. Item Types Policies
DROP POLICY IF EXISTS "Public access item types" ON public.item_types;
CREATE POLICY "Public read item types" ON public.item_types 
  FOR SELECT USING (true);

CREATE POLICY "Admin manage item types" ON public.item_types 
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 3. Items Policies
DROP POLICY IF EXISTS "Public access items" ON public.items;
CREATE POLICY "Public read items" ON public.items 
  FOR SELECT USING (true);

CREATE POLICY "Admin manage items" ON public.items 
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 4. Event Settings Policies
DROP POLICY IF EXISTS "Public access event settings" ON public.event_settings;
CREATE POLICY "Public read event settings" ON public.event_settings 
  FOR SELECT USING (true);

CREATE POLICY "Admin manage event settings" ON public.event_settings 
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 5. Students Policies
DROP POLICY IF EXISTS "Public access students" ON public.students;
CREATE POLICY "Public read students" ON public.students 
  FOR SELECT USING (true);

CREATE POLICY "Staff and admin manage students" ON public.students 
  FOR ALL USING (public.is_staff()) WITH CHECK (public.is_staff());

-- 6. Discoveries Policies
DROP POLICY IF EXISTS "Public access discoveries" ON public.discoveries;
CREATE POLICY "Public read discoveries" ON public.discoveries 
  FOR SELECT USING (true);

CREATE POLICY "Staff and admin claim discoveries" ON public.discoveries 
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Staff and admin update discoveries" ON public.discoveries 
  FOR UPDATE USING (public.is_staff());

CREATE POLICY "Admin delete discoveries" ON public.discoveries 
  FOR DELETE USING (public.is_admin());

-- 7. Discovery Attempts Policies
DROP POLICY IF EXISTS "Public access discovery attempts" ON public.discovery_attempts;
CREATE POLICY "Staff and admin read attempts" ON public.discovery_attempts 
  FOR SELECT USING (public.is_staff());

CREATE POLICY "Insert discovery attempts" ON public.discovery_attempts 
  FOR INSERT WITH CHECK (true);

-- 8. Audit Logs Policies
DROP POLICY IF EXISTS "Public access audit logs" ON public.audit_logs;
CREATE POLICY "Admin read audit logs" ON public.audit_logs 
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Insert audit logs" ON public.audit_logs 
  FOR INSERT WITH CHECK (true);

-- 9. Import Jobs & Errors Policies
DROP POLICY IF EXISTS "Public access import jobs" ON public.import_jobs;
DROP POLICY IF EXISTS "Public access import errors" ON public.import_errors;

CREATE POLICY "Admin manage import jobs" ON public.import_jobs 
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Admin manage import errors" ON public.import_errors 
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 8. REALTIME REPLICATION CONFIGURATION
-- Ensure Postgres triggers publish changes to Supabase Realtime for Dashboard
DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.discoveries;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.items;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.event_settings;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- ==============================================================================
-- BOOTH ACTIVITY CHECK-IN SYSTEM
-- saveptechworld (14 booths × 14 letters)
-- ==============================================================================

-- 9. ADD BOOTH COLUMNS TO EVENT_SETTINGS
ALTER TABLE public.event_settings
    ADD COLUMN IF NOT EXISTS target_word TEXT NOT NULL DEFAULT 'SAVEPTECHWORLD',
    ADD COLUMN IF NOT EXISTS booths_enabled BOOLEAN NOT NULL DEFAULT true;

-- 10. BOOTHS TABLE (Activity Booth Registry)
CREATE TABLE IF NOT EXISTS public.booths (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,                         -- "บูทฟิสิกส์", "บูทเคมี"
    description TEXT,                           -- อธิบายกิจกรรมในบูท
    letter CHAR(1) NOT NULL,                    -- ตัวอักษรประจำบูท เช่น 'S'
    letter_position INT NOT NULL,               -- ตำแหน่งในคำ (0-based), คงที่ตลอด
    icon TEXT NOT NULL DEFAULT '🏛️',
    color TEXT NOT NULL DEFAULT '#3B82F6',
    is_active BOOLEAN NOT NULL DEFAULT true,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(letter_position)                     -- แต่ละตำแหน่งมีได้บูทเดียว
);

-- 11. BOOTH_CHECKINS TABLE (Student per-booth check-in records)
CREATE TABLE IF NOT EXISTS public.booth_checkins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booth_id UUID NOT NULL REFERENCES public.booths(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    staff_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    letter_awarded CHAR(1) NOT NULL,            -- ตัวอักษรที่ได้รับจากบูทนี้
    checked_in_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    notes TEXT,
    UNIQUE(booth_id, student_id)                -- เช็คอินได้ครั้งเดียวต่อบูทต่อนักเรียน
);

-- 12. INDEXES
CREATE INDEX IF NOT EXISTS idx_booths_position ON public.booths(letter_position);
CREATE INDEX IF NOT EXISTS idx_booths_active ON public.booths(is_active);
CREATE INDEX IF NOT EXISTS idx_booth_checkins_student ON public.booth_checkins(student_id);
CREATE INDEX IF NOT EXISTS idx_booth_checkins_booth ON public.booth_checkins(booth_id);
CREATE INDEX IF NOT EXISTS idx_booth_checkins_time ON public.booth_checkins(checked_in_at DESC);

-- 13. RPC: booth_checkin_atomic (Concurrency-safe booth check-in)
CREATE OR REPLACE FUNCTION public.booth_checkin_atomic(
    p_booth_id UUID,
    p_student_id UUID,
    p_staff_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_booth RECORD;
    v_existing RECORD;
    v_event_status TEXT;
    v_new_id UUID;
BEGIN
    -- 1. Check event status
    SELECT status, booths_enabled INTO v_event_status, v_booth.is_active
    FROM public.event_settings WHERE id = 1;

    -- 2. Fetch booth
    SELECT * INTO v_booth FROM public.booths WHERE id = p_booth_id AND is_active = true FOR UPDATE;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'code', 'BOOTH_NOT_FOUND', 'message', 'ไม่พบบูทนี้ในระบบ');
    END IF;

    -- 3. Check if already checked in
    SELECT * INTO v_existing FROM public.booth_checkins
    WHERE booth_id = p_booth_id AND student_id = p_student_id;

    IF FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', 'ALREADY_CHECKEDIN',
            'message', 'นักเรียนเช็คอินบูทนี้แล้ว!',
            'letter', v_booth.letter,
            'booth_name', v_booth.name,
            'checked_in_at', v_existing.checked_in_at
        );
    END IF;

    -- 4. Insert check-in (atomic)
    BEGIN
        INSERT INTO public.booth_checkins (booth_id, student_id, staff_id, letter_awarded)
        VALUES (p_booth_id, p_student_id, p_staff_id, v_booth.letter)
        RETURNING id INTO v_new_id;

        -- Audit log
        INSERT INTO public.audit_logs (user_id, action, target_type, target_id, metadata)
        VALUES (
            p_staff_id,
            'BOOTH_CHECKIN',
            'booth_checkin',
            v_new_id::text,
            jsonb_build_object('booth_id', p_booth_id, 'student_id', p_student_id, 'letter', v_booth.letter)
        );

        RETURN jsonb_build_object(
            'success', true,
            'code', 'CHECKIN_SUCCESS',
            'message', 'เช็คอินสำเร็จ! ได้รับตัวอักษร ' || v_booth.letter,
            'letter', v_booth.letter,
            'letter_position', v_booth.letter_position,
            'booth_name', v_booth.name,
            'checkin_id', v_new_id
        );
    EXCEPTION WHEN unique_violation THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', 'ALREADY_CHECKEDIN',
            'message', 'นักเรียนเช็คอินบูทนี้แล้ว (race condition)',
            'letter', v_booth.letter
        );
    END;
END;
$$;

-- 14. RLS POLICIES FOR BOOTHS AND BOOTH_CHECKINS
ALTER TABLE public.booths ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booth_checkins ENABLE ROW LEVEL SECURITY;

-- Booths: anyone can read, only admin can write
CREATE POLICY "Public read booths" ON public.booths
    FOR SELECT USING (true);
CREATE POLICY "Admin manage booths" ON public.booths
    FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Booth checkins: public read, staff can insert
CREATE POLICY "Public read booth checkins" ON public.booth_checkins
    FOR SELECT USING (true);
CREATE POLICY "Staff insert booth checkins" ON public.booth_checkins
    FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin manage booth checkins" ON public.booth_checkins
    FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 15. REALTIME FOR BOOTH CHECKINS
DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.booth_checkins;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
