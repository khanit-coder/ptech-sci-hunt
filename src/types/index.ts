// ==============================================================================
// PTECH-Sci : Secret Item Hunt - TypeScript Definitions
// ==============================================================================

export type UserRole = 'admin' | 'staff' | 'viewer';
export type ItemStatus = 'active' | 'discovered' | 'disabled' | 'hidden';
export type EventStatus = 'open' | 'paused' | 'closed';
export type DiscoveryStatus = 'confirmed' | 'revoked' | 'correction_requested';
export type VerificationMethod = 'external_qr' | 'student_id' | 'manual_name' | 'imported_student';
export type StudentNameDisplayMode = 'full' | 'masked' | 'nickname' | 'hidden';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  display_name: string;
  role: UserRole;
  is_active: boolean;
  last_login_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ItemType {
  id: string;
  code: string; // 'STAR', 'BIO', 'THERMO', 'HYDRO', 'WARP'
  name: string; // 'STAR CORE'
  name_en: string; // 'Recovery Energy Core'
  description?: string;
  icon: string; // '⭐' or emoji/icon name
  color: string; // '#FFD700'
  sort_order: number;
  is_active: boolean;
  total_count?: number;
  discovered_count?: number;
  remaining_count?: number;
  progress_percentage?: number;
  discoveries_list?: RecentDiscoveryItem[];
  created_at?: string;
  updated_at?: string;
}

export interface Item {
  id: string;
  item_code: string; // 'STAR-001'
  name: string; // 'STAR CORE #01 - Alpha Prism'
  item_type_id: string;
  item_type?: ItemType;
  qr_token: string; // Opaque secret token in QR code
  status: ItemStatus;
  location_hint?: string;
  hint?: string;
  description?: string;
  image_url?: string;
  reward_name?: string;
  reward_quantity?: number;
  reward_notes?: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
  // Discovered metadata when joined
  discovered_at?: string;
  discovered_by_name?: string;
}

export interface Student {
  id: string;
  student_code: string;
  first_name: string;
  last_name: string;
  full_name: string;
  class_name?: string;
  department?: string;
  level?: string;
  student_status?: 'active' | 'external' | 'disabled' | string;
  external_id?: string;
  phone?: string;
  school_name?: string;
  nickname?: string;
  qr_token?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface RegisterExternalStudentInput {
  qr_token: string;
  first_name: string;
  last_name: string;
  nickname?: string;
  school_name?: string;
  level?: string;
  class_name?: string;
  department?: string;
  phone?: string;
  student_code?: string;
  notes?: string;
}

export interface Discovery {
  id: string;
  item_id: string;
  item?: Item;
  student_id?: string;
  student?: Student;
  manual_student_name?: string;
  manual_student_code?: string;
  staff_id?: string;
  staff_profile?: Profile;
  verification_method: VerificationMethod;
  discovered_at: string;
  status: DiscoveryStatus;
  reward_claimed: boolean;
  reward_claimed_at?: string;
  reward_given_by?: string;
  notes?: string;
  correction_note?: string;
  idempotency_key?: string;
  created_at: string;
  updated_at: string;
}

export interface RecentDiscoveryItem {
  discovery_id: string;
  discovered_at: string;
  status: DiscoveryStatus;
  reward_claimed: boolean;
  item_id: string;
  item_code: string;
  item_name: string;
  type_name: string;
  type_icon: string;
  type_color: string;
  student_id?: string;
  student_code?: string;
  student_full_name?: string;
  student_display_name: string;
  class_name?: string;
  department?: string;
  staff_name?: string;
}

export interface EventSettings {
  id: number;
  event_name: string;
  tagline: string;
  status: EventStatus;
  start_time?: string;
  end_time?: string;
  total_items_override?: number | null;
  dashboard_title: string;
  dashboard_subtitle: string;
  show_student_name_mode: StudentNameDisplayMode;
  sound_enabled: boolean;
  animation_enabled: boolean;
  celebration_enabled: boolean;
  show_recent_discoveries: boolean;
  show_item_hints: boolean;
  maintenance_mode: boolean;
  glitch_effect_enabled?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface DashboardStats {
  total_items: number;
  discovered_items: number;
  remaining_items: number;
  world_restored_percentage: number;
  mission_status: 'ACTIVE' | 'PAUSED' | 'CLOSED' | 'RESTORATION COMPLETE';
}

export interface AuditLog {
  id: string;
  user_id?: string;
  user_email?: string;
  user_name?: string;
  action: string;
  target_type?: string;
  target_id?: string;
  metadata: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface ImportPreviewRow {
  row_number: number;
  student_code: string;
  first_name: string;
  last_name: string;
  class_name?: string;
  department?: string;
  level?: string;
  is_valid: boolean;
  error?: string;
}

export interface SystemHealthStatus {
  database: 'online' | 'degraded' | 'offline';
  realtime: 'online' | 'degraded' | 'offline';
  student_api: 'online' | 'degraded' | 'offline';
  auth: 'online' | 'degraded' | 'offline';
  storage: 'online' | 'degraded' | 'offline';
  latency_ms: number;
  checked_at: string;
}
