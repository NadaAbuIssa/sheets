'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Bar, Pie, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Copy, Check } from 'lucide-react';
import { useState } from 'react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

interface EnhancedDashboardProps {
  analysis: any;
}

export default function EnhancedDashboard({ analysis }: EnhancedDashboardProps) {
  const [copiedCell, setCopiedCell] = useState<string | null>(null);

  const copyToClipboard = (text: string, cellId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCell(cellId);
    setTimeout(() => setCopiedCell(null), 2000);
  };

  // Extract column types
  const numericColumns = analysis.columns.filter((c: any) => c.type === 'numeric');
  const categoricalColumns = analysis.columns.filter((c: any) => c.type === 'categorical');
  const textColumns = analysis.columns.filter((c: any) => c.type === 'text');
  const timestampColumns = analysis.columns.filter((c: any) => c.type === 'timestamp');

  // Prepare chart data
  const categoricalChartData = categoricalColumns.length > 0 && categoricalColumns[0].stats?.categorical
    ? {
      labels: categoricalColumns[0].stats.categorical.topCategories.slice(0, 10).map((c: any) => c.value),
      datasets: [{
        data: categoricalColumns[0].stats.categorical.topCategories.slice(0, 10).map((c: any) => c.count),
        backgroundColor: [
          'rgba(59, 130, 246, 0.7)',
          'rgba(16, 185, 129, 0.7)',
          'rgba(234, 179, 8, 0.7)',
          'rgba(239, 68, 68, 0.7)',
          'rgba(139, 92, 246, 0.7)',
          'rgba(236, 72, 153, 0.7)',
          'rgba(14, 165, 233, 0.7)',
          'rgba(34, 197, 94, 0.7)',
          'rgba(251, 146, 60, 0.7)',
          'rgba(168, 85, 247, 0.7)',
        ],
        borderWidth: 1,
      }],
    }
    : null;

  const numericHistogramData = numericColumns.length > 0 && numericColumns[0].stats?.numeric
    ? {
      labels: numericColumns[0].stats.numeric.histogramBins.map((b: any) => b.bin),
      datasets: [{
        label: numericColumns[0].name,
        data: numericColumns[0].stats.numeric.histogramBins.map((b: any) => b.count),
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
      }],
    }
    : null;

  const timestampTrendData = timestampColumns.length > 0 && timestampColumns[0].stats?.timestamp
    ? {
      labels: timestampColumns[0].stats.timestamp.trendLineData.map((d: any) =>
        new Date(d.date).toLocaleDateString()
      ),
      datasets: [{
        label: 'Frequency',
        data: timestampColumns[0].stats.timestamp.trendLineData.map((d: any) => d.count),
        borderColor: 'rgba(16, 185, 129, 1)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
      }],
    }
    : null;

  const sentimentData = textColumns.length > 0 && textColumns[0].stats?.text
    ? {
      labels: ['Positive', 'Neutral', 'Negative'],
      datasets: [{
        data: [
          textColumns[0].stats.text.sentiment.positive,
          textColumns[0].stats.text.sentiment.neutral,
          textColumns[0].stats.text.sentiment.negative,
        ],
        backgroundColor: [
          'rgba(34, 197, 94, 0.7)',
          'rgba(234, 179, 8, 0.7)',
          'rgba(239, 68, 68, 0.7)',
        ],
        borderWidth: 1,
      }],
    }
    : null;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header Section */}
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">{analysis.fileName}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Created on {new Date(analysis.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Rows</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{analysis.rowCount.toLocaleString()}</p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Columns</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{analysis.columns.length}</p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Numeric</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{numericColumns.length}</p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Categorical</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{categoricalColumns.length}</p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Text</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{textColumns.length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Date Range */}
        {timestampColumns.length > 0 && timestampColumns[0].stats?.timestamp && (
          <Card className="glass-card">
            <CardContent className="pt-4">
              <p className="text-sm text-muted-foreground">
                Date Range: <span className="font-medium text-foreground">
                  {new Date(timestampColumns[0].stats.timestamp.earliest).toLocaleDateString()} to {' '}
                  {new Date(timestampColumns[0].stats.timestamp.latest).toLocaleDateString()}
                </span>
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Categorical Pie Chart */}
        {categoricalChartData && (
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Categorical Distribution</CardTitle>
              <CardDescription>{categoricalColumns[0].name} - Top Categories</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 sm:h-80">
                <Pie
                  data={categoricalChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom',
                      },
                    },
                  }}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Numeric Histogram */}
        {numericHistogramData && (
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Numeric Distribution</CardTitle>
              <CardDescription>{numericColumns[0].name} - Histogram</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 sm:h-80">
                <Bar
                  data={numericHistogramData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        beginAtZero: true,
                      },
                    },
                  }}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Timestamp Trend Line */}
        {timestampTrendData && (
          <Card className="glass-card lg:col-span-2">
            <CardHeader>
              <CardTitle>Timestamp Trend</CardTitle>
              <CardDescription>{timestampColumns[0].name} - Frequency Over Time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 sm:h-80">
                <Line
                  data={timestampTrendData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        beginAtZero: true,
                      },
                    },
                  }}
                />
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Text Analysis Section */}
      {textColumns.length > 0 && textColumns[0].stats?.text && (
        <div className="space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Text Analysis</CardTitle>
              <CardDescription>{textColumns[0].name} - Sentiment & Keywords</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Sentiment Bar */}
              {sentimentData && (
                <div>
                  <h3 className="text-sm font-medium mb-3">Sentiment Distribution</h3>
                  <div className="h-48">
                    <Bar
                      data={sentimentData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                          y: {
                            beginAtZero: true,
                          },
                        },
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Top Keywords */}
              <div>
                <h3 className="text-sm font-medium mb-3">Top Keywords</h3>
                <div className="flex flex-wrap gap-2">
                  {textColumns[0].stats.text.topKeywords.slice(0, 10).map((keyword: any, idx: number) => (
                    <span
                      key={idx}
                      className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-sm"
                    >
                      {keyword.word} ({keyword.count})
                    </span>
                  ))}
                </div>
              </div>

              {/* Sample Highlights */}
              {textColumns[0].stats.text.sampleHighlights.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium mb-3">Sample Highlights</h3>
                  <div className="space-y-2">
                    {textColumns[0].stats.text.sampleHighlights.map((highlight: string, idx: number) => (
                      <p key={idx} className="text-sm text-muted-foreground italic">
                        "{highlight}"
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Data Preview */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Data Preview</CardTitle>
          <CardDescription>First 20 rows - Click any cell to copy</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <Table>
              <TableHeader>
                <TableRow className="border-white/20 hover:bg-transparent">
                  {analysis.columns.map((col: any, idx: number) => (
                    <TableHead key={idx} className="whitespace-nowrap bg-white/5">{col.name}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {analysis.previewRows && analysis.previewRows.length > 0 ? (
                  analysis.previewRows.map((row: any, rowIdx: number) => (
                    <TableRow key={rowIdx} className="border-white/20 hover:bg-white/5">
                      {analysis.columns.map((col: any, colIdx: number) => {
                        const cellId = `${rowIdx}-${colIdx}`;
                        // Handle different row structures (array vs object)
                        const cellValue = typeof row === 'object' && !Array.isArray(row)
                          ? String(row[col.name] || '')
                          : String(row[colIdx] || '');

                        return (
                          <TableCell
                            key={colIdx}
                            className="max-w-xs truncate cursor-pointer hover:bg-white/10 transition-colors group whitespace-nowrap"
                            onClick={() => copyToClipboard(cellValue, cellId)}
                            title={cellValue}
                          >
                            <div className="flex items-center gap-2">
                              <span className="truncate flex-1">{cellValue || '-'}</span>
                              {copiedCell === cellId ? (
                                <Check className="w-3 h-3 text-green-500 flex-shrink-0" />
                              ) : (
                                <Copy className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 flex-shrink-0 transition-opacity" />
                              )}
                            </div>
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={analysis.columns.length} className="text-center py-8 text-muted-foreground">
                      No preview data available
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

