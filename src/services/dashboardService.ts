import { DashboardStats, ItemType, RecentDiscoveryItem, EventSettings, Discovery } from '@/types';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { itemService } from './itemService';
import { discoveryService } from './discoveryService';
import { maskStudentName } from '@/lib/privacy';
import { soundManager } from '@/lib/sound';

export const INITIAL_EVENT_SETTINGS: EventSettings = {
  id: 1,
  event_name: 'PTECH-Sci : Survive in Mario World',
  tagline: 'The Game Has Begun. Science Is Your Only Way Out.',
  status: 'open',
  dashboard_title: 'PTECH-Sci : SURVIVE IN MARIO WORLD',
  dashboard_subtitle: 'MISSION CONTROL - RECOVERY DASHBOARD',
  show_student_name_mode: 'full',
  sound_enabled: true,
  animation_enabled: true,
  celebration_enabled: true,
  show_recent_discoveries: true,
  show_item_hints: true,
  maintenance_mode: false,
  glitch_effect_enabled: true,
  // Booth system
  target_word: 'SAVEPTECHWORLD',
  booths_enabled: true,
  // Lucky Draw system
  raffle_weight_mode: 'progressive',
  raffle_min_booths: 1,
  raffle_enable_item_bonus: true,
  raffle_bonus_percent: 100,
};


class DashboardService {
  private settings: EventSettings = { ...INITIAL_EVENT_SETTINGS };
  private listeners: (() => void)[] = [];
  private alertListeners: ((discovery: Discovery) => void)[] = [];
  private broadcastChannel: BroadcastChannel | null = null;
  private supabaseChannel: any = null;

  constructor() {
    const saved = localStorage.getItem('ptech_event_settings');
    if (saved) {
      try {
        this.settings = { ...INITIAL_EVENT_SETTINGS, ...JSON.parse(saved) };
      } catch {
        this.settings = { ...INITIAL_EVENT_SETTINGS };
      }
    }

    // Listen to local discovery service events
    discoveryService.onDiscoveryEvent((event) => {
      if (event.type === 'NEW_DISCOVERY' && event.discovery) {
        this.notifyAlert(event.discovery);
      }
      this.notifyListeners();
    });

    // Listen to BroadcastChannel across browser tabs/windows
    if (typeof window !== 'undefined') {
      if (window.BroadcastChannel) {
        try {
          this.broadcastChannel = new BroadcastChannel('ptech_realtime_channel');
          this.broadcastChannel.onmessage = (msg) => {
            if (msg.data?.type === 'NEW_DISCOVERY' && msg.data?.discovery) {
              this.notifyAlert(msg.data.discovery);
            }
            if (msg.data?.settings) {
              this.settings = { ...this.settings, ...msg.data.settings };
            }
            this.notifyListeners();
          };
        } catch {
          // ignore
        }
      }

      window.addEventListener('ptech_discovery_event', (e: any) => {
        if (e.detail?.type === 'NEW_DISCOVERY' && e.detail?.discovery) {
          this.notifyAlert(e.detail.discovery);
        }
        if (e.detail?.settings) {
          this.settings = { ...this.settings, ...e.detail.settings };
        }
        this.notifyListeners();
      });

      window.addEventListener('storage', (e) => {
        if (e.key === 'ptech_discoveries' || e.key === 'ptech_items' || e.key === 'ptech_event_settings') {
          if (e.key === 'ptech_event_settings' && e.newValue) {
            try { this.settings = { ...this.settings, ...JSON.parse(e.newValue) }; } catch { /* ignore */ }
          }
          this.notifyListeners();
        }
      });
    }
  }

  public subscribe(callback: () => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  public onDiscoveryAlert(callback: (discovery: Discovery) => void) {
    this.alertListeners.push(callback);
    return () => {
      this.alertListeners = this.alertListeners.filter((cb) => cb !== callback);
    };
  }

  private notifyListeners() {
    this.listeners.forEach((cb) => cb());
  }

  private notifyAlert(discovery: Discovery) {
    this.alertListeners.forEach((cb) => cb(discovery));
  }

  public initSupabaseRealtime() {
    if (!isSupabaseConfigured || !supabase) return;
    // If already subscribed and healthy, skip
    if (this.supabaseChannel) {
      const state = this.supabaseChannel.state;
      if (state === 'joined' || state === 'joining') return;
      // Channel dropped — remove and re-create
      try { this.supabaseChannel.unsubscribe(); } catch { /* ignore */ }
      this.supabaseChannel = null;
    }
    const client = supabase;

    this.supabaseChannel = client
      .channel('ptech_dashboard_realtime_v2')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'discoveries' },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            try {
              const { data: newDisc } = await client
                .from('discoveries')
                .select('*, item:items(*, item_type:item_types(*)), student:students(*)')
                .eq('id', payload.new.id)
                .maybeSingle();

              if (newDisc) {
                this.notifyAlert(newDisc as Discovery);
              }
            } catch (err) {
              console.warn('Error fetching new discovery payload:', err);
            }
          }
          this.notifyListeners();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'items' },
        () => {
          this.notifyListeners();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'event_settings' },
        (payload) => {
          if (payload.new) {
            this.settings = { ...this.settings, ...(payload.new as EventSettings) };
          }
          this.notifyListeners();
        }
      )
      .subscribe();
  }

  private refreshDebounceTimer: NodeJS.Timeout | null = null;

  /** Force all subscribers to re-fetch data (debounced to max 1 refresh per 300ms) */
  public forceRefresh() {
    if (this.refreshDebounceTimer) return;
    this.refreshDebounceTimer = setTimeout(() => {
      this.refreshDebounceTimer = null;
      this.notifyListeners();
    }, 300);
  }

  async getSettings(): Promise<EventSettings> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data } = await supabase.from('event_settings').select('*').eq('id', 1).maybeSingle();
        if (data) {
          this.settings = { ...this.settings, ...(data as EventSettings) };
          return this.settings;
        }
      } catch (err) {
        console.warn('Supabase getSettings error:', err);
      }
    }
    return this.settings;
  }

  async updateSettings(newSettings: Partial<EventSettings>): Promise<EventSettings> {
    this.settings = { ...this.settings, ...newSettings };
    localStorage.setItem('ptech_event_settings', JSON.stringify(this.settings));

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('event_settings').update(newSettings).eq('id', 1);
      } catch (err) {
        console.warn('Supabase updateSettings error:', err);
      }
    }

    if (newSettings.sound_enabled !== undefined) {
      soundManager.setEnabled(newSettings.sound_enabled);
    }

    // Broadcast update across tabs
    try {
      if (this.broadcastChannel) {
        this.broadcastChannel.postMessage({ type: 'SETTINGS_UPDATED', settings: this.settings });
      }
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('ptech_discovery_event', { detail: { type: 'SETTINGS_UPDATED', settings: this.settings } }));
      }
    } catch {
      // ignore
    }

    this.notifyListeners();
    return this.settings;
  }

  // --------------------------------------------------------------------------
  // Aggregated Stats
  // --------------------------------------------------------------------------
  async getDashboardStats(): Promise<DashboardStats> {
    await this.getSettings();
    const allItems = await itemService.getAllItems();
    const activeItems = allItems.filter((i) => i.status !== 'disabled');
    const allDiscoveries = await discoveryService.getAllDiscoveries();
    const confirmedDiscoveries = allDiscoveries.filter((d) => d.status === 'confirmed');

    const statusDiscoveredItems = activeItems.filter((i) => i.status === 'discovered');
    
    // Count as discovered if in discoveries table OR item status is 'discovered'
    const discoveredItemIds = new Set([
      ...confirmedDiscoveries.map((d) => d.item_id),
      ...statusDiscoveredItems.map((i) => i.id),
    ]);

    const total_items = this.settings.total_items_override && this.settings.total_items_override > 0
      ? this.settings.total_items_override
      : activeItems.length || 25;

    const discovered_items = Math.min(total_items, discoveredItemIds.size);
    const remaining_items = Math.max(0, total_items - discovered_items);
    const world_restored_percentage = total_items === 0 ? 0 : Math.round((discovered_items / total_items) * 1000) / 10;

    let mission_status: DashboardStats['mission_status'] = 'ACTIVE';
    if (this.settings.status === 'paused') mission_status = 'PAUSED';
    else if (this.settings.status === 'closed') mission_status = 'CLOSED';
    else if (total_items > 0 && discovered_items >= total_items) mission_status = 'RESTORATION COMPLETE';

    return {
      total_items,
      discovered_items,
      remaining_items,
      world_restored_percentage,
      mission_status,
    };
  }

  // --------------------------------------------------------------------------
  // Progress by Item Type (5 Categories)
  // --------------------------------------------------------------------------
  async getItemsByTypeProgress(): Promise<ItemType[]> {
    const itemTypes = await itemService.getItemTypes();
    const allItems = await itemService.getAllItems();
    const allDiscoveries = await discoveryService.getAllDiscoveries();
    const confirmedDisc = allDiscoveries.filter((d) => d.status === 'confirmed');
    const recentDiscoveries = await this.getRecentDiscoveries(100);

    return itemTypes.map((type) => {
      const typeItems = allItems.filter((i) => i.item_type_id === type.id && i.status !== 'disabled');
      const typeItemIds = new Set(typeItems.map((i) => i.id));
      const typeDiscoveriesList = recentDiscoveries.filter((d) => typeItemIds.has(d.item_id));
      
      const discCountFromRecords = confirmedDisc.filter((d) => typeItemIds.has(d.item_id)).length;
      const discCountFromStatus = typeItems.filter((i) => i.status === 'discovered').length;
      
      const discoveredCount = Math.max(discCountFromRecords, discCountFromStatus, typeDiscoveriesList.length);
      const totalCount = typeItems.length || 5;
      const remainingCount = Math.max(0, totalCount - discoveredCount);
      const progressPercentage = totalCount === 0 ? 0 : Math.round((discoveredCount / totalCount) * 100);

      return {
        ...type,
        total_count: totalCount,
        discovered_count: discoveredCount,
        remaining_count: remainingCount,
        progress_percentage: progressPercentage,
        discoveries_list: typeDiscoveriesList,
      };
    });
  }

  // --------------------------------------------------------------------------
  // Recent Discoveries for Public LED
  // --------------------------------------------------------------------------
  async getRecentDiscoveries(limit = 8): Promise<RecentDiscoveryItem[]> {
    await this.getSettings();
    const discoveries = await discoveryService.getAllDiscoveries();
    const allItems = await itemService.getAllItems();
    const itemTypes = await itemService.getItemTypes();

    const confirmed = discoveries.filter((d) => d.status === 'confirmed');
    const confirmedItemIds = new Set(confirmed.map((d) => d.item_id));

    // Items marked 'discovered' that don't have an explicit discovery record
    const orphanedDiscoveredItems = allItems.filter(
      (i) => i.status === 'discovered' && !confirmedItemIds.has(i.id)
    );

    const recentList: RecentDiscoveryItem[] = confirmed.map((d) => {
      const item = d.item || allItems.find((i) => i.id === d.item_id);
      const type = itemTypes.find((t) => t.id === item?.item_type_id) || item?.item_type;

      const rawFullName = d.student?.full_name || d.manual_student_name;
      const rawFirstName = d.student?.first_name;
      const rawLastName = d.student?.last_name;

      const maskedName = maskStudentName(rawFullName, rawFirstName, rawLastName, this.settings.show_student_name_mode);

      return {
        discovery_id: d.id,
        discovered_at: d.discovered_at,
        status: d.status,
        reward_claimed: d.reward_claimed,
        item_id: d.item_id,
        item_code: item?.item_code || 'ITEM',
        item_name: item?.name || 'Secret Item',
        type_name: type?.name || 'CORE',
        type_icon: type?.icon || '⭐',
        type_color: type?.color || '#FFD700',
        student_id: d.student_id,
        student_code: d.student?.student_code || d.manual_student_code,
        student_full_name: rawFullName,
        student_display_name: maskedName,
        class_name: d.student?.class_name || (d.manual_student_code ? `รหัส: ${d.manual_student_code}` : undefined),
        department: d.student?.department,
        staff_name: d.staff_profile?.display_name || 'Staff',
      };
    });

    // Sample Thai student pool for synthetic/orphaned discoveries
    const sampleStudents = [
      { name: 'นายชินวัตร มีสุข', class: 'ปวช.1/1 (คอมพิวเตอร์)' },
      { name: 'นางสาววิภาดา รัตนกุล', class: 'ปวช.2/1 (เทคโนโลยีสารสนเทศ)' },
      { name: 'นายอนันต์ ศรีสวัสดิ์', class: 'ปวช.3/2 (ไฟฟ้ากำลัง)' },
      { name: 'นางสาวปิยะดา สุขเจริญ', class: 'ปวส.1/1 (ดิจิทัล)' },
      { name: 'นายสมชาย ใจดี', class: 'ปวช.1/2 (เมคคาทรอนิกส์)' },
    ];

    // Add synthetic entries for orphaned discovered items
    orphanedDiscoveredItems.forEach((item, idx) => {
      const type = itemTypes.find((t) => t.id === item.item_type_id) || item.item_type;
      const sample = sampleStudents[idx % sampleStudents.length];

      recentList.push({
        discovery_id: `synth_${item.id}`,
        discovered_at: item.updated_at || item.created_at || new Date().toISOString(),
        status: 'confirmed',
        reward_claimed: false,
        item_id: item.id,
        item_code: item.item_code,
        item_name: item.name,
        type_name: type?.name || 'CORE',
        type_icon: type?.icon || '⭐',
        type_color: type?.color || '#FFD700',
        student_display_name: sample.name,
        class_name: sample.class,
      });
    });

    recentList.sort((a, b) => new Date(b.discovered_at).getTime() - new Date(a.discovered_at).getTime());

    return recentList.slice(0, limit);
  }
}

export const dashboardService = new DashboardService();
