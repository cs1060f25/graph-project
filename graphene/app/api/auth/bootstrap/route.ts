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
    console.error('Bootstrap auth error:', error.code || error.message || error);
    const errorMessage = error.message || 'Invalid token';
    
    let status = 401;
    if (error.code === 'app/invalid-credential' || error.message?.includes('PERMISSION_DENIED') || error.message?.includes('serviceusage')) {
      status = 500;
    }
    
    return NextResponse.json({ 
      error: errorMessage,
      code: error.code || 'UNKNOWN_ERROR'
    }, { status });
  }
}


