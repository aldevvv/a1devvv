'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTheme } from '@/lib/theme-context';
import { 
  Home, 
  Search, 
  Grid3X3, 
  MessageCircle, 
  ArrowRight, 
  Wifi, 
  Server, 
  AlertTriangle, 
  Clock, 
  Zap,
  Code,
  BookOpen,
  Users,
  BarChart3
} from 'lucide-react';

export default function NotFound() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    setMounted(true);
    
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
      }));
    };
    
    updateTime();
    const timeInterval = setInterval(updateTime, 1000);
    
    return () => clearInterval(timeInterval);
  }, []);

  if (!mounted) return null;

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`;
    }
  };

  return (
    <>
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        
        @keyframes slideInUp {
          from { transform: translateY(50px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .float-animation {
          animation: float 3s ease-in-out infinite;
        }
        
        .slide-up {
          animation: slideInUp 0.6s ease-out forwards;
          opacity: 0;
        }
        
        .fade-in {
          animation: fadeIn 0.8s ease-out forwards;
        }
        
        .pulse-animation {
          animation: pulse 2s ease-in-out infinite;
        }
        
        .shimmer::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          animation: shimmer 2s infinite;
        }
        
        .spin-slow {
          animation: spin-slow 20s linear infinite;
        }
        
        @media (prefers-reduced-motion: reduce) {
          * {
            animation: none !important;
          }
        }
      `}</style>

      <div className={`min-h-screen relative ${
        theme === 'dark' ? 'bg-black' : 'bg-white'
      }`}>
        
        {/* Minimal Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-current to-transparent" 
               style={{ 
                 backgroundImage: `radial-gradient(circle at 25% 25%, ${theme === 'dark' ? '#00bcd4' : 'black'} 2px, transparent 2px)`,
                 backgroundSize: '50px 50px'
               }} />
        </div>

        {/* Header */}
        <header className="relative z-20 p-6">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                theme === 'dark' ? 'bg-[#00bcd4]' : 'bg-black'
              }`}>
                <Code className={`w-5 h-5 ${theme === 'dark' ? 'text-black' : 'text-white'}`} />
              </div>
              <span className={`font-bold text-lg ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
                System
              </span>
            </div>
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-mono ${
              theme === 'dark' ? 'bg-white/5 text-white/60' : 'bg-black/5 text-black/60'
            }`}>
              <Clock className="w-4 h-4" />
              {currentTime}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="relative z-10 flex flex-col items-center justify-center min-h-[80vh] px-6 py-12">
          
          {/* 404 Number */}
          <div className="text-center mb-12 slide-up">
            <div className="relative inline-block">
              <h1 className={`text-[12rem] md:text-[18rem] font-black leading-none select-none ${
                theme === 'dark' ? 'text-[#00bcd4]' : 'text-black'
              }`}
              style={{
                textShadow: theme === 'dark' 
                  ? '0 0 50px rgba(0,188,212,0.3)' 
                  : '0 10px 30px rgba(0,0,0,0.1)'
              }}>
                404
              </h1>
              {/* Floating accent */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <div className={`w-32 h-32 rounded-full border-4 opacity-20 float-animation ${
                  theme === 'dark' ? 'border-white' : 'border-[#00bcd4]'
                }`} style={{ animationDelay: '1s' }} />
              </div>
            </div>
          </div>

          {/* Error Message */}
          <div className="text-center mb-16 max-w-2xl slide-up" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center justify-center gap-3 mb-6">
              <AlertTriangle className={`w-8 h-8 ${theme === 'dark' ? 'text-[#00bcd4]' : 'text-black'}`} />
              <h2 className={`text-4xl md:text-5xl font-bold ${
                theme === 'dark' ? 'text-white' : 'text-black'
              }`}>
                Page Not Found
              </h2>
            </div>
            <p className={`text-xl leading-relaxed ${
              theme === 'dark' ? 'text-white/70' : 'text-black/70'
            }`}>
              The page you're looking for seems to have vanished into the digital void.
              <br />Let's help you find your way back.
            </p>
          </div>

          {/* Search Bar */}
          <div className="w-full max-w-md mb-12 slide-up" style={{ animationDelay: '0.4s' }}>
            <form onSubmit={handleSearch} className="relative">
              <div className="relative overflow-hidden rounded-2xl">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for content..."
                  className={`w-full px-6 py-4 pr-14 text-lg border-2 rounded-2xl transition-all duration-300 focus:outline-none focus:scale-[1.02] ${
                    theme === 'dark'
                      ? 'bg-white/5 border-white/10 text-white placeholder-white/40 focus:border-[#00bcd4] focus:bg-white/10'
                      : 'bg-black/5 border-black/10 text-black placeholder-black/40 focus:border-[#00bcd4] focus:bg-white shadow-lg'
                  }`}
                />
                <button
                  type="submit"
                  className={`absolute right-2 top-2 p-3 rounded-xl transition-all duration-300 hover:scale-110 ${
                    theme === 'dark'
                      ? 'bg-[#00bcd4] text-black hover:bg-[#00acc1]'
                      : 'bg-[#00bcd4] text-white hover:bg-[#00acc1]'
                  }`}
                >
                  <Search className="w-5 h-5" />
                </button>
              </div>
            </form>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap justify-center gap-6 mb-16 slide-up" style={{ animationDelay: '0.6s' }}>
            {/* Home Button */}
            <Link href="/">
              <button className={`group relative px-8 py-4 rounded-2xl font-semibold text-lg transition-all duration-300 overflow-hidden ${
                theme === 'dark'
                  ? 'bg-[#00bcd4] text-black hover:bg-[#00acc1] hover:shadow-[0_0_30px_rgba(0,188,212,0.4)]'
                  : 'bg-[#00bcd4] text-white hover:bg-[#00acc1] shadow-xl hover:shadow-2xl'
              }`}>
                <div className="relative flex items-center gap-3 z-10">
                  <Home className="w-5 h-5" />
                  <span>Go Home</span>
                </div>
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700 ease-out" />
              </button>
            </Link>

            {/* Categories Button */}
            <Link href="/categories">
              <button className={`group relative px-8 py-4 rounded-2xl font-semibold text-lg border-2 transition-all duration-300 hover:scale-105 ${
                theme === 'dark'
                  ? 'border-white/20 text-white hover:border-white hover:bg-white hover:text-black'
                  : 'border-black/20 text-black hover:border-black hover:bg-black hover:text-white'
              }`}>
                <div className="flex items-center gap-3">
                  <Grid3X3 className="w-5 h-5" />
                  <span>Explore</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </div>
              </button>
            </Link>

            {/* Support Button */}
            <Link href="/contact">
              <button className={`group relative px-8 py-4 rounded-2xl font-semibold text-lg border-2 transition-all duration-300 hover:scale-105 ${
                theme === 'dark'
                  ? 'border-[#00bcd4]/40 text-[#00bcd4] hover:border-[#00bcd4] hover:bg-[#00bcd4] hover:text-black'
                  : 'border-[#00bcd4]/40 text-[#00bcd4] hover:border-[#00bcd4] hover:bg-[#00bcd4] hover:text-white'
              }`}>
                <div className="flex items-center gap-3">
                  <MessageCircle className="w-5 h-5" />
                  <span>Get Help</span>
                </div>
              </button>
            </Link>
          </div>

          {/* Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl w-full slide-up" style={{ animationDelay: '0.8s' }}>
            {/* Error Status */}
            <div className={`relative p-6 rounded-3xl border transition-all duration-300 hover:scale-105 group ${
              theme === 'dark'
                ? 'bg-red-500/5 border-red-500/20 hover:border-red-500/40'
                : 'bg-red-50 border-red-200 hover:border-red-400'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <AlertTriangle className={`w-8 h-8 ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`} />
                <div className="w-3 h-3 bg-red-500 rounded-full pulse-animation" />
              </div>
              <h3 className={`text-2xl font-bold mb-2 ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`}>
                404
              </h3>
              <p className={`font-medium mb-1 ${theme === 'dark' ? 'text-red-300' : 'text-red-700'}`}>
                Resource Not Found
              </p>
              <p className={`text-sm opacity-70 ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`}>
                The requested page is missing
              </p>
            </div>

            {/* System Status */}
            <div className={`relative p-6 rounded-3xl border transition-all duration-300 hover:scale-105 group ${
              theme === 'dark'
                ? 'bg-green-500/5 border-green-500/20 hover:border-green-500/40'
                : 'bg-green-50 border-green-200 hover:border-green-400'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <Server className={`w-8 h-8 ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`} />
                <div className="w-3 h-3 bg-green-500 rounded-full pulse-animation" />
              </div>
              <h3 className={`text-2xl font-bold mb-2 ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>
                Online
              </h3>
              <p className={`font-medium mb-1 ${theme === 'dark' ? 'text-green-300' : 'text-green-700'}`}>
                System Status
              </p>
              <p className={`text-sm opacity-70 ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>
                All services operational
              </p>
            </div>

            {/* Network Status */}
            <div className={`relative p-6 rounded-3xl border transition-all duration-300 hover:scale-105 group ${
              theme === 'dark'
                ? 'bg-[#00bcd4]/5 border-[#00bcd4]/20 hover:border-[#00bcd4]/40'
                : 'bg-[#00bcd4]/5 border-[#00bcd4]/20 hover:border-[#00bcd4]/40'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <Wifi className={`w-8 h-8 text-[#00bcd4]`} />
                <div className="w-3 h-3 bg-[#00bcd4] rounded-full pulse-animation" />
              </div>
              <h3 className={`text-2xl font-bold mb-2 text-[#00bcd4]`}>
                99.9%
              </h3>
              <p className={`font-medium mb-1 text-[#00bcd4]`}>
                Network Uptime
              </p>
              <p className={`text-sm opacity-70 text-[#00bcd4]`}>
                Connection stable
              </p>
            </div>
          </div>

          {/* Quick Links */}
          <div className="mt-16 w-full max-w-4xl slide-up" style={{ animationDelay: '1s' }}>
            <h3 className={`text-center text-xl font-semibold mb-8 ${
              theme === 'dark' ? 'text-white' : 'text-black'
            }`}>
              Popular Destinations
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                { icon: BookOpen, label: 'Docs', href: '/docs' },
                { icon: Zap, label: 'API', href: '/api' },
                { icon: Users, label: 'Community', href: '/community' },
                { icon: BarChart3, label: 'Analytics', href: '/analytics' },
                { icon: MessageCircle, label: 'Support', href: '/support' }
              ].map((item, index) => (
                <Link key={index} href={item.href}>
                  <button className={`group w-full p-4 rounded-2xl text-center transition-all duration-300 hover:scale-105 ${
                    theme === 'dark'
                      ? 'bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 hover:border-white/20'
                      : 'bg-black/5 hover:bg-black/10 text-black/70 hover:text-black border border-black/10 hover:border-black/20'
                  }`}>
                    <item.icon className={`w-6 h-6 mx-auto mb-2 transition-colors ${
                      theme === 'dark' ? 'group-hover:text-[#00bcd4]' : 'group-hover:text-[#00bcd4]'
                    }`} />
                    <span className="text-sm font-medium">{item.label}</span>
                  </button>
                </Link>
              ))}
            </div>
          </div>
        </main>

        {/* Decorative Elements */}
        <div className="absolute top-20 right-20 w-16 h-16 opacity-10 pointer-events-none">
          <div className={`w-full h-full rounded-full border-2 spin-slow ${
            theme === 'dark' ? 'border-[#00bcd4]' : 'border-black'
          }`} />
        </div>
        <div className="absolute bottom-20 left-20 w-12 h-12 opacity-10 pointer-events-none">
          <div className={`w-full h-full rotate-45 border-2 float-animation ${
            theme === 'dark' ? 'border-white' : 'border-[#00bcd4]'
          }`} style={{ animationDelay: '2s' }} />
        </div>
      </div>
    </>
  );
}