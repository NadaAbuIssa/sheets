import Sidebar from '@/components/Sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart3, TrendingUp, FileText } from 'lucide-react';

import connectDB from '@/lib/db';
import Analysis from '@/models/Analysis';

async function getReportsData() {
  try {
    await connectDB();
    const analyses = await Analysis.find().sort({ createdAt: -1 }).lean();
    return JSON.parse(JSON.stringify(analyses));
  } catch (error) {
    console.error('Error fetching reports data:', error);
    return [];
  }
}

export default async function ReportsPage() {
  const analyses = await getReportsData();
  const totalAnalyses = analyses.length;
  const totalRows = analyses.reduce((sum: number, a: any) => sum + (a.rowCount || 0), 0);
  const avgRowsPerAnalysis = totalAnalyses > 0 ? Math.round(totalRows / totalAnalyses) : 0;

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 lg:ml-64 p-4 sm:p-6 lg:p-8 transition-all duration-300">
        <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl sm:text-3xl font-bold">Reports</h1>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <Card className="bg-white/10 backdrop-blur-lg border-white/20 shadow-xl rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg font-medium flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Total Reports
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{totalAnalyses}</p>
                <p className="text-sm text-muted-foreground mt-1">All time analyses</p>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-lg border-white/20 shadow-xl rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg font-medium flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Total Rows
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{totalRows.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground mt-1">Processed data rows</p>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-lg border-white/20 shadow-xl rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg font-medium flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Avg Rows/Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{avgRowsPerAnalysis.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground mt-1">Average per report</p>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-white/10 backdrop-blur-lg border-white/20 shadow-xl rounded-2xl">
            <CardHeader>
              <CardTitle>Recent Analyses</CardTitle>
              <CardDescription>Latest analysis reports</CardDescription>
            </CardHeader>
            <CardContent>
              {analyses.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">No analyses available yet.</p>
              ) : (
                <div className="overflow-x-auto -mx-4 sm:mx-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-white/20">
                        <TableHead>File Name</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Rows</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {analyses.slice(0, 10).map((analysis: any) => (
                        <TableRow key={analysis._id} className="border-white/20">
                          <TableCell className="font-medium max-w-xs truncate">{analysis.fileName}</TableCell>
                          <TableCell className="text-sm">
                            {new Date(analysis.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>{analysis.rowCount.toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

