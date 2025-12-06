'use client';

import { useState } from 'react';
import { FileSpreadsheet, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export default function GoogleSheetsAnalyzer() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleAnalyzeGoogleSheet = async () => {
    const url = prompt('Please enter the public Google Sheet URL:\n(Make sure the sheet is visible to "Anyone with the link")');

    if (!url) return;

    if (!url.includes('docs.google.com/spreadsheets')) {
      alert('Invalid Google Sheet URL. Please provide a valid URL.');
      return;
    }

    setLoading(true);
    try {
      // Send to API
      const uploadRes = await fetch('/api/google-sheets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sheetUrl: url,
        }),
      });

      if (uploadRes.ok) {
        const data = await uploadRes.json();
        router.push(`/analyses/${data.id}`);
        router.refresh();
      } else {
        const error = await uploadRes.json();
        alert(error.error || 'Failed to analyze sheet');
      }
    } catch (error: any) {
      console.error('Google Sheets analysis error:', error);
      alert('Failed to analyze Google Sheet. Please ensure the sheet is public.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      className="bg-white/10 backdrop-blur-lg border-white/20 hover:bg-white/20 shadow-sm"
      onClick={handleAnalyzeGoogleSheet}
      disabled={loading}
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Analyzing...
        </>
      ) : (
        <>
          <FileSpreadsheet className="w-4 h-4 mr-2" />
          Analyze Public Sheet
        </>
      )}
    </Button>
  );
}
