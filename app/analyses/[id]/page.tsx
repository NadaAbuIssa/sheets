import Sidebar from '@/components/Sidebar';
import EnhancedDashboard from '@/components/EnhancedDashboard';
import { Card, CardContent } from '@/components/ui/card';

import connectDB from '@/lib/db';
import Analysis from '@/models/Analysis';

async function getAnalysis(id: string) {
  try {
    await connectDB();
    const analysis = await Analysis.findById(id).lean();
    if (!analysis) return null;

    // Convert _id and dates to strings to avoid serialization issues
    return JSON.parse(JSON.stringify(analysis));
  } catch (error) {
    console.error('Error fetching analysis:', error);
    return null;
  }
}

export default async function AnalysisDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const analysis = await getAnalysis(id);

  if (!analysis) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 ml-64 p-8">
          <div className="max-w-7xl mx-auto">
            <Card className="bg-white/10 backdrop-blur-lg border-white/20 shadow-xl rounded-2xl">
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">Analysis not found.</p>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 lg:ml-64 p-4 sm:p-6 lg:p-8 transition-all duration-300">
        <div className="max-w-7xl mx-auto">
          <EnhancedDashboard analysis={analysis} />
        </div>
      </main>
    </div>
  );
}

