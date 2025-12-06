import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Analysis from '@/models/Analysis';
import { processCSV, generateAnalysis } from '@/lib/sheet';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { csvData, fileName, sheetUrl } = body;

    let finalCsvData = csvData;
    let finalFileName = fileName || 'Google Sheet';

    // If sheetUrl is provided, try to fetch it
    if (sheetUrl) {
      try {
        // Convert /edit URL to /export format
        // https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit... -> https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/export?format=csv
        const match = sheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
        if (match && match[1]) {
          const spreadsheetId = match[1];
          const exportUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv`;

          const response = await fetch(exportUrl);
          if (!response.ok) {
            throw new Error(`Failed to fetch sheet: ${response.statusText}`);
          }

          finalCsvData = await response.text();
          finalFileName = `Sheet ${spreadsheetId}`;
        } else {
          throw new Error('Invalid Google Sheet URL');
        }
      } catch (err: any) {
        return NextResponse.json({ error: `Failed to fetch Google Sheet: ${err.message}` }, { status: 400 });
      }
    }

    if (!finalCsvData) {
      return NextResponse.json({ error: 'No CSV data provided' }, { status: 400 });
    }

    const sheetData = processCSV(finalCsvData);

    if (sheetData.columns.length === 0) {
      return NextResponse.json({ error: 'No data found' }, { status: 400 });
    }

    // Generate comprehensive analysis
    const analysisStats = generateAnalysis(sheetData);

    // Build column metadata with stats
    const columns = sheetData.columns.map(col => {
      const columnData: any = {
        name: col.name,
        type: col.type,
        sampleValue: String(sheetData.rows.find(r => r[col.name])?.[col.name] || ''),
        summary: '',
      };

      // Add stats based on column type
      if (col.type === 'numeric' && analysisStats.numericStats[col.name]) {
        columnData.stats = { numeric: analysisStats.numericStats[col.name] };
        const stats = analysisStats.numericStats[col.name];
        columnData.summary = `Mean: ${stats.mean.toFixed(2)}, Median: ${stats.median.toFixed(2)}, Range: ${stats.min}-${stats.max}`;
      } else if (col.type === 'categorical' && analysisStats.categoricalStats[col.name]) {
        columnData.stats = { categorical: analysisStats.categoricalStats[col.name] };
        const stats = analysisStats.categoricalStats[col.name];
        columnData.summary = `${stats.topCategories.length} categories, Top: ${stats.topCategories[0]?.value || 'N/A'}`;
      } else if (col.type === 'text' && analysisStats.textAnalysis[col.name]) {
        columnData.stats = { text: analysisStats.textAnalysis[col.name] };
        const stats = analysisStats.textAnalysis[col.name];
        const total = stats.sentiment.positive + stats.sentiment.negative + stats.sentiment.neutral;
        const positivePct = total > 0 ? ((stats.sentiment.positive / total) * 100).toFixed(0) : '0';
        columnData.summary = `Sentiment: ${positivePct}% positive, ${stats.topKeywords.length} keywords`;
      } else if (col.type === 'timestamp' && analysisStats.timestampStats[col.name]) {
        columnData.stats = { timestamp: analysisStats.timestampStats[col.name] };
        const stats = analysisStats.timestampStats[col.name];
        columnData.summary = stats.earliest ? `Range: ${stats.earliest.split('T')[0]} to ${stats.latest.split('T')[0]}` : 'No dates';
      } else {
        columnData.summary = 'No analysis available';
      }

      return columnData;
    });

    const newAnalysis = new Analysis({
      fileName: finalFileName,
      rowCount: sheetData.rows.length,
      columns,
      previewRows: sheetData.rows.slice(0, 20), // Save first 20 rows
    });

    await newAnalysis.save();

    return NextResponse.json({
      id: newAnalysis._id,
      fileName: newAnalysis.fileName,
      rowCount: newAnalysis.rowCount,
      columns: newAnalysis.columns,
      createdAt: newAnalysis.createdAt,
    });
  } catch (error: any) {
    console.error('Google Sheets upload error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process Google Sheet' },
      { status: 500 }
    );
  }
}

