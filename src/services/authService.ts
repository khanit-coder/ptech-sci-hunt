import { Profile, UserRole } from '@/types';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

// Mock users for offline / local demo mode
const MOCK_PROFILES: (Profile & { username: string })[] = [
  {
    id: 'user_admin_01',
    email: 'admin@ptech.ac.th',
    username: 'admin',
    full_name: 'อาจารย์ผู้ดูแลระบบ PTECH',
    display_name: 'Admin Commander',
    role: 'admin',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'user_staff_01',
    email: 'staff@ptech.ac.th',
    username: 'staff',
    full_name: 'เจ้าหน้าที่จุดเช็คอิน โดม 1',
    display_name: 'Staff Point #01',
    role: 'staff',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'user_viewer_01',
    email: 'viewer@ptech.ac.th',
    username: 'viewer',
    full_name: 'จอแสดงผล LED Main Stage',
    display_name: 'LED Viewer',
    role: 'viewer',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

class AuthService {
  private currentProfile: Profile | null = null;
  private listeners: ((profile: Profile | null) => void)[] = [];

  constructor() {
    // Restore session from localStorage if in mock mode
    const saved = localStorage.getItem('ptech_auth_profile');
    if (saved) {
      try {
        this.currentProfile = JSON.parse(saved);
      } catch {
        this.currentProfile = null;
      }
    } else {
      this.currentProfile = null;
    }
  }

  public getProfile(): Profile | null {
    return this.currentProfile;
  }

  public subscribe(callback: (profile: Profile | null) => void) {
    this.listeners.push(callback);
    callback(this.currentProfile);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l(this.currentProfile));
  }

  async getCurrentUser(): Promise<Profile | null> {
    if (isSupabaseConfigured && supabase) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profile) {
        this.currentProfile = profile as Profile;
        return this.currentProfile;
      }
    }
    return this.currentProfile;
  }

  async login(usernameOrEmail: string, password?: string): Promise<{ success: boolean; profile?: Profile; error?: string }> {
    const input = usernameOrEmail.trim().toLowerCase();
    if (!input) {
      return { success: false, error: 'กรุณากรอกชื่อผู้ใช้ (Username)' };
    }

    if (isSupabaseConfigured && supabase && password) {
      const email = input.includes('@') ? input : `${input}@ptech.ac.th`;
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (!error && data.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (profile) {
          this.currentProfile = profile as Profile;
          localStorage.setItem('ptech_auth_profile', JSON.stringify(this.currentProfile));
          this.notify();
          return { success: true, profile: this.currentProfile };
        } else {
          // Auto create missing profile row in Supabase
          const isAdm = input.startsWith('admin') || input.includes('admin') || email.startsWith('admin');
          const newProfile: Profile = {
            id: data.user.id,
            email: data.user.email || email,
            full_name: isAdm ? 'อาจารย์ผู้ดูแลระบบ PTECH' : 'เจ้าหน้าที่จุดเช็คอิน PTECH',
            display_name: isAdm ? 'Admin Commander' : 'Staff Checkpoint',
            role: isAdm ? 'admin' : 'staff',
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          await supabase.from('profiles').insert(newProfile);
          this.currentProfile = newProfile;
          localStorage.setItem('ptech_auth_profile', JSON.stringify(this.currentProfile));
          this.notify();
          return { success: true, profile: this.currentProfile };
        }
      }
    }

    // Match predefined local accounts by username, email, or role
    const found = MOCK_PROFILES.find((p) => 
      p.username.toLowerCase() === input || 
      p.email.toLowerCase() === input ||
      (input === 'admin' && p.role === 'admin') ||
      (input === 'staff' && p.role === 'staff') ||
      (input === 'viewer' && p.role === 'viewer')
    );

    if (found) {
      this.currentProfile = found;
      localStorage.setItem('ptech_auth_profile', JSON.stringify(this.currentProfile));
      this.notify();
      return { success: true, profile: this.currentProfile };
    }

    // Dynamic mock user for custom entered username
    const isAdm = input.startsWith('admin') || input.includes('admin');
    const isStf = input.startsWith('staff') || input.includes('staff');
    const role: UserRole = isAdm ? 'admin' : isStf ? 'staff' : 'staff';

    const dynamicProfile: Profile = {
      id: 'usr_' + Math.random().toString(36).substring(2, 9),
      email: input.includes('@') ? input : `${input}@ptech.ac.th`,
      full_name: isAdm ? `Admin (${input})` : `Staff (${input})`,
      display_name: isAdm ? `Admin: ${input}` : `Staff: ${input}`,
      role,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.currentProfile = dynamicProfile;
    localStorage.setItem('ptech_auth_profile', JSON.stringify(this.currentProfile));
    this.notify();
    return { success: true, profile: this.currentProfile };
  }

  async logout(): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    this.currentProfile = null;
    localStorage.removeItem('ptech_auth_profile');
    this.notify();
  }

  public switchRole(role: UserRole) {
    const p = MOCK_PROFILES.find((x) => x.role === role) || MOCK_PROFILES[0];
    this.currentProfile = p;
    localStorage.setItem('ptech_auth_profile', JSON.stringify(this.currentProfile));
    this.notify();
  }
}

export const authService = new AuthService();
