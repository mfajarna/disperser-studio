import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Music, Image as ImageIcon, CheckCircle, Clock, AlertCircle, MessageSquare, Shield, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { api } from '../api/api';
import { supabase } from '../api/supabase';

export default function Overview() {
  const userStr = localStorage.getItem('disperser_user');
  const user = userStr ? JSON.parse(userStr) : {};
  const username = user.username || 'Creator';
  const [currentRole, setCurrentRole] = useState(user.current_role || 'Free');
  const [expireDate, setExpireDate] = useState(user.subscription_expires_at 
    ? new Date(user.subscription_expires_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })
    : '-');

  const [totalAudios, setTotalAudios] = useState(0);
  const [totalApproved, setTotalApproved] = useState(0);
  const [totalPending, setTotalPending] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      const data = await api.getQueue();
      setTotalAudios(data.length);
      setTotalApproved(data.filter((item: any) => item.status === 'success').length);
      setTotalPending(data.filter((item: any) => item.status === 'pending' || item.status === 'processing').length);
      
      // Fetch latest user info
      if (user.id) {
        const { data: dbUser } = await supabase.from('users').select('current_role, subscription_expires_at').eq('id', user.id).single();
        if (dbUser) {
          setCurrentRole(dbUser.current_role);
          const newExpireDate = dbUser.subscription_expires_at 
            ? new Date(dbUser.subscription_expires_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })
            : '-';
          setExpireDate(newExpireDate);
          
          // Update localStorage
          const updatedUser = { ...user, current_role: dbUser.current_role, subscription_expires_at: dbUser.subscription_expires_at };
          localStorage.setItem('disperser_user', JSON.stringify(updatedUser));
        }
      }
    };
    fetchData();
  }, []);

  const stats = [
    { label: 'Total Audios', value: totalAudios.toString(), icon: <Music className="text-cyan-400" />, trend: 'Uploaded assets' },
    { label: 'Total Images', value: '0', icon: <ImageIcon className="text-blue-400" />, trend: 'Coming soon' },
    { label: 'Approved Assets', value: totalApproved.toString(), icon: <CheckCircle className="text-emerald-400" />, trend: 'Ready on Roblox' },
    { label: 'Pending/Processing', value: totalPending.toString(), icon: <Clock className="text-amber-400" />, trend: 'Awaiting moderation' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="page-header">
        <div className="flex items-center gap-2 text-cyan-400 text-sm font-bold mb-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          SYSTEM ONLINE
        </div>
        <h1 className="text-4xl font-black text-white tracking-tight mb-2">
          Halo, <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">{username}</span>
        </h1>
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
        <Card className="lg:col-span-2 bg-slate-900/40 border-slate-800 p-8 flex flex-col justify-center relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Crown size={120} />
          </div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2 mb-2">
            <Shield className="text-cyan-400" /> Subscription Status
          </h2>
          <p className="text-slate-400 mb-8 max-w-md">Manage your account tier to unlock higher limits and faster processing speeds.</p>
          
          <div className="flex flex-col md:flex-row gap-6">
            <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700/50 flex-1">
              <div className="text-sm text-slate-400 mb-1">Current Tier</div>
              <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                {currentRole}
              </div>
            </div>
            <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700/50 flex-1">
              <div className="text-sm text-slate-400 mb-1">Expiration Date</div>
              <div className="text-2xl font-bold text-white mt-1">
                {currentRole === 'Free' ? 'Lifetime' : expireDate}
              </div>
            </div>
          </div>

          {currentRole === 'Free' && (
             <div className="mt-6">
               <p className="text-sm text-amber-400 mb-3">You are currently on the Free tier. Upgrade to unlock bulk actions and longer audio duration limits!</p>
               <Button onClick={() => window.open('https://discord.gg/2dRtqgmKPR', '_blank')} className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold">
                 Upgrade via Discord
               </Button>
             </div>
          )}
        </Card>

        <Card className="bg-slate-900/40 border-slate-800 p-6 space-y-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                <MessageSquare className="text-indigo-400" />
              </div>
              <h3 className="font-bold text-white text-lg">Community Access</h3>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Verify your account with Discord to unlock special roles, get support, and join the community.
            </p>
          </div>

          <Button
            onClick={() => {
              const clientId = import.meta.env.VITE_DISCORD_CLIENT_ID;
              const redirectUri = encodeURIComponent(window.location.origin + '/discord-callback');
              const url = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=identify%20guilds.join`;
              window.location.href = url;
            }}
            className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white gap-2 font-bold"
          >
            <MessageSquare size={18} />
            Connect Discord
          </Button>
        </Card>

        <Card className="bg-slate-900/40 border-slate-800 p-6 space-y-4">
          <h3 className="font-bold text-white mb-4">Quick Links</h3>
          <div className="space-y-2">
            <button className="w-full text-left p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors text-sm text-slate-300">
              Roblox Creator Dashboard
            </button>
            <button
              onClick={() => window.open('https://discord.gg/2dRtqgmKPR', '_blank')}
              className="w-full text-left p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors text-sm text-slate-300"
            >
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
