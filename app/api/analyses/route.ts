import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Analysis from '@/models/Analysis';

export async function GET() {
  try {
    await connectDB();

    const analyses = await Analysis.find()
      .sort({ createdAt: -1 })
      .select('fileName rowCount createdAt')
      .lean();

    return NextResponse.json(analyses);
  } catch (error: any) {
    console.error('Error fetching analyses:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch analyses' },
      { status: 500 }
    );
  }
}

