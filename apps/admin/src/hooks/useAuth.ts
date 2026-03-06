import { useUser } from '@clerk/clerk-react';

/**
 * Roles are managed entirely in Clerk Dashboard via publicMetadata:
 * 
 * Admin (full access):
 *   { "role": "admin" }
 * 
 * Team (limited access):
 *   { "role": "team", "accommodations": [1, 2] }
 * 
 * Guest (no access):
 *   No metadata or no role set
 */

export type UserRole = 'admin' | 'team' | 'guest';

export interface AuthState {
  isLoaded: boolean;
  isSignedIn: boolean;
  role: UserRole;
  userId: string | null;
  email: string | null;
  name: string | null;
  allowedAccommodations: number[];
}

export function useAuth(): AuthState {
  const { isLoaded, isSignedIn, user } = useUser();

  if (!isLoaded) {
    return {
      isLoaded: false,
      isSignedIn: false,
      role: 'guest',
      userId: null,
      email: null,
      name: null,
      allowedAccommodations: []
    };
  }

  if (!isSignedIn || !user) {
    return {
      isLoaded: true,
      isSignedIn: false,
      role: 'guest',
      userId: null,
      email: null,
      name: null,
      allowedAccommodations: []
    };
  }

  const email = user.primaryEmailAddress?.emailAddress || null;
  const name = user.fullName || user.firstName || email;

  // Role comes from Clerk Dashboard > Users > publicMetadata
  const metadata = user.publicMetadata as {
    role?: 'admin' | 'team';
    accommodations?: number[];
  } | undefined;

  const role: UserRole = metadata?.role || 'guest';
  const accommodations = metadata?.accommodations || [];

  return {
    isLoaded: true,
    isSignedIn: true,
    role,
    userId: user.id,
    email,
    name,
    allowedAccommodations: role === 'admin' ? [1, 2, 3] : accommodations
  };
}
