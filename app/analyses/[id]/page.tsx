import Sidebar from '@/components/Sidebar';
import EnhancedDashboard from '@/components/EnhancedDashboard';
import { Card, CardContent } from '@/components/ui/card';

async function getAnalysis(id: string) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/analyses/${id}`, {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
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

