import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string; booking_id: string }> }
) {
  const params = await context.params;
  const { slug, booking_id } = params;
  
  try {
    const response = await fetch(
      `${BACKEND_URL}/api/public/workspaces/${slug}/bookings/${booking_id}/forms`
    );
    const data = await response.json();
    
    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }
    
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { detail: 'Failed to fetch forms' },
      { status: 500 }
    );
  }
}
