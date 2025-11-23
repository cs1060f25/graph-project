import { NextRequest, NextResponse } from 'next/server';
import { bootstrapAuth } from '@/lib/logic/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    const user = await bootstrapAuth(token);
    return NextResponse.json({
      email: user.email,
      role: user.role || 'user',
      displayName: user.displayName,
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
}


