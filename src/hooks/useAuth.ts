import { useUser } from '@clerk/clerk-react';

// Admin email - users with this email have full admin access
const ADMIN_EMAILS = ['liandrodacruz@outlook.pt'];

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

  // Check if user is admin by email
  const isAdmin = email && ADMIN_EMAILS.includes(email.toLowerCase());

  // Get team metadata if not admin
  const metadata = user.publicMetadata as {
    role?: string;
    accommodations?: number[];
  } | undefined;

  const isTeam = !isAdmin && metadata?.role === 'team';
  const allowedAccommodations = metadata?.accommodations || [];

  return {
    isLoaded: true,
    isSignedIn: true,
    role: isAdmin ? 'admin' : isTeam ? 'team' : 'guest',
    userId: user.id,
    email,
    name,
    allowedAccommodations: isAdmin ? [1, 2, 3] : allowedAccommodations // Admin has access to all
  };
}

export function useRequireAuth(requiredRole: 'admin' | 'team' | 'any' = 'any') {
  const auth = useAuth();

  const hasAccess = auth.isSignedIn && (
    requiredRole === 'any' ||
    (auth.role as UserRole) === 'admin' ||
    (requiredRole === 'team' && ((auth.role as UserRole) === 'team' || (auth.role as UserRole) === 'admin'))
  );

  return {
    ...auth,
    hasAccess
  };
}
