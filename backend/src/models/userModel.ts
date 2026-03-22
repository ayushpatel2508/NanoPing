import pool from "../../config/db.js";

// Interface for what we get back from the DB
export interface User {
  id: string;
  email: string;
  password_hash: string | null;
  clerk_id: string | null;
  name: string;
  refresh_token: string | null;
  created_at: Date;
}

export const userModel = {
  // Find a user by email
  findByEmail: async (email: string): Promise<User | null> => {
    const query = `SELECT * FROM users WHERE email = $1`;
    const result = await pool.query(query, [email]);
    return result.rows[0] || null;
  },

  // Create a new user (Manual registration)
  create: async (email: string, passwordHash: string, name: string): Promise<User> => {
    const query = `
      INSERT INTO users (email, password_hash, name)
      VALUES ($1, $2, $3)
      RETURNING id, email, name, created_at;
    `;
    const result = await pool.query(query, [email, passwordHash, name]);
    return result.rows[0];
  },

  // Update the refresh token for a user
  updateRefreshToken: async (id: string, refreshToken: string | null): Promise<void> => {
    const query = `UPDATE users SET refresh_token = $1 WHERE id = $2`;
    await pool.query(query, [refreshToken, id]);
  },

  // Find a user by Clerk ID
  findByClerkId: async (clerkId: string): Promise<User | null> => {
    const query = `SELECT * FROM users WHERE clerk_id = $1`;
    const result = await pool.query(query, [clerkId]);
    return result.rows[0] || null;
  },

  // Create a user from Clerk Sync
  createFromClerk: async (clerkId: string, email: string, name: string): Promise<User> => {
    const query = `
      INSERT INTO users (clerk_id, email, name, password_hash)
      VALUES ($1, $2, $3, NULL)
      RETURNING id, email, name, clerk_id, created_at;
    `;
    const result = await pool.query(query, [clerkId, email, name]);
    return result.rows[0];
  },

  // Link an existing email account to a Clerk ID
  updateClerkId: async (id: string, clerkId: string): Promise<void> => {
    const query = `UPDATE users SET clerk_id = $1 WHERE id = $2`;
    await pool.query(query, [clerkId, id]);
  },

  // Update user's name
  updateName: async (id: string, name: string): Promise<User> => {
    const query = `
      UPDATE users SET name = $1 WHERE id = $2
      RETURNING id, email, name, clerk_id, created_at;
    `;
    const result = await pool.query(query, [name, id]);
    return result.rows[0];
  },

  // Update user's password hash
  updatePassword: async (id: string, passwordHash: string): Promise<void> => {
    const query = `UPDATE users SET password_hash = $1 WHERE id = $2`;
    await pool.query(query, [passwordHash, id]);
  },

  // Delete user account (CASCADE takes care of monitors, checks, incidents)
  deleteUser: async (id: string): Promise<void> => {
    const query = `DELETE FROM users WHERE id = $1`;
    await pool.query(query, [id]);
  }
};
