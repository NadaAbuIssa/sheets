import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Analysis from '@/models/Analysis';
import { processCSV, processXLSX, generateAnalysis, generateColumnSummary } from '@/lib/sheet';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    let sheetData;

    if (file.name.endsWith('.csv')) {
      const text = buffer.toString('utf-8');
      sheetData = processCSV(text);
    } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      sheetData = processXLSX(buffer.buffer);
    } else {
      return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 });
    }

    if (sheetData.columns.length === 0) {
      return NextResponse.json({ error: 'No data found in file' }, { status: 400 });
    }

    // Generate comprehensive analysis
    const analysis = generateAnalysis(sheetData);

    // Build column metadata with stats
    const columns = sheetData.columns.map(col => {
      const columnData: any = {
        name: col.name,
        type: col.type,
        sampleValue: String(sheetData.rows.find(r => r[col.name])?.[col.name] || ''),
        summary: '',
      };

      // Add stats based on column type
      if (col.type === 'numeric' && analysis.numericStats[col.name]) {
        columnData.stats = { numeric: analysis.numericStats[col.name] };
        const stats = analysis.numericStats[col.name];
        columnData.summary = `Mean: ${stats.mean.toFixed(2)}, Median: ${stats.median.toFixed(2)}, Range: ${stats.min}-${stats.max}`;
      } else if (col.type === 'categorical' && analysis.categoricalStats[col.name]) {
        columnData.stats = { categorical: analysis.categoricalStats[col.name] };
        const stats = analysis.categoricalStats[col.name];
        columnData.summary = `${stats.topCategories.length} categories, Top: ${stats.topCategories[0]?.value || 'N/A'}`;
      } else if (col.type === 'text' && analysis.textAnalysis[col.name]) {
        columnData.stats = { text: analysis.textAnalysis[col.name] };
        const stats = analysis.textAnalysis[col.name];
        const total = stats.sentiment.positive + stats.sentiment.negative + stats.sentiment.neutral;
        const positivePct = total > 0 ? ((stats.sentiment.positive / total) * 100).toFixed(0) : '0';
        columnData.summary = `Sentiment: ${positivePct}% positive, ${stats.topKeywords.length} keywords`;
      } else if (col.type === 'timestamp' && analysis.timestampStats[col.name]) {
        columnData.stats = { timestamp: analysis.timestampStats[col.name] };
        const stats = analysis.timestampStats[col.name];
        columnData.summary = stats.earliest ? `Range: ${stats.earliest.split('T')[0]} to ${stats.latest.split('T')[0]}` : 'No dates';
      } else {
        columnData.summary = 'No analysis available';
      }

      return columnData;
    });

    const newAnalysis = new Analysis({
      fileName: file.name,
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
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process file' },
      { status: 500 }
    );
  }
}

