'use client';

import { useTheme } from '@/lib/theme-context';
import { useEffect, useState } from 'react';

interface LogoMarqueeProps {
  direction?: 'left' | 'right';
  speed?: 'slow' | 'normal' | 'fast';
  pauseOnHover?: boolean;
  className?: string;
  forceMotion?: boolean;
}

const logos = [
  // Web Technologies
  { 
    name: 'Next.js', 
    url: 'https://www.svgrepo.com/show/354112/nextjs.svg',
    isDark: true
  },
  { 
    name: 'React', 
    url: 'https://cdn-icons-png.flaticon.com/128/15772/15772797.png',
    isDark: false
  },
  { 
    name: 'TypeScript', 
    url: 'https://cdn-icons-png.flaticon.com/128/5968/5968381.png',
    isDark: false
  },
  { 
    name: 'Tailwind CSS', 
    url: 'https://www.svgrepo.com/show/374118/tailwind.svg',
    isDark: false
  },
  { 
    name: 'Vue.js', 
    url: 'https://www.svgrepo.com/show/303494/vue-9-logo.svg',
    isDark: false
  },
  { 
    name: 'Node.js', 
    url: 'https://www.svgrepo.com/show/303658/nodejs-1-logo.svg',
    isDark: false
  },
  
  // Databases & Backend
  { 
    name: 'PostgreSQL', 
    url: 'https://cdn-icons-png.flaticon.com/128/5968/5968342.png',
    isDark: false
  },
  { 
    name: 'MongoDB', 
    url: 'https://www.svgrepo.com/show/331488/mongodb.svg',
    isDark: false
  },
  { 
    name: 'Docker', 
    url: 'https://www.svgrepo.com/show/331370/docker.svg',
    isDark: false
  },
  
  // AI & Cloud Companies
  { 
    name: 'OpenAI', 
    url: 'https://www.svgrepo.com/show/306500/openai.svg',
    isDark: true
  },
  { 
    name: 'Anthropic', 
    url: 'https://img.icons8.com/?size=100&id=zQjzFjPpT2Ek&format=png&color=000000',
    isDark: false
  },
  { 
    name: 'Hugging Face', 
    url: 'https://huggingface.co/datasets/huggingface/brand-assets/resolve/main/hf-logo.svg',
    isDark: false
  },
  { 
    name: 'Google Cloud', 
    url: 'https://www.svgrepo.com/show/353805/google-cloud.svg',
    isDark: false
  },
  { 
    name: 'AWS', 
    url: 'https://www.svgrepo.com/show/448266/aws.svg',
    isDark: false
  },
  { 
    name: 'Vercel', 
    url: 'https://www.svgrepo.com/show/354512/vercel.svg',
    isDark: true
  },
  { 
    name: 'GitHub', 
    url: 'https://cdn-icons-png.flaticon.com/128/2111/2111432.png',
    isDark: true
  },
  
  // Development Tools
  { 
    name: 'VS Code', 
    url: 'https://www.svgrepo.com/show/374171/vscode.svg',
    isDark: false
  },
  { 
    name: 'Figma', 
    url: 'https://www.svgrepo.com/show/448222/figma.svg',
    isDark: false
  },
  { 
    name: 'Slack', 
    url: 'https://www.svgrepo.com/show/452102/slack.svg',
    isDark: false
  },
];

// Split logos into two sets for the two marquees
const firstHalf = logos.slice(0, Math.ceil(logos.length / 2));
const secondHalf = logos.slice(Math.ceil(logos.length / 2));

function MarqueeRow({ 
  logos, 
  direction = 'left', 
  speed = 'normal', 
  pauseOnHover = true, 
  theme, 
  forceMotion = false 
}: { 
  logos: typeof firstHalf, 
  direction: 'left' | 'right', 
  speed: string, 
  pauseOnHover: boolean, 
  theme: string,
  forceMotion: boolean 
}) {
  const [isPaused, setIsPaused] = useState(false);

  const handleMouseEnter = () => pauseOnHover && setIsPaused(true);
  const handleMouseLeave = () => pauseOnHover && setIsPaused(false);

  const duration = speed === 'slow' ? '60s' : speed === 'fast' ? '20s' : '30s';

  // Create logo elements without the trailing margin on last item
  const logoElements = logos.map((logo, index) => (
    <div
      key={index}
      className={`flex-shrink-0 flex items-center justify-center p-3 rounded-lg transition-all duration-300 grayscale hover:grayscale-0 opacity-60 hover:opacity-100 hover:scale-110 ${
        theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-black/5'
      }`}
      title={logo.name}
      style={{ marginRight: '2rem' }}
    >
      <img
        src={logo.url}
        alt={`${logo.name} logo`}
        className={`w-12 h-12 object-contain ${
          logo.isDark && theme === 'dark'
            ? 'filter brightness-0 invert opacity-70'
            : ''
        }`}
        loading="lazy"
        onError={(e) => {
          // Fallback to a simple placeholder if image fails to load
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
          const fallback = document.createElement('div');
          fallback.className = 'w-12 h-12 bg-muted rounded flex items-center justify-center text-xs font-medium';
          fallback.textContent = logo.name.charAt(0);
          target.parentElement?.appendChild(fallback);
        }}
      />
    </div>
  ));

  return (
    <div
      className="w-full overflow-hidden bg-transparent py-4"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      role="region"
      aria-label="Technology stack logos"
    >
      <div
        className={`marquee-track ${direction === 'right' ? 'reverse' : ''} ${isPaused ? 'paused' : ''}`}
        style={{
          ['--dur' as any]: duration,
        }}
      >
        <div className="marquee-content">
          {logoElements}
          {logoElements}
          {logoElements}
          {logoElements}
          {logoElements}
        </div>
      </div>
    </div>
  );
}

export default function LogoMarquee({
  direction = 'left',
  speed = 'normal',
  pauseOnHover = true,
  className = '',
  forceMotion = false,
}: LogoMarqueeProps) {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    // skeleton without animation to prevent hydration mismatch
    return (
      <div className={`w-full overflow-hidden bg-transparent py-8 ${className}`}>
        <div className="flex gap-8 items-center mb-4">
          {firstHalf.slice(0, 6).map((logo, i) => (
            <div key={i} className="flex items-center justify-center p-3 rounded-lg opacity-60">
              <div className="w-12 h-12 bg-muted rounded animate-pulse" />
            </div>
          ))}
        </div>
        <div className="flex gap-8 items-center">
          {secondHalf.slice(0, 6).map((logo, i) => (
            <div key={i} className="flex items-center justify-center p-3 rounded-lg opacity-60">
              <div className="w-12 h-12 bg-muted rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full ${className}`}>
      {/* First marquee - moving left */}
      <MarqueeRow 
        logos={firstHalf} 
        direction="left" 
        speed={speed} 
        pauseOnHover={pauseOnHover} 
        theme={theme}
        forceMotion={forceMotion}
      />
      
      {/* Second marquee - moving right */}
      <MarqueeRow 
        logos={secondHalf} 
        direction="right" 
        speed={speed} 
        pauseOnHover={pauseOnHover} 
        theme={theme}
        forceMotion={forceMotion}
      />

      {/* KEYFRAMES & animation classes made GLOBAL so they won't be hashed */}
      <style jsx global>{`
        @keyframes marqueeMove {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-20%);
          }
        }
        .marquee-track {
          display: flex;
          width: 100%;
          overflow: hidden;
          position: relative;
        }
        .marquee-content {
          display: flex;
          width: max-content;
          will-change: transform;
          animation: marqueeMove var(--dur, 30s) linear infinite;
        }
        .marquee-track.reverse .marquee-content {
          animation-direction: reverse;
        }
        .marquee-track.paused .marquee-content {
          animation-play-state: paused;
        }
        ${!forceMotion ? `
        @media (prefers-reduced-motion: reduce) {
          .marquee-track {
            animation: none !important;
          }
        }
        ` : ''}
      `}</style>
    </div>
  );
}
