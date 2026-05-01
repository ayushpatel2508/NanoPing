import prisma from "../config/prisma.js";

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

const mapToLegacy = (u: any): User => ({
  id: u.id,
  email: u.email,
  password_hash: u.passwordHash,
  clerk_id: u.clerkId,
  name: u.name,
  refresh_token: u.refreshToken,
  created_at: u.createdAt,
});

export const userModel = {
  // Find a user by id
  findById: async (id: string): Promise<User | null> => {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        clerkId: true,
        createdAt: true
      }
    });
    return user ? mapToLegacy(user) : null;
  },

  // Find a user by email
  findByEmail: async (email: string): Promise<User | null> => {
    const user = await prisma.user.findUnique({
       where: { email }
    });
    return user ? mapToLegacy(user) : null;
  },

  // Create a new user (Manual registration)
  create: async (email: string, passwordHash: string, name: string, refreshToken?: string): Promise<User> => {
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        refreshToken: refreshToken || null
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true
      }
    });
    return mapToLegacy(user);
  },

  // Update the refresh token for a user
  updateRefreshToken: async (id: string, refreshToken: string | null): Promise<void> => {
    await prisma.user.update({
      where: { id },
      data: { refreshToken }
    });
  },

  // Update user's name
  updateName: async (id: string, name: string): Promise<User> => {
    const user = await prisma.user.update({
      where: { id },
      data: { name },
      select: {
        id: true,
        email: true,
        name: true,
        clerkId: true,
        createdAt: true
      }
    });
    return mapToLegacy(user);
  },

  // Update user's password hash
  updatePassword: async (id: string, passwordHash: string): Promise<void> => {
    await prisma.user.update({
      where: { id },
      data: { passwordHash }
    });
  },

  // Delete user account
  deleteUser: async (id: string): Promise<void> => {
    await prisma.user.delete({
      where: { id }
    });
  }
};

