'use client';

import { useTheme } from '@/lib/theme-context';
import LogoMarquee from '@/components/logo-marquee';

export default function Page() {
  const { theme } = useTheme();
  
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className={`relative overflow-hidden py-20 sm:py-32 ${theme === 'dark' ? 'bg-black' : 'bg-background'}`}>
        {/* Background Effects */}
        <div className="absolute inset-0">
          {theme === 'dark' && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-neon-blue/5 rounded-full blur-3xl" />
          )}
        </div>

        <div className="relative container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            {/* Main Headline */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
              <span className="block">Next Generation</span>
              <span className={`block ${theme === 'dark' ? 'text-neon-blue' : 'text-primary'}`}>
                Developer Platform
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-xl sm:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
              Showcase your projects, connect with developers, and build the future of technology together.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
              <a
                href="/register"
                className={`inline-flex items-center justify-center px-8 py-4 text-lg font-medium rounded-lg transition-all duration-300 ${
                  theme === 'dark'
                    ? 'bg-neon-blue text-background hover:bg-neon-blue/90'
                    : 'bg-primary text-primary-foreground hover:bg-primary/90'
                } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`}
              >
                Get Started Free
              </a>
              
              <a
                href="/login"
                className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium rounded-lg border border-border bg-card text-card-foreground hover:bg-accent hover:text-accent-foreground transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                Sign In
              </a>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-2xl mx-auto">
              <div className="text-center">
                <div className={`text-3xl font-bold ${theme === 'dark' ? 'text-neon-blue' : 'text-primary'} mb-2`}>10K+</div>
                <div className="text-sm text-muted-foreground">Active Developers</div>
              </div>
              <div className="text-center">
                <div className={`text-3xl font-bold ${theme === 'dark' ? 'text-neon-blue' : 'text-primary'} mb-2`}>25K+</div>
                <div className="text-sm text-muted-foreground">Projects Showcased</div>
              </div>
              <div className="text-center">
                <div className={`text-3xl font-bold ${theme === 'dark' ? 'text-neon-blue' : 'text-primary'} mb-2`}>100K+</div>
                <div className="text-sm text-muted-foreground">Lines of Code</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Logo Marquee */}
      <section className={`relative ${theme === 'dark' ? 'bg-black' : 'bg-background'}`}>
        <LogoMarquee
          direction="left"
          speed="normal"
          className=""
        />
      </section>

      {/* Features Section */}
      <section className="py-20 relative">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              <span className={theme === 'dark' ? 'text-neon-blue' : 'text-primary'}>
                Powerful Features
              </span>
            </h2>
            <p className="text-xl text-muted-foreground">
              Everything you need to showcase your development skills and connect with the community.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className={`p-6 rounded-lg border border-border bg-card hover:bg-accent transition-all duration-300 ${theme === 'dark' ? 'hover:border-neon-blue/50' : 'hover:border-primary/50'}`}>
              <div className={`w-12 h-12 rounded-lg ${theme === 'dark' ? 'bg-neon-blue/10' : 'bg-primary/10'} flex items-center justify-center mb-4`}>
                <svg className={`w-6 h-6 ${theme === 'dark' ? 'text-neon-blue' : 'text-primary'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Project Showcase</h3>
              <p className="text-muted-foreground">Display your projects with live demos, source code, and detailed documentation.</p>
            </div>

            {/* Feature 2 */}
            <div className={`p-6 rounded-lg border border-border bg-card hover:bg-accent transition-all duration-300 ${theme === 'dark' ? 'hover:border-neon-blue/50' : 'hover:border-primary/50'}`}>
              <div className={`w-12 h-12 rounded-lg ${theme === 'dark' ? 'bg-neon-blue/10' : 'bg-primary/10'} flex items-center justify-center mb-4`}>
                <svg className={`w-6 h-6 ${theme === 'dark' ? 'text-neon-blue' : 'text-primary'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Developer Network</h3>
              <p className="text-muted-foreground">Connect with like-minded developers and collaborate on exciting projects.</p>
            </div>

            {/* Feature 3 */}
            <div className={`p-6 rounded-lg border border-border bg-card hover:bg-accent transition-all duration-300 ${theme === 'dark' ? 'hover:border-neon-blue/50' : 'hover:border-primary/50'}`}>
              <div className={`w-12 h-12 rounded-lg ${theme === 'dark' ? 'bg-neon-blue/10' : 'bg-primary/10'} flex items-center justify-center mb-4`}>
                <svg className={`w-6 h-6 ${theme === 'dark' ? 'text-neon-blue' : 'text-primary'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Analytics & Insights</h3>
              <p className="text-muted-foreground">Track your project performance and get insights into your development journey.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={`py-20 relative overflow-hidden ${theme === 'dark' ? 'bg-dark-surface' : 'bg-muted'}`}>
        {theme === 'dark' && (
          <div className="absolute inset-0">
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-96 h-96 bg-neon-blue/5 rounded-full blur-3xl" />
          </div>
        )}
        
        <div className="relative container mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Ready to showcase your work?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of developers who are already building their presence on A1Dev.
          </p>
          <a
            href="/register"
            className={`inline-flex items-center justify-center px-8 py-4 text-lg font-medium rounded-lg transition-all duration-300 ${
              theme === 'dark'
                ? 'bg-neon-blue text-background hover:bg-neon-blue/90'
                : 'bg-primary text-primary-foreground hover:bg-primary/90'
            } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`}
          >
            Start Building Today
          </a>
        </div>
      </section>
    </div>
  );
}