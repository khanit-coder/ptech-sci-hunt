import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export interface CardTemplateItem {
  id: string;
  name: string;
  config: any;
  created_at: string;
  updated_at?: string;
}

const STORAGE_KEY = 'ptech_card_print_templates_online_v1';

class CardTemplateService {
  /**
   * Fetch all saved card print templates (Online Supabase + LocalStorage fallback)
   */
  async getTemplates(): Promise<CardTemplateItem[]> {
    let cloudTemplates: CardTemplateItem[] = [];

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('card_templates')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data) {
          cloudTemplates = data.map((d: any) => ({
            id: d.id,
            name: d.name,
            config: d.config,
            created_at: d.created_at || new Date().toISOString(),
            updated_at: d.updated_at,
          }));
        }
      } catch (err) {
        console.warn('Supabase fetch card_templates error, using local fallback:', err);
      }
    }

    // LocalStorage fallback
    let localTemplates: CardTemplateItem[] = [];
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) localTemplates = JSON.parse(saved);
    } catch {
      localTemplates = [];
    }

    // Combine cloud and local templates by ID without duplicates
    const map = new Map<string, CardTemplateItem>();
    localTemplates.forEach(t => map.set(t.id, t));
    cloudTemplates.forEach(t => map.set(t.id, t)); // Cloud takes priority

    const merged = Array.from(map.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    // Sync merged back to local storage
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    } catch { /* ignore quota issues */ }

    return merged;
  }

  /**
   * Save a new template online (Supabase) + LocalStorage
   */
  async saveTemplate(name: string, config: any): Promise<CardTemplateItem> {
    const newId = 'tpl_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now();
    const now = new Date().toISOString();

    const newItem: CardTemplateItem = {
      id: newId,
      name: name.trim(),
      config,
      created_at: now,
      updated_at: now,
    };

    // Save to Supabase Cloud if connected
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('card_templates')
          .insert([
            {
              name: name.trim(),
              config,
            },
          ])
          .select()
          .single();

        if (!error && data) {
          newItem.id = data.id;
          newItem.created_at = data.created_at;
        }
      } catch (err) {
        console.warn('Supabase save card_templates error, saving locally:', err);
      }
    }

    // Save to LocalStorage
    try {
      const existing = await this.getTemplates();
      const updated = [newItem, ...existing.filter(e => e.id !== newItem.id)];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch { /* ignore */ }

    return newItem;
  }

  /**
   * Delete a template by ID (Online Supabase + LocalStorage)
   */
  async deleteTemplate(id: string): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('card_templates').delete().eq('id', id);
      } catch (err) {
        console.warn('Supabase delete card_templates error:', err);
      }
    }

    try {
      const existing = await this.getTemplates();
      const filtered = existing.filter(t => t.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    } catch { /* ignore */ }

    return true;
  }
}

export const cardTemplateService = new CardTemplateService();
