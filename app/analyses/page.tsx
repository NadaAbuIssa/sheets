import Sidebar from '@/components/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Eye } from 'lucide-react';

async function getAnalyses() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/analyses`, {
      cache: 'no-store',
    });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export default async function AnalysesPage() {
  const analyses = await getAnalyses();

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 lg:ml-64 p-4 sm:p-6 lg:p-8 transition-all duration-300">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8">Analyses</h1>

          <Card className="bg-white/10 backdrop-blur-lg border-white/20 shadow-xl rounded-2xl">
            <CardHeader>
              <CardTitle>All Analyses</CardTitle>
            </CardHeader>
            <CardContent>
              {analyses.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">No analyses found.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/20">
                      <TableHead>Name</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Rows Count</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analyses.map((analysis: any) => (
                      <TableRow key={analysis._id} className="border-white/20">
                        <TableCell className="font-medium">{analysis.fileName}</TableCell>
                        <TableCell>
                          {new Date(analysis.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>{analysis.rowCount.toLocaleString()}</TableCell>
                        <TableCell className="text-right">
                          <Link href={`/analyses/${analysis._id}`}>
                            <Button variant="outline" size="sm" className="bg-white/10 backdrop-blur-lg border-white/20 hover:bg-white/20">
                              <Eye className="w-4 h-4 mr-2" />
                              View
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

