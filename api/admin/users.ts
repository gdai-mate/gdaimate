import { NextRequest, NextResponse } from 'next/server';
import { withOwnerRole } from '@/lib/api-middleware';
import { clerkClient } from '@clerk/nextjs/server';

export const GET = withOwnerRole(async (request: NextRequest, { user }) => {
  try {
    const users = await clerkClient.users.getUserList({
      limit: 100,
    });

    const formattedUsers = users.data.map(user => ({
      id: user.id,
      email: user.emailAddresses[0]?.emailAddress,
      firstName: user.firstName,
      lastName: user.lastName,
      createdAt: user.createdAt,
      lastSignInAt: user.lastSignInAt,
      metadata: user.privateMetadata,
    }));

    return NextResponse.json({
      users: formattedUsers,
      total: users.totalCount,
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
});

export const POST = withOwnerRole(async (request: NextRequest, { user }) => {
  try {
    const { email, firstName, lastName, role = 'user' } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const newUser = await clerkClient.users.createUser({
      emailAddress: [email],
      firstName,
      lastName,
      privateMetadata: {
        role,
        createdAt: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      user: {
        id: newUser.id,
        email: newUser.emailAddresses[0]?.emailAddress,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        metadata: newUser.privateMetadata,
      },
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
});