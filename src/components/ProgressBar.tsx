import React, { useEffect, useState } from 'react';

interface ProgressBarProps {
  label: string;
  value: number;
  colorClass?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  label,
  value,
  colorClass = 'bg-brand-500'
}) => {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setWidth(value);
    }, 150);
    return () => clearTimeout(timer);
  }, [value]);

  // Dynamic color picker based on value if custom class not specified
  let barColor = colorClass;
  if (colorClass === 'bg-brand-500') {
    if (value >= 75) barColor = 'bg-emerald-500';
    else if (value >= 50) barColor = 'bg-amber-500';
    else barColor = 'bg-rose-500';
  }

  return (
    <div className="space-y-1.5 w-full">
      <div className="flex justify-between items-center text-xs">
        <span className="text-slate-400 font-medium">{label}</span>
        <span className="text-white font-semibold">{value}%</span>
      </div>
      <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800/40">
        <div
          className={`h-full rounded-full transition-all duration-1000 ease-out ${barColor}`}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
};
