import  pool  from "../../config/db.js";

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

export const monitorModel = {
  // 1. Create a new monitor
  create: async (userId: string, name: string, url: string, checkInterval: number, alertThreshold: number): Promise<Monitor> => {
    const query = `
      INSERT INTO monitors (user_id, name, url, check_interval, alert_threshold)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;
    const result = await pool.query(query, [userId, name, url, checkInterval, alertThreshold]);
    return result.rows[0];
  },

  // 2. Get all monitors for a user (with pagination)
  getAllForUser: async (userId: string, limit: number, offset: number, statusFilter?: string): Promise<{ monitors: Monitor[], total: number }> => {
    let baseQuery = `FROM monitors WHERE user_id = $1`;
    const queryParams: any[] = [userId];
    let paramIndex = 2;

    if (statusFilter === 'up' || statusFilter === 'down') {
      baseQuery += ` AND last_status = $${paramIndex}`;
      queryParams.push(statusFilter);
      paramIndex++;
    } else if (statusFilter === 'paused') {
      baseQuery += ` AND is_active = false`;
    }

    // Get Total Count
    const countResult = await pool.query(`SELECT COUNT(*) ${baseQuery}`, queryParams);
    const total = parseInt(countResult.rows[0].count, 10);

    // Get Paginated Data
    const dataQuery = `SELECT * ${baseQuery} ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(limit, offset);
    const dataResult = await pool.query(dataQuery, queryParams);

    return { monitors: dataResult.rows, total };
  },

  // 3. Get single monitor by ID (ensure user owns it)
  getByIdForUser: async (id: string, userId: string): Promise<Monitor | null> => {
    const query = `SELECT * FROM monitors WHERE id = $1 AND user_id = $2`;
    const result = await pool.query(query, [id, userId]);
    return result.rows[0] || null;
  },

  // 4. Update check_interval and alert_threshold
  update: async (id: string, userId: string, checkInterval?: number, alertThreshold?: number): Promise<Monitor | null> => {
    // Dynamically build the update query based on provided fields
    const updates = [];
    const values: any[] = [id, userId];
    let paramIndex = 3;

    if (checkInterval !== undefined) {
      updates.push(`check_interval = $${paramIndex}`);
      paramIndex++;
      values.push(checkInterval);
    }
    if (alertThreshold !== undefined) {
      updates.push(`alert_threshold = $${paramIndex}`);
      paramIndex++;
      values.push(alertThreshold);
    }

    if (updates.length === 0) return null;

    const query = `
      UPDATE monitors 
      SET ${updates.join(', ')} 
      WHERE id = $1 AND user_id = $2 
      RETURNING *;
    `;
    const result = await pool.query(query, values);
    return result.rows[0] || null;
  },

  // 5. Toggle active status (Pause/Resume)
  updateStatus: async (id: string, userId: string, isActive: boolean): Promise<Monitor | null> => {
    const query = `
      UPDATE monitors 
      SET is_active = $3 
      WHERE id = $1 AND user_id = $2 
      RETURNING *;
    `;
    const result = await pool.query(query, [id, userId, isActive]);
    return result.rows[0] || null;
  },

  // 6. Delete monitor
  delete: async (id: string, userId: string): Promise<boolean> => {
    const query = `DELETE FROM monitors WHERE id = $1 AND user_id = $2 RETURNING id`;
    const result = await pool.query(query, [id, userId]);
    return (result.rowCount ?? 0) > 0;
  }
};
