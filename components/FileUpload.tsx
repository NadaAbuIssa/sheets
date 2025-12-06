'use client';

import { useState } from 'react';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export default function FileUpload() {
  const [uploading, setUploading] = useState(false);
  const router = useRouter();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        router.push(`/analyses/${data.id}`);
        router.refresh();
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to upload file');
      }
    } catch (error) {
      alert('Failed to upload file');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div>
      <input
        type="file"
        id="file-upload"
        accept=".csv,.xlsx,.xls"
        onChange={handleFileUpload}
        className="hidden"
        disabled={uploading}
      />
      <Button
        variant="outline"
        className="bg-white/10 backdrop-blur-lg border-white/20 hover:bg-white/20"
        onClick={() => document.getElementById('file-upload')?.click()}
        disabled={uploading}
      >
        <Upload className="w-4 h-4 mr-2" />
        {uploading ? 'Uploading...' : 'Upload File'}
      </Button>
    </div>
  );
}

