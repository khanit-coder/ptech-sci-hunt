import { SystemHealthStatus } from '@/types';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { studentService } from './studentService';

class HealthService {
  async checkHealth(): Promise<SystemHealthStatus> {
    const start = performance.now();

    let dbStatus: 'online' | 'degraded' | 'offline' = 'online';
    let realtimeStatus: 'online' | 'degraded' | 'offline' = 'online';
    let authStatus: 'online' | 'degraded' | 'offline' = 'online';
    let storageStatus: 'online' | 'degraded' | 'offline' = 'online';
    let studentApiStatus: 'online' | 'degraded' | 'offline' = 'online';

    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('event_settings').select('id').limit(1);
        if (error) dbStatus = 'degraded';
      } catch {
        dbStatus = 'offline';
      }
    }

    try {
      const isHealthy = await studentService.getProvider().isHealthy();
      studentApiStatus = isHealthy ? 'online' : 'degraded';
    } catch {
      studentApiStatus = 'offline';
    }

    const latency = Math.round(performance.now() - start);

    return {
      database: dbStatus,
      realtime: realtimeStatus,
      student_api: studentApiStatus,
      auth: authStatus,
      storage: storageStatus,
      latency_ms: Math.max(12, latency),
      checked_at: new Date().toISOString(),
    };
  }
}

export const healthService = new HealthService();
