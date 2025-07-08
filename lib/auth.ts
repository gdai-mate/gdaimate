import { auth, clerkClient } from '@clerk/nextjs/server';
import { NextRequest } from 'next/server';
import { UserRole, UserMetadata, AuthUser } from '@/types/auth';

export class AuthError extends Error {
  constructor(message: string, public statusCode: number = 401) {
    super(message);
    this.name = 'AuthError';
  }
}

export const getCurrentUser = async (): Promise<AuthUser | null> => {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return null;
    }

    const user = await clerkClient.users.getUser(userId);
    
    const metadata = user.privateMetadata as UserMetadata;
    
    return {
      id: user.id,
      email: user.emailAddresses[0]?.emailAddress || '',
      firstName: user.firstName || undefined,
      lastName: user.lastName || undefined,
      metadata: {
        role: metadata.role || 'user',
        createdAt: metadata.createdAt,
        subscriptionId: metadata.subscriptionId,
        stripeCustomerId: metadata.stripeCustomerId,
      },
    };
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

export const requireAuth = async (): Promise<AuthUser> => {
  const user = await getCurrentUser();
  
  if (!user) {
    throw new AuthError('Authentication required', 401);
  }
  
  return user;
};

export const requireRole = (allowedRoles: UserRole | UserRole[]) => {
  return async (): Promise<AuthUser> => {
    const user = await requireAuth();
    
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    
    if (!roles.includes(user.metadata.role)) {
      throw new AuthError(
        `Access denied. Required role: ${roles.join(' or ')}. Current role: ${user.metadata.role}`,
        403
      );
    }
    
    return user;
  };
};

export const updateUserMetadata = async (
  userId: string,
  metadata: Partial<UserMetadata>
): Promise<void> => {
  try {
    const user = await clerkClient.users.getUser(userId);
    const currentMetadata = user.privateMetadata as UserMetadata;
    
    await clerkClient.users.updateUser(userId, {
      privateMetadata: {
        ...currentMetadata,
        ...metadata,
      },
    });
  } catch (error) {
    console.error('Error updating user metadata:', error);
    throw new Error('Failed to update user metadata');
  }
};

export const promoteToOwner = async (userId: string): Promise<void> => {
  await updateUserMetadata(userId, { role: 'owner' });
};

export const setStripeCustomer = async (
  userId: string,
  stripeCustomerId: string,
  subscriptionId?: string
): Promise<void> => {
  await updateUserMetadata(userId, {
    stripeCustomerId,
    subscriptionId,
  });
};