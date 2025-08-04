import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { sendNewUserNotification } from '@/lib/notifications';

export async function POST(request: NextRequest) {
  try {
    console.log(">>>>>>>>>request");
    const { name, email, password } = await request.json();
    console.log(name, email, password);

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Basic validation
    if (typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Please provide a valid email address' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email)
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user (approved = false by default, requires admin approval)
    const [newUser] = await db.insert(users).values({
      name: name?.trim() || null,
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: 'user',
      approved: false,
    }).returning();

    // Send notification to admins about the new user awaiting approval
    try {
      // Send notification and real-time update in the background
      sendNewUserNotification(
        newUser.name || newUser.email,
        newUser.email,
        newUser.id
      ).catch(console.error); // Log any notification errors but don't fail the request
    } catch (error) {
      console.error('Error sending admin notifications:', error);
      // Don't fail the signup if notifications fail
    }

    return NextResponse.json(
      { 
        message: 'User created successfully. Please wait for admin approval.',
        user: { 
          id: newUser.id, 
          name: newUser.name,
          email: newUser.email 
        }
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
