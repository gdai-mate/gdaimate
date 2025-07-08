export type UserRole = 'owner' | 'user';

export interface UserMetadata {
  role: UserRole;
  createdAt?: string;
  subscriptionId?: string;
  stripeCustomerId?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  metadata: UserMetadata;
}

export interface AuthContext {
  user: AuthUser | null;
  isLoaded: boolean;
  isSignedIn: boolean;
}