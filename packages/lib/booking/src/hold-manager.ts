import { z } from 'zod';
import type { AppointmentRepository } from '@chatbot/db';

export interface HoldManagerConfig {
  defaultHoldDurationMinutes: number;
  maxHoldDurationMinutes: number;
  cleanupIntervalMinutes: number;
}

export interface ActiveHold {
  appointmentId: string;
  tenantId: string;
  customerId: string;
  start: Date;
  end: Date;
  expiresAt: Date;
}

export const HoldManagerConfigSchema = z.object({
  defaultHoldDurationMinutes: z.number().int().positive().default(5),
  maxHoldDurationMinutes: z.number().int().positive().default(30),
  cleanupIntervalMinutes: z.number().int().positive().default(1),
});

export class HoldManager {
  private config: HoldManagerConfig;
  private appointmentRepo: AppointmentRepository;
  private cleanupTimer?: NodeJS.Timeout;

  constructor(appointmentRepo: AppointmentRepository, config?: Partial<HoldManagerConfig>) {
    this.appointmentRepo = appointmentRepo;
    this.config = HoldManagerConfigSchema.parse(config || {});
  }

  /**
   * Start automatic cleanup of expired holds
   */
  startCleanup(): void {
    if (this.cleanupTimer) {
      this.stopCleanup();
    }

    this.cleanupTimer = setInterval(
      () => this.cleanupExpiredHolds(),
      this.config.cleanupIntervalMinutes * 60 * 1000
    );

    console.log(`Hold cleanup started, running every ${this.config.cleanupIntervalMinutes} minutes`);
  }

  /**
   * Stop automatic cleanup
   */
  stopCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
      console.log('Hold cleanup stopped');
    }
  }

  /**
   * Manually trigger cleanup of expired holds
   */
  async cleanupExpiredHolds(): Promise<number> {
    try {
      // This calls the PostgreSQL function that updates expired appointments
      const db = (this.appointmentRepo as any).db;
      const { data, error } = await db.rpc('clean_expired_appointments');
      
      if (error) {
        console.error('Failed to cleanup expired holds:', error);
        return 0;
      }

      const expiredCount = data || 0;
      if (expiredCount > 0) {
        console.log(`Cleaned up ${expiredCount} expired holds`);
      }

      return expiredCount;
    } catch (error) {
      console.error('Failed to cleanup expired holds:', error);
      return 0;
    }
  }

  /**
   * Check if a hold is still valid (not expired)
   */
  async isHoldValid(tenantId: string, appointmentId: string): Promise<boolean> {
    try {
      // Query the appointment and check its status and expiration
      const db = (this.appointmentRepo as any).db;
      await (this.appointmentRepo as any).withTenant(tenantId, async () => {
        const { data, error } = await db
          .from('appointments')
          .select('status, expires_at')
          .eq('id', appointmentId)
          .single();

        if (error || !data) {
          return false;
        }

        // Check if it's still pending and not expired
        if (data.status !== 'pending') {
          return false;
        }

        if (data.expires_at && new Date(data.expires_at) <= new Date()) {
          return false;
        }

        return true;
      });

      return false; // Default to false for safety
    } catch {
      return false;
    }
  }

  /**
   * Extend a hold's expiration time
   */
  async extendHold(
    tenantId: string,
    appointmentId: string,
    additionalMinutes: number
  ): Promise<boolean> {
    if (additionalMinutes > this.config.maxHoldDurationMinutes) {
      throw new Error(`Cannot extend hold beyond ${this.config.maxHoldDurationMinutes} minutes`);
    }

    try {
      const newExpiresAt = new Date();
      newExpiresAt.setMinutes(newExpiresAt.getMinutes() + additionalMinutes);

      const db = (this.appointmentRepo as any).db;
      await (this.appointmentRepo as any).withTenant(tenantId, async () => {
        const { error } = await db
          .from('appointments')
          .update({ expires_at: newExpiresAt.toISOString() })
          .eq('id', appointmentId)
          .eq('status', 'pending');

        if (error) {
          throw new Error(`Failed to extend hold: ${error.message}`);
        }
      });

      return true;
    } catch (error) {
      console.error('Failed to extend hold:', error);
      return false;
    }
  }

  /**
   * Release a hold manually (mark as expired)
   */
  async releaseHold(tenantId: string, appointmentId: string): Promise<boolean> {
    try {
      await this.appointmentRepo.updateStatus(tenantId, appointmentId, 'expired');
      return true;
    } catch (error) {
      console.error('Failed to release hold:', error);
      return false;
    }
  }

  /**
   * Get all active holds for a tenant
   */
  async getActiveHolds(tenantId: string): Promise<ActiveHold[]> {
    try {
      const db = (this.appointmentRepo as any).db;
      const holds: ActiveHold[] = [];

      await (this.appointmentRepo as any).withTenant(tenantId, async () => {
        const { data, error } = await db
          .from('appointments')
          .select('id, customer_id, start_ts, end_ts, expires_at')
          .eq('status', 'pending')
          .gt('expires_at', new Date().toISOString())
          .order('start_ts');

        if (error) {
          throw new Error(`Failed to get active holds: ${error.message}`);
        }

        for (const row of data || []) {
          holds.push({
            appointmentId: row.id,
            tenantId,
            customerId: row.customer_id,
            start: new Date(row.start_ts),
            end: new Date(row.end_ts),
            expiresAt: new Date(row.expires_at),
          });
        }
      });

      return holds;
    } catch (error) {
      console.error('Failed to get active holds:', error);
      return [];
    }
  }

  /**
   * Get hold statistics for monitoring
   */
  async getHoldStats(tenantId: string): Promise<{
    activeHolds: number;
    expiredToday: number;
    averageHoldDuration: number;
  }> {
    try {
      const db = (this.appointmentRepo as any).db;
      let stats = { activeHolds: 0, expiredToday: 0, averageHoldDuration: 0 };

      await (this.appointmentRepo as any).withTenant(tenantId, async () => {
        // Count active holds
        const { data: activeData } = await db
          .from('appointments')
          .select('id', { count: 'exact' })
          .eq('status', 'pending')
          .gt('expires_at', new Date().toISOString());

        stats.activeHolds = activeData?.length || 0;

        // Count expired today
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const { data: expiredData } = await db
          .from('appointments')
          .select('id', { count: 'exact' })
          .eq('status', 'expired')
          .gte('created_at', todayStart.toISOString());

        stats.expiredToday = expiredData?.length || 0;

        // Calculate average hold duration (placeholder)
        stats.averageHoldDuration = this.config.defaultHoldDurationMinutes;
      });

      return stats;
    } catch (error) {
      console.error('Failed to get hold stats:', error);
      return { activeHolds: 0, expiredToday: 0, averageHoldDuration: 0 };
    }
  }

  /**
   * Cleanup method to call before shutting down
   */
  destroy(): void {
    this.stopCleanup();
  }
}

// Utility functions
export function formatHoldExpiration(expiresAt: Date, locale: string = 'es-ES'): string {
  const now = new Date();
  const diffMinutes = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60));

  if (diffMinutes <= 0) {
    return locale === 'es-ES' ? 'Expirado' : 'Expired';
  }

  if (diffMinutes === 1) {
    return locale === 'es-ES' ? '1 minuto' : '1 minute';
  }

  return locale === 'es-ES' ? `${diffMinutes} minutos` : `${diffMinutes} minutes`;
}

export function isHoldExpiringSoon(expiresAt: Date, warningMinutes: number = 2): boolean {
  const now = new Date();
  const diffMinutes = (expiresAt.getTime() - now.getTime()) / (1000 * 60);
  return diffMinutes <= warningMinutes && diffMinutes > 0;
}
