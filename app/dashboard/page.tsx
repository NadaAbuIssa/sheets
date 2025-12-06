import Sidebar from '@/components/Sidebar';
import FileUpload from '@/components/FileUpload';
import GoogleSheetsAnalyzer from '@/components/GoogleSheetsAnalyzer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Key, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

import connectDB from '@/lib/db';
import Analysis from '@/models/Analysis';

async function getDashboardData() {
  try {
    await connectDB();
    const analyses = await Analysis.find().sort({ createdAt: -1 }).lean();

    // Serialize for Client Components
    const serializedAnalyses = JSON.parse(JSON.stringify(analyses));
    const latest = serializedAnalyses.length > 0 ? serializedAnalyses[0] : null;

    return { analyses: serializedAnalyses, latest };
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return { analyses: [], latest: null };
  }
}

function calculateAvgSentiment(columns: any[]) {
  const textColumns = columns.filter(c => c.type === 'text');
  if (textColumns.length === 0) return 'Neutral';

  const sentiments = textColumns.map(c => c.summary);
  const positive = sentiments.filter(s => s === 'Positive').length;
  const negative = sentiments.filter(s => s === 'Negative').length;

  if (positive > negative) return 'Positive';
  if (negative > positive) return 'Negative';
  return 'Neutral';
}

export default async function DashboardPage() {
  const { analyses, latest } = await getDashboardData();
  const totalRows = analyses.reduce((sum: number, a: any) => sum + (a.rowCount || 0), 0);
  const avgSentiment = latest ? calculateAvgSentiment(latest.columns) : 'Neutral';

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 lg:ml-64 p-4 sm:p-6 lg:p-8 transition-all duration-300">
        <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Dashboard
              </h1>
              <p className="text-muted-foreground mt-1">
                Welcome back! Here's your analysis overview.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 sm:gap-4 w-full sm:w-auto">
              <FileUpload />
              <GoogleSheetsAnalyzer />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <Card className="glass-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Analyses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{analyses.length}</div>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Rows Processed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{totalRows.toLocaleString()}</div>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Avg Sentiment</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{avgSentiment}</div>
              </CardContent>
            </Card>
          </div>

          {latest && (
            <Card className="glass-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Latest Analysis</CardTitle>
                    <CardDescription>{latest.fileName}</CardDescription>
                  </div>
                  <Link href={`/analyses/${latest._id}`}>
                    <Button variant="outline" className="bg-white/10 backdrop-blur-lg border-white/20 hover:bg-white/20">
                      View Full Analysis
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto -mx-4 sm:mx-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-white/20 hover:bg-transparent">
                        <TableHead>Column Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="hidden sm:table-cell">Sample Value</TableHead>
                        <TableHead>Summary</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {latest.columns.slice(0, 5).map((column: any, idx: number) => (
                        <TableRow key={idx} className="border-white/20 hover:bg-white/5">
                          <TableCell className="font-medium">{column.name}</TableCell>
                          <TableCell>
                            <span className="px-2 py-1 rounded-full bg-white/10 text-xs border border-white/20">
                              {column.type}
                            </span>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell max-w-xs truncate text-muted-foreground">
                            {column.sampleValue}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{column.summary}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {!latest && (
            <Card className="glass-card">
              <CardContent className="py-12 text-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="p-4 rounded-full bg-white/10">
                    <FileText className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium">No analyses yet</h3>
                    <p className="text-muted-foreground">Upload a file or analyze a Google Sheet to get started.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}

