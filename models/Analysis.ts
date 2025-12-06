import mongoose, { Schema, Document } from 'mongoose';

export interface ColumnMetadata {
  name: string;
  type: 'numeric' | 'text' | 'timestamp' | 'categorical';
  sampleValue: string;
  summary: string;
  stats?: {
    numeric?: {
      count: number;
      min: number;
      max: number;
      mean: number;
      median: number;
      mode: number | null;
      stdDev: number;
      histogramBins: { bin: string; count: number }[];
    };
    categorical?: {
      valueCounts: Record<string, number>;
      percentages: Record<string, number>;
      topCategories: { value: string; count: number; percentage: number }[];
    };
    text?: {
      sentiment: {
        positive: number;
        neutral: number;
        negative: number;
      };
      topKeywords: { word: string; count: number }[];
      sampleHighlights: string[];
      wordFrequency: Record<string, number>;
      wordCloudData: { text: string; value: number }[];
    };
    timestamp?: {
      earliest: string;
      latest: string;
      dailyFrequency: Record<string, number>;
      weeklyFrequency: Record<string, number>;
      trendLineData: { date: string; count: number }[];
    };
  };
}

export interface AnalysisDocument extends Document {
  fileName: string;
  rowCount: number;
  columns: ColumnMetadata[];
  previewRows?: any[];
  createdAt: Date;
  updatedAt: Date;
}

const ColumnMetadataSchema = new Schema<ColumnMetadata>({
  name: { type: String, required: true },
  type: { type: String, enum: ['numeric', 'text', 'timestamp', 'categorical'], required: true },
  sampleValue: { type: String, required: true },
  summary: { type: String, required: true },
  stats: { type: Schema.Types.Mixed, required: false },
});

const AnalysisSchema = new Schema<AnalysisDocument>(
  {
    fileName: { type: String, required: true },
    rowCount: { type: Number, required: true },
    columns: [ColumnMetadataSchema],
    previewRows: { type: [Schema.Types.Mixed], required: false }, // Store first 20 rows for preview
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Analysis || mongoose.model<AnalysisDocument>('Analysis', AnalysisSchema);

