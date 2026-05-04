import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Music, Image as ImageIcon, CheckCircle, Clock, AlertCircle } from 'lucide-react';

export default function Overview() {
  const stats = [
    { label: 'Total Audios', value: '124', icon: <Music className="text-cyan-400" />, trend: '+12% this week' },
    { label: 'Total Images', value: '42', icon: <ImageIcon className="text-blue-400" />, trend: '+5% this week' },
    { label: 'Approved Assets', value: '160', icon: <CheckCircle className="text-emerald-400" />, trend: '96% success rate' },
    { label: 'Pending Review', value: '6', icon: <Clock className="text-amber-400" />, trend: 'Avg. 2h wait' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="page-header">
        <h1 className="page-title">Dashboard Overview</h1>
        <p className="page-desc">Welcome back to Disperser Studio. Here's a quick look at your assets.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <Card key={i} className="bg-slate-900/40 border-slate-800 backdrop-blur-sm hover:border-cyan-500/30 transition-all group">
            <CardHeader className="pb-2">
              <div className="w-10 h-10 rounded-lg bg-slate-800/50 flex items-center justify-center mb-2 group-hover:bg-cyan-500/10 transition-colors">
                {stat.icon}
              </div>
              <CardTitle className="text-sm font-medium text-slate-400">{stat.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
              <div className="text-xs text-slate-500">{stat.trend}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
        <Card className="lg:col-span-2 bg-slate-900/40 border-slate-800 border-dashed flex flex-col items-center justify-center p-12 text-center text-slate-500">
          <AlertCircle size={48} className="mb-4 opacity-20" />
          <p>Recent activity charts will be available once you start uploading assets.</p>
        </Card>
        
        <Card className="bg-slate-900/40 border-slate-800 p-6 space-y-4">
          <h3 className="font-bold text-white mb-4">Quick Links</h3>
          <div className="space-y-2">
            <button className="w-full text-left p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors text-sm text-slate-300">
              Roblox Creator Dashboard
            </button>
            <button className="w-full text-left p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors text-sm text-slate-300">
              Community Discord
            </button>
            <button className="w-full text-left p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors text-sm text-slate-300">
              Developer API Docs
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}
