'use client';

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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

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

interface AnalysisChartsProps {
  columns: Array<{
    name: string;
    type: string;
    summary: string;
    stats?: {
      numeric?: {
        mean: number;
        median: number;
        mode: number | null;
        min: number;
        max: number;
        stdDev: number;
        count: number;
      };
      text?: {
        positive: number;
        negative: number;
        neutral: number;
        total: number;
      };
    };
  }>;
}

export default function AnalysisCharts({ columns }: AnalysisChartsProps) {
  const numericColumns = columns.filter((c) => c.type === 'numeric');
  const textColumns = columns.filter((c) => c.type === 'text');

  // Enhanced numeric data with stats
  const numericData = {
    labels: numericColumns.map((c) => c.name),
    datasets: [
      {
        label: 'Mean',
        data: numericColumns.map((c) => {
          if (c.stats?.numeric) return c.stats.numeric.mean;
          const match = c.summary.match(/Mean: ([\d.]+)/);
          return match ? parseFloat(match[1]) : 0;
        }),
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
      },
      {
        label: 'Median',
        data: numericColumns.map((c) => {
          if (c.stats?.numeric) return c.stats.numeric.median;
          const match = c.summary.match(/Median: ([\d.]+)/);
          return match ? parseFloat(match[1]) : 0;
        }),
        backgroundColor: 'rgba(16, 185, 129, 0.5)',
        borderColor: 'rgba(16, 185, 129, 1)',
        borderWidth: 1,
      },
    ],
  };

  // Enhanced sentiment data
  const sentimentCounts = textColumns.reduce((acc: any, c) => {
    if (c.stats?.text) {
      acc.Positive = (acc.Positive || 0) + c.stats.text.positive;
      acc.Negative = (acc.Negative || 0) + c.stats.text.negative;
      acc.Neutral = (acc.Neutral || 0) + c.stats.text.neutral;
    } else {
      const sentiment = c.summary.split(' ')[0]; // Extract sentiment from summary
      acc[sentiment] = (acc[sentiment] || 0) + 1;
    }
    return acc;
  }, {});

  const sentimentData = {
    labels: Object.keys(sentimentCounts),
    datasets: [
      {
        data: Object.values(sentimentCounts),
        backgroundColor: [
          'rgba(34, 197, 94, 0.5)',
          'rgba(234, 179, 8, 0.5)',
          'rgba(239, 68, 68, 0.5)',
        ],
        borderColor: [
          'rgba(34, 197, 94, 1)',
          'rgba(234, 179, 8, 1)',
          'rgba(239, 68, 68, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="space-y-6">
      {numericColumns.length > 0 && (
        <>
          <Card className="bg-white/10 backdrop-blur-lg border-white/20 shadow-xl rounded-2xl">
            <CardHeader>
              <CardTitle>Numeric Distribution</CardTitle>
              <CardDescription>Mean and Median values by column</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 sm:h-80">
                <Bar 
                  data={numericData} 
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

          {/* Statistics cards for numeric columns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {numericColumns.slice(0, 3).map((col) => {
              const stats = col.stats?.numeric;
              if (!stats) return null;
              return (
                <Card key={col.name} className="bg-white/10 backdrop-blur-lg border-white/20 shadow-xl rounded-2xl">
                  <CardHeader>
                    <CardTitle className="text-lg">{col.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Mean:</span>
                      <span className="font-medium">{stats.mean.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Median:</span>
                      <span className="font-medium">{stats.median.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Std Dev:</span>
                      <span className="font-medium">{stats.stdDev.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Range:</span>
                      <span className="font-medium">{stats.min} - {stats.max}</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}

      {Object.keys(sentimentCounts).length > 0 && (
        <Card className="bg-white/10 backdrop-blur-lg border-white/20 shadow-xl rounded-2xl">
          <CardHeader>
            <CardTitle>Sentiment Distribution</CardTitle>
            <CardDescription>Text column sentiment analysis breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 sm:h-80 flex items-center justify-center">
              <Pie 
                data={sentimentData} 
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
    </div>
  );
}

