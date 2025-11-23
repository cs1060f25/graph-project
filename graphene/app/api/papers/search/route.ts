import { NextRequest, NextResponse } from 'next/server';
import { searchPapers } from '@/lib/services/paperSearch';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, type = 'keyword', maxResults = 10, userId, forceRefresh = false } = body;

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }
    
    const papers = await searchPapers(query, { type, maxResults, userId, forceRefresh });
    return NextResponse.json({ papers });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to search papers' }, { status: 500 });
  }
}


