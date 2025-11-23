import { NextRequest, NextResponse } from 'next/server';
import { getOrGenerateSummary, regenerateSummary } from '@/lib/logic/summaries';

function getToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  return authHeader.split('Bearer ')[1];
}

export async function POST(request: NextRequest) {
  try {
    const token = getToken(request);
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { paperId, paper, regenerate = false } = body;

    if (!paperId) {
      return NextResponse.json({ error: 'Paper ID is required' }, { status: 400 });
    }

    if (!paper) {
      return NextResponse.json({ error: 'Paper data is required' }, { status: 400 });
    }

    const result = regenerate 
      ? await regenerateSummary(token, paperId, paper)
      : await getOrGenerateSummary(token, paperId, paper);
    
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    
    return NextResponse.json({ summary: result.data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to get summary' }, { status: 500 });
  }
}

