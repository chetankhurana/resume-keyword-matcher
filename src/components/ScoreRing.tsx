import React, { useEffect, useState } from 'react';

interface ScoreRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
}

export const ScoreRing: React.FC<ScoreRingProps> = ({
  score,
  size = 140,
  strokeWidth = 10,
}) => {
  const [animatedScore, setAnimatedScore] = useState(0);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedScore(score);
    }, 150);
    return () => clearTimeout(timer);
  }, [score]);

  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (animatedScore / 100) * circumference;

  // Determine color theme based on score
  let scoreBg = 'stroke-rose-950/30';
  let textColor = 'text-rose-400';
  let label = 'Weak Match';

  if (score >= 75) {
    scoreBg = 'stroke-emerald-950/30';
    textColor = 'text-emerald-400';
    label = 'Strong Match';
  } else if (score >= 50) {
    scoreBg = 'stroke-orange-950/30';
    textColor = 'text-amber-400';
    label = 'Good Match';
  }

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="w-full h-full transform -rotate-90">
          {/* Background circle */}
          <circle
            className={`fill-none ${scoreBg}`}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
          />
          {/* Animated score stroke */}
          <circle
            className="fill-none transition-all duration-1000 ease-out"
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            stroke={animatedScore >= 75 ? 'url(#gradient-emerald)' : animatedScore >= 50 ? 'url(#gradient-amber)' : 'url(#gradient-red)'}
          />
          {/* Gradient definitions */}
          <defs>
            <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" className="text-brand-400" stopColor="currentColor" />
              <stop offset="100%" className="text-brand-600" stopColor="currentColor" />
            </linearGradient>
            {/* Fallback gradients if color scheme overrides needed */}
            <linearGradient id="gradient-emerald" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#34d399" />
              <stop offset="100%" stopColor="#14b8a6" />
            </linearGradient>
            <linearGradient id="gradient-amber" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#f97316" />
            </linearGradient>
            <linearGradient id="gradient-red" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f87171" />
              <stop offset="100%" stopColor="#e11d48" />
            </linearGradient>
          </defs>
        </svg>

        {/* Inner text content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-3xl font-extrabold tracking-tight text-white">
            {animatedScore}%
          </span>
          <span className="text-[10px] uppercase font-semibold text-slate-400 mt-0.5">
            ATS Score
          </span>
        </div>
      </div>
      
      {/* Compatibility Badge */}
      <span className={`mt-4 px-3 py-1 text-xs font-semibold rounded-full bg-slate-900 border border-slate-800 ${textColor}`}>
        {label}
      </span>
    </div>
  );
};
