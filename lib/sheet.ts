import * as XLSX from 'xlsx';
import { parse } from 'csv-parse/sync';

// Excel epoch: January 1, 1900
const EXCEL_EPOCH = new Date(1900, 0, 1);
const EXCEL_EPOCH_OFFSET = 25569; // Days between 1900-01-01 and 1970-01-01

/**
 * Convert Excel serial date number to ISO timestamp
 * Excel stores dates as days since 1900-01-01
 */
export function excelSerialToDate(serial: number): string {
  // Excel incorrectly treats 1900 as a leap year, so we need to adjust
  const days = serial - 1; // Excel counts from 1, not 0
  const milliseconds = days * 24 * 60 * 60 * 1000;
  const date = new Date(EXCEL_EPOCH.getTime() + milliseconds);

  // Adjust for Excel's leap year bug (1900 was not a leap year)
  if (serial >= 60) {
    const adjustedDate = new Date(date.getTime() - 24 * 60 * 60 * 1000);
    return adjustedDate.toISOString();
  }

  return date.toISOString();
}

/**
 * Check if a number is likely an Excel serial date
 * Excel dates are typically between 1 (1900-01-01) and ~50000 (2037+)
 */
function isExcelSerialDate(value: number): boolean {
  return value >= 1 && value <= 100000 && value % 1 !== 0; // Has decimal part (time component)
}

export interface ProcessedColumn {
  name: string;
  type: 'numeric' | 'text' | 'timestamp' | 'categorical';
  values: (string | number | Date)[];
}

export interface SheetData {
  columns: ProcessedColumn[];
  rows: Record<string, any>[];
}

export interface SheetSummary {
  totalRows: number;
  totalColumns: number;
  columnTypes: {
    numeric: number;
    categorical: number;
    text: number;
    timestamp: number;
  };
  dateRange?: {
    earliest: string;
    latest: string;
  };
}

export interface ParsedSheet {
  columns: {
    name: string;
    type: 'numeric' | 'categorical' | 'text' | 'timestamp';
  }[];
  rows: any[];
  summary: SheetSummary;
}

export interface NumericStats {
  count: number;
  min: number;
  max: number;
  mean: number;
  median: number;
  mode: number | null;
  stdDev: number;
  histogramBins: { bin: string; count: number }[];
}

export interface CategoricalStats {
  valueCounts: Record<string, number>;
  percentages: Record<string, number>;
  topCategories: { value: string; count: number; percentage: number }[];
}

export interface TextStats {
  sentiment: {
    positive: number;
    neutral: number;
    negative: number;
  };
  topKeywords: { word: string; count: number }[];
  sampleHighlights: string[];
  wordFrequency: Record<string, number>;
  wordCloudData: { text: string; value: number }[];
}

export interface TimestampStats {
  earliest: string;
  latest: string;
  dailyFrequency: Record<string, number>;
  weeklyFrequency: Record<string, number>;
  trendLineData: { date: string; count: number }[];
}

export interface SheetAnalysis {
  numericStats: Record<string, NumericStats>;
  categoricalStats: Record<string, CategoricalStats>;
  textAnalysis: Record<string, TextStats>;
  timestampStats: Record<string, TimestampStats>;
}

/**
 * Enhanced column type detection
 */
export function detectColumnType(values: any[]): 'numeric' | 'text' | 'timestamp' | 'categorical' {
  const nonEmptyValues = values.filter(v => v !== null && v !== undefined && v !== '');

  if (nonEmptyValues.length === 0) {
    return 'text';
  }

  // Check for Excel serial dates (numbers that look like dates)
  const numericValues = nonEmptyValues.filter(v => typeof v === 'number');
  const excelDateCount = numericValues.filter(v => isExcelSerialDate(v)).length;
  if (excelDateCount > 0 && excelDateCount / numericValues.length > 0.5) {
    return 'timestamp';
  }

  // Check for timestamp/date patterns
  const datePattern = /^\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4}|\d{2}-\d{2}-\d{4}/;
  const isoDatePattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
  const dateCount = nonEmptyValues.filter(v => {
    if (typeof v === 'string') {
      return datePattern.test(v) || isoDatePattern.test(v) || !isNaN(Date.parse(v));
    }
    if (typeof v === 'number' && isExcelSerialDate(v)) {
      return true;
    }
    return v instanceof Date;
  }).length;

  if (dateCount / nonEmptyValues.length > 0.5) {
    return 'timestamp';
  }

  // Check for categorical (limited unique values)
  const uniqueValues = new Set(nonEmptyValues.map(v => String(v).toLowerCase().trim()));
  const uniqueRatio = uniqueValues.size / nonEmptyValues.length;
  const isCategorical = uniqueValues.size <= 20 && uniqueRatio < 0.5 && nonEmptyValues.length > 10;

  // Check for numeric
  const numericCount = nonEmptyValues.filter(v => {
    if (typeof v === 'number') return true;
    if (typeof v === 'string') {
      const trimmed = v.trim();
      if (trimmed !== '' && !isNaN(Number(trimmed)) && isFinite(Number(trimmed))) {
        // Long numeric strings are likely IDs (categorical)
        if (trimmed.length > 10 && /^\d+$/.test(trimmed)) {
          return false;
        }
        return true;
      }
    }
    return false;
  }).length;

  if (isCategorical) {
    return 'categorical';
  }

  if (numericCount / nonEmptyValues.length > 0.7) {
    return 'numeric';
  }

  return 'text';
}

/**
 * Clean and normalize data
 */
function cleanValue(value: any, columnType: string): any {
  if (value === null || value === undefined) return '';

  // Handle Excel serial dates
  if (columnType === 'timestamp' && typeof value === 'number' && isExcelSerialDate(value)) {
    return excelSerialToDate(value);
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    // Normalize whitespace
    return trimmed.replace(/\s+/g, ' ');
  }

  return value;
}

/**
 * Remove duplicate rows based on all column values
 */
function removeDuplicates(rows: Record<string, any>[]): Record<string, any>[] {
  const seen = new Set<string>();
  const unique: Record<string, any>[] = [];

  for (const row of rows) {
    const key = JSON.stringify(Object.values(row).map(v => String(v).toLowerCase().trim()));
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(row);
    }
  }

  return unique;
}

/**
 * Calculate comprehensive numeric statistics
 */
export function calculateNumericStats(values: (string | number)[], columnName: string): NumericStats {
  const numericValues = values
    .map(v => typeof v === 'string' ? parseFloat(v) : v)
    .filter(v => !isNaN(v) && isFinite(v))
    .sort((a, b) => a - b) as number[];

  if (numericValues.length === 0) {
    return {
      count: 0,
      min: 0,
      max: 0,
      mean: 0,
      median: 0,
      mode: null,
      stdDev: 0,
      histogramBins: [],
    };
  }

  const sum = numericValues.reduce((a, b) => a + b, 0);
  const mean = sum / numericValues.length;
  const median = numericValues.length % 2 === 0
    ? (numericValues[numericValues.length / 2 - 1] + numericValues[numericValues.length / 2]) / 2
    : numericValues[Math.floor(numericValues.length / 2)];

  // Calculate mode
  const frequency: Record<number, number> = {};
  numericValues.forEach(v => {
    frequency[v] = (frequency[v] || 0) + 1;
  });
  const modeEntry = Object.entries(frequency).reduce((a, b) =>
    frequency[Number(a[0])] > frequency[Number(b[0])] ? a : b,
    ['0', 0]
  );
  const mode = frequency[Number(modeEntry[0])] > 1 ? Number(modeEntry[0]) : null;

  const variance = numericValues.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / numericValues.length;
  const stdDev = Math.sqrt(variance);

  // Create histogram bins (10 bins)
  const min = numericValues[0];
  const max = numericValues[numericValues.length - 1];
  const binSize = (max - min) / 10;
  const bins: { bin: string; count: number }[] = [];

  for (let i = 0; i < 10; i++) {
    const binStart = min + i * binSize;
    const binEnd = binStart + binSize;
    const count = numericValues.filter(v => v >= binStart && (i === 9 ? v <= binEnd : v < binEnd)).length;
    bins.push({
      bin: `${binStart.toFixed(2)}-${binEnd.toFixed(2)}`,
      count,
    });
  }

  return {
    count: numericValues.length,
    min,
    max,
    mean,
    median,
    mode,
    stdDev,
    histogramBins: bins,
  };
}

/**
 * Calculate categorical statistics
 */
export function calculateCategoricalStats(values: any[]): CategoricalStats {
  const counts: Record<string, number> = {};
  const total = values.length;

  values.forEach(v => {
    const key = String(v).toLowerCase().trim();
    counts[key] = (counts[key] || 0) + 1;
  });

  const percentages: Record<string, number> = {};
  Object.keys(counts).forEach(key => {
    percentages[key] = (counts[key] / total) * 100;
  });

  const topCategories = Object.entries(counts)
    .map(([value, count]) => ({
      value,
      count,
      percentage: percentages[value],
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    valueCounts: counts,
    percentages,
    topCategories,
  };
}

/**
 * Enhanced sentiment analysis
 */
export function analyzeSentiment(text: string): 'Positive' | 'Neutral' | 'Negative' {
  const positiveWords = [
    'good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'love', 'happy',
    'pleased', 'satisfied', 'positive', 'best', 'perfect', 'awesome', 'brilliant', 'outstanding',
    'superb', 'marvelous', 'delighted', 'joyful', 'success', 'win', 'achievement'
  ];
  const negativeWords = [
    'bad', 'terrible', 'awful', 'horrible', 'hate', 'disappointed', 'angry', 'frustrated',
    'worst', 'poor', 'negative', 'sad', 'unhappy', 'disgusting', 'fail', 'failure',
    'error', 'problem', 'issue', 'broken', 'wrong', 'disaster'
  ];

  const lowerText = text.toLowerCase();
  let positiveCount = 0;
  let negativeCount = 0;

  positiveWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    positiveCount += (lowerText.match(regex) || []).length;
  });

  negativeWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    negativeCount += (lowerText.match(regex) || []).length;
  });

  if (positiveCount > negativeCount) return 'Positive';
  if (negativeCount > positiveCount) return 'Negative';
  return 'Neutral';
}

/**
 * Extract keywords from text
 */
function extractKeywords(text: string, minLength: number = 3): string[] {
  // Remove common stop words
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
    'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been', 'be', 'have', 'has', 'had',
    'do', 'does', 'did', 'will', 'would', 'should', 'could', 'may', 'might', 'must',
    'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they'
  ]);

  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length >= minLength && !stopWords.has(word));

  return words;
}

/**
 * Calculate comprehensive text statistics
 */
export function calculateTextStats(values: any[], columnName: string): TextStats {
  const textValues = values.map(v => String(v).trim()).filter(v => v.length > 0);

  // Sentiment analysis
  const sentiments = textValues.map(v => analyzeSentiment(v));
  const sentimentCounts = {
    positive: sentiments.filter(s => s === 'Positive').length,
    neutral: sentiments.filter(s => s === 'Neutral').length,
    negative: sentiments.filter(s => s === 'Negative').length,
  };

  // Extract keywords and count frequency
  const allWords: string[] = [];
  textValues.forEach(text => {
    allWords.push(...extractKeywords(text));
  });

  const wordFrequency: Record<string, number> = {};
  allWords.forEach(word => {
    wordFrequency[word] = (wordFrequency[word] || 0) + 1;
  });

  // Top keywords
  const topKeywords = Object.entries(wordFrequency)
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);

  // Sample highlights (diverse samples)
  const sampleHighlights = Array.from(new Set(textValues))
    .slice(0, 5)
    .map(v => v.length > 100 ? v.substring(0, 100) + '...' : v);

  // Word cloud data (top 50 words)
  const wordCloudData = topKeywords.slice(0, 50).map(({ word, count }) => ({
    text: word,
    value: count,
  }));

  return {
    sentiment: sentimentCounts,
    topKeywords: topKeywords.slice(0, 10),
    sampleHighlights,
    wordFrequency,
    wordCloudData,
  };
}

/**
 * Calculate timestamp statistics
 */
export function calculateTimestampStats(values: any[]): TimestampStats {
  const dates: Date[] = [];

  values.forEach(v => {
    let date: Date | null = null;

    if (typeof v === 'number' && isExcelSerialDate(v)) {
      date = new Date(excelSerialToDate(v));
    } else if (typeof v === 'string') {
      date = new Date(v);
    } else if (v instanceof Date) {
      date = v;
    }

    if (date && !isNaN(date.getTime())) {
      dates.push(date);
    }
  });

  if (dates.length === 0) {
    return {
      earliest: '',
      latest: '',
      dailyFrequency: {},
      weeklyFrequency: {},
      trendLineData: [],
    };
  }

  dates.sort((a, b) => a.getTime() - b.getTime());
  const earliest = dates[0].toISOString();
  const latest = dates[dates.length - 1].toISOString();

  // Daily frequency
  const dailyFrequency: Record<string, number> = {};
  dates.forEach(date => {
    const key = date.toISOString().split('T')[0];
    dailyFrequency[key] = (dailyFrequency[key] || 0) + 1;
  });

  // Weekly frequency (by week start)
  const weeklyFrequency: Record<string, number> = {};
  dates.forEach(date => {
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    const key = weekStart.toISOString().split('T')[0];
    weeklyFrequency[key] = (weeklyFrequency[key] || 0) + 1;
  });

  // Trend line data (aggregated by day)
  const trendLineData = Object.entries(dailyFrequency)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    earliest,
    latest,
    dailyFrequency,
    weeklyFrequency,
    trendLineData,
  };
}

/**
 * Process CSV with enhanced parsing
 */
export function processCSV(csvContent: string): ParsedSheet {
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  if (records.length === 0) {
    return {
      columns: [],
      rows: [],
      summary: {
        totalRows: 0,
        totalColumns: 0,
        columnTypes: { numeric: 0, categorical: 0, text: 0, timestamp: 0 },
      },
    };
  }

  // Clean column names
  const rawColumnNames = Object.keys(records[0]);
  const columnNames = rawColumnNames.map(name => name.trim().replace(/\s+/g, ' '));

  // Process and clean data
  const cleanedRecords = records.map((row: any) => {
    const cleaned: Record<string, any> = {};
    rawColumnNames.forEach((rawName, idx) => {
      cleaned[columnNames[idx]] = cleanValue(row[rawName], 'text');
    });
    return cleaned;
  });

  // Remove duplicates
  const uniqueRecords = removeDuplicates(cleanedRecords);

  // Detect column types
  const columns: ProcessedColumn[] = columnNames.map(name => {
    const values = uniqueRecords.map((row: any) => row[name] || '');
    const type = detectColumnType(values);

    // Clean values based on type
    const cleanedValues = values.map(v => cleanValue(v, type));

    return { name, type, values: cleanedValues };
  });

  // Generate summary
  const columnTypes = {
    numeric: columns.filter(c => c.type === 'numeric').length,
    categorical: columns.filter(c => c.type === 'categorical').length,
    text: columns.filter(c => c.type === 'text').length,
    timestamp: columns.filter(c => c.type === 'timestamp').length,
  };

  const timestampColumns = columns.filter(c => c.type === 'timestamp');
  let dateRange: { earliest: string; latest: string } | undefined;
  if (timestampColumns.length > 0) {
    const stats = calculateTimestampStats(timestampColumns[0].values);
    if (stats.earliest && stats.latest) {
      dateRange = { earliest: stats.earliest, latest: stats.latest };
    }
  }

  return {
    columns: columns.map(c => ({ name: c.name, type: c.type })),
    rows: uniqueRecords,
    summary: {
      totalRows: uniqueRecords.length,
      totalColumns: columns.length,
      columnTypes,
      dateRange,
    },
  };
}

/**
 * Process XLSX with enhanced parsing and Excel date conversion
 */
export function processXLSX(buffer: ArrayBuffer): ParsedSheet {
  const workbook = XLSX.read(buffer, {
    type: 'array',
    cellDates: false, // We'll handle dates manually
    cellNF: false,
  });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  // Get raw data with cell info
  const rawData: any[][] = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    defval: '',
    raw: false,
  });

  if (rawData.length === 0) {
    return {
      columns: [],
      rows: [],
      summary: {
        totalRows: 0,
        totalColumns: 0,
        columnTypes: { numeric: 0, categorical: 0, text: 0, timestamp: 0 },
      },
    };
  }

  // Get headers
  const headerRow = rawData[0].map((h: any) => String(h).trim().replace(/\s+/g, ' '));
  const dataRows = rawData.slice(1);

  // Process cells with Excel date detection
  const records: Record<string, any>[] = [];
  dataRows.forEach(row => {
    const record: Record<string, any> = {};
    headerRow.forEach((header, idx) => {
      let value = row[idx] || '';

      // Check if cell is an Excel date serial number
      if (typeof value === 'number') {
        const cellRef = XLSX.utils.encode_cell({ r: dataRows.indexOf(row) + 1, c: idx });
        const cell = worksheet[cellRef];

        // Check if Excel formatted this as a date
        if (cell && cell.z && (cell.z.includes('m') || cell.z.includes('d') || cell.z.includes('y'))) {
          // Excel date format detected
          if (isExcelSerialDate(value)) {
            value = excelSerialToDate(value);
          }
        } else if (isExcelSerialDate(value)) {
          // Try to detect by value range
          value = excelSerialToDate(value);
        }
      }

      record[header] = value;
    });
    if (Object.keys(record).length > 0) {
      records.push(record);
    }
  });

  if (records.length === 0) {
    return {
      columns: [],
      rows: [],
      summary: {
        totalRows: 0,
        totalColumns: 0,
        columnTypes: { numeric: 0, categorical: 0, text: 0, timestamp: 0 },
      },
    };
  }

  // Clean and process
  const cleanedRecords = records.map(row => {
    const cleaned: Record<string, any> = {};
    headerRow.forEach(header => {
      cleaned[header] = cleanValue(row[header], 'text');
    });
    return cleaned;
  });

  const uniqueRecords = removeDuplicates(cleanedRecords);

  // Detect column types
  const columns: ProcessedColumn[] = headerRow.map(name => {
    const values = uniqueRecords.map((row: any) => row[name] || '');
    const type = detectColumnType(values);
    const cleanedValues = values.map(v => cleanValue(v, type));
    return { name, type, values: cleanedValues };
  });

  // Generate summary
  const columnTypes = {
    numeric: columns.filter(c => c.type === 'numeric').length,
    categorical: columns.filter(c => c.type === 'categorical').length,
    text: columns.filter(c => c.type === 'text').length,
    timestamp: columns.filter(c => c.type === 'timestamp').length,
  };

  const timestampColumns = columns.filter(c => c.type === 'timestamp');
  let dateRange: { earliest: string; latest: string } | undefined;
  if (timestampColumns.length > 0) {
    const stats = calculateTimestampStats(timestampColumns[0].values);
    if (stats.earliest && stats.latest) {
      dateRange = { earliest: stats.earliest, latest: stats.latest };
    }
  }

  return {
    columns: columns.map(c => ({ name: c.name, type: c.type })),
    rows: uniqueRecords,
    summary: {
      totalRows: uniqueRecords.length,
      totalColumns: columns.length,
      columnTypes,
      dateRange,
    },
  };
}

/**
 * Generate comprehensive analysis
 */
export function generateAnalysis(sheetData: ParsedSheet): SheetAnalysis {
  const analysis: SheetAnalysis = {
    numericStats: {},
    categoricalStats: {},
    textAnalysis: {},
    timestampStats: {},
  };

  // Process each column based on type
  sheetData.columns.forEach(col => {
    const columnData = sheetData.rows.map(row => row[col.name]);

    switch (col.type) {
      case 'numeric':
        analysis.numericStats[col.name] = calculateNumericStats(columnData, col.name);
        break;
      case 'categorical':
        analysis.categoricalStats[col.name] = calculateCategoricalStats(columnData);
        break;
      case 'text':
        analysis.textAnalysis[col.name] = calculateTextStats(columnData, col.name);
        break;
      case 'timestamp':
        analysis.timestampStats[col.name] = calculateTimestampStats(columnData);
        break;
    }
  });

  return analysis;
}

// Legacy functions for backward compatibility
export function generateColumnSummary(column: ProcessedColumn): string {
  const nonEmptyValues = column.values.filter(v => v !== null && v !== undefined && v !== '');
  if (nonEmptyValues.length === 0) return 'No data';

  switch (column.type) {
    case 'numeric':
      const numStats = calculateNumericStats(nonEmptyValues as (string | number)[], column.name);
      return `Mean: ${numStats.mean.toFixed(2)}, Median: ${numStats.median.toFixed(2)}, Min: ${numStats.min}, Max: ${numStats.max}`;
    case 'categorical':
      const catStats = calculateCategoricalStats(nonEmptyValues);
      return `${catStats.topCategories.length} categories, Top: ${catStats.topCategories[0]?.value || 'N/A'}`;
    case 'text':
      const textStats = calculateTextStats(nonEmptyValues, column.name);
      const total = textStats.sentiment.positive + textStats.sentiment.negative + textStats.sentiment.neutral;
      const positivePct = total > 0 ? ((textStats.sentiment.positive / total) * 100).toFixed(0) : '0';
      const negativePct = total > 0 ? ((textStats.sentiment.negative / total) * 100).toFixed(0) : '0';
      return `Sentiment: ${positivePct}% positive, ${negativePct}% negative`;
    case 'timestamp':
      const tsStats = calculateTimestampStats(nonEmptyValues);
      return tsStats.earliest ? `Range: ${tsStats.earliest.split('T')[0]} to ${tsStats.latest.split('T')[0]}` : 'No dates';
    default:
      return 'N/A';
  }
}

export function getColumnStats(column: ProcessedColumn) {
  const nonEmptyValues = column.values.filter(v => v !== null && v !== undefined && v !== '');

  switch (column.type) {
    case 'numeric':
      return calculateNumericStats(nonEmptyValues as (string | number)[], column.name);
    case 'categorical':
      return calculateCategoricalStats(nonEmptyValues);
    case 'text':
      return calculateTextStats(nonEmptyValues, column.name);
    case 'timestamp':
      return calculateTimestampStats(nonEmptyValues);
    default:
      return null;
  }
}
