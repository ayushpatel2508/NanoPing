import prisma from "../config/prisma.js";

export interface Monitor {
  id: string;
  user_id: string;
  name: string;
  url: string;
  check_interval: number;
  alert_threshold: number;
  is_active: boolean;
  last_status: string | null;
  last_checked: Date | null;
  consecutive_failures: number;
  created_at: Date;
}

// Helper to map Prisma camelCase to existing snake_case interface
const mapToLegacy = (m: any): Monitor => ({
  id: m.id,
  user_id: m.userId,
  name: m.name,
  url: m.url,
  check_interval: m.checkInterval,
  alert_threshold: m.alertThreshold,
  is_active: m.isActive,
  last_status: m.lastStatus,
  last_checked: m.lastChecked,
  consecutive_failures: m.consecutiveFailures,
  created_at: m.createdAt,
});

export const monitorModel = {
  // 1. Create a new monitor
  create: async (userId: string, name: string, url: string, checkInterval: number, alertThreshold: number): Promise<Monitor> => {
    const monitor = await prisma.monitor.create({
      data: {
        userId,
        name,
        url,
        checkInterval,
        alertThreshold
      }
    });
    return mapToLegacy(monitor);
  },

  // 2. Get all monitors for a user (with pagination)
  getAllForUser: async (userId: string, limit: number, offset: number, statusFilter?: string): Promise<{ monitors: Monitor[], total: number }> => {
    const where: any = { userId };

    if (statusFilter === 'up' || statusFilter === 'down') {
      where.lastStatus = statusFilter;
    } else if (statusFilter === 'paused') {
      where.isActive = false;
    }

    const [monitors, total] = await Promise.all([
      prisma.monitor.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.monitor.count({ where })
    ]);

    return { 
      monitors: monitors.map(mapToLegacy), 
      total 
    };
  },

  // 3. Get single monitor by ID (ensure user owns it)
  getByIdForUser: async (id: string, userId: string): Promise<Monitor | null> => {
    const monitor = await prisma.monitor.findFirst({
      where: { id, userId }
    });
    return monitor ? mapToLegacy(monitor) : null;
  },

  // 4. Update check_interval and alert_threshold
  update: async (id: string, userId: string, checkInterval?: number, alertThreshold?: number): Promise<Monitor | null> => {
    const data: any = {};
    if (checkInterval !== undefined) data.checkInterval = checkInterval;
    if (alertThreshold !== undefined) data.alertThreshold = alertThreshold;

    const monitor = await prisma.monitor.update({
      where: { id, userId },
      data
    });
    return monitor ? mapToLegacy(monitor) : null;
  },

  // 5. Toggle active status (Pause/Resume)
  updateStatus: async (id: string, userId: string, isActive: boolean): Promise<Monitor | null> => {
    const monitor = await prisma.monitor.update({
      where: { id, userId },
      data: { isActive }
    });
    return monitor ? mapToLegacy(monitor) : null;
  },

  // 6. Delete monitor
  delete: async (id: string, userId: string): Promise<boolean> => {
    try {
      await prisma.monitor.delete({
        where: { id, userId }
      });
      return true;
    } catch {
      return false;
    }
  }
};

