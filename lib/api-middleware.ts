import { NextRequest, NextResponse } from 'next/server';
import { AuthError, requireAuth, requireRole } from './auth';
import { UserRole, AuthUser } from '@/types/auth';

type ApiHandler = (
  request: NextRequest,
  context: { user: AuthUser }
) => Promise<NextResponse> | NextResponse;

type AuthenticatedApiHandler = (
  request: NextRequest,
  context: { user: AuthUser }
) => Promise<NextResponse> | NextResponse;

export const withAuth = (handler: AuthenticatedApiHandler) => {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      const user = await requireAuth();
      return await handler(request, { user });
    } catch (error) {
      if (error instanceof AuthError) {
        return NextResponse.json(
          { error: error.message },
          { status: error.statusCode }
        );
      }
      
      console.error('Auth middleware error:', error);
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 500 }
      );
    }
  };
};

export const withRole = (allowedRoles: UserRole | UserRole[]) => {
  return (handler: AuthenticatedApiHandler) => {
    return async (request: NextRequest): Promise<NextResponse> => {
      try {
        const user = await requireRole(allowedRoles)();
        return await handler(request, { user });
      } catch (error) {
        if (error instanceof AuthError) {
          return NextResponse.json(
            { error: error.message },
            { status: error.statusCode }
          );
        }
        
        console.error('Role middleware error:', error);
        return NextResponse.json(
          { error: 'Authorization failed' },
          { status: 500 }
        );
      }
    };
  };
};

export const withOwnerRole = withRole('owner');
export const withUserRole = withRole(['owner', 'user']);

export const handleApiError = (error: unknown): NextResponse => {
  if (error instanceof AuthError) {
    return NextResponse.json(
      { error: error.message },
      { status: error.statusCode }
    );
  }
  
  console.error('API Error:', error);
  return NextResponse.json(
    { error: 'Internal server error' },
    { status: 500 }
  );
};