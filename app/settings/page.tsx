'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';

export default function SettingsPage() {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setDarkMode(isDark);
  }, []);

  const toggleDarkMode = (checked: boolean) => {
    setDarkMode(checked);
    if (checked) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 lg:ml-64 p-4 sm:p-6 lg:p-8 transition-all duration-300">
        <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
          <h1 className="text-2xl sm:text-3xl font-bold">Settings</h1>

          <Card className="bg-white/10 backdrop-blur-lg border-white/20 shadow-xl rounded-2xl">
            <CardHeader>
              <CardTitle>User Profile</CardTitle>
              <CardDescription>Your account information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" defaultValue="John Doe" disabled className="bg-white/10 backdrop-blur-lg border-white/20" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" defaultValue="john.doe@example.com" disabled className="bg-white/10 backdrop-blur-lg border-white/20" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-lg border-white/20 shadow-xl rounded-2xl">
            <CardHeader>
              <CardTitle>API Keys</CardTitle>
              <CardDescription>Manage your API keys</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="api-key">Google Sheets API Key</Label>
                <Input id="api-key" type="password" placeholder="Enter API key" className="bg-white/10 backdrop-blur-lg border-white/20" />
              </div>
              <Button variant="outline" className="bg-white/10 backdrop-blur-lg border-white/20 hover:bg-white/20">
                Save API Key
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-lg border-white/20 shadow-xl rounded-2xl">
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>Customize the appearance of the application</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="dark-mode">Dark Mode</Label>
                  <p className="text-sm text-muted-foreground">Toggle dark/light mode</p>
                </div>
                <Switch id="dark-mode" checked={darkMode} onCheckedChange={toggleDarkMode} />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-lg border-white/20 shadow-xl rounded-2xl border-red-500/20">
            <CardHeader>
              <CardTitle className="text-red-500">Danger Zone</CardTitle>
              <CardDescription>Manage your data</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-red-500">Clear All Data</Label>
                  <p className="text-sm text-muted-foreground">Permanently delete all analyses</p>
                </div>
                <Button
                  variant="destructive"
                  onClick={async () => {
                    if (confirm('Are you sure you want to delete all data? This cannot be undone.')) {
                      try {
                        const res = await fetch('/api/analyses', { method: 'DELETE' });
                        if (res.ok) {
                          alert('All data deleted successfully');
                          window.location.reload();
                        } else {
                          alert('Failed to delete data');
                        }
                      } catch (e) {
                        alert('Error deleting data');
                      }
                    }
                  }}
                >
                  Clear Data
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

