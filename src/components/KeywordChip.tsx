import React from 'react';
import { Check, AlertCircle } from 'lucide-react';

interface KeywordChipProps {
  name: string;
  isPresent: boolean;
}

export const KeywordChip: React.FC<KeywordChipProps> = ({ name, isPresent }) => {
  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border transition-all ${
        isPresent
          ? 'bg-emerald-950/20 text-emerald-400 border-emerald-900/40 hover:bg-emerald-950/30'
          : 'bg-rose-950/20 text-rose-400 border-rose-900/40 hover:bg-rose-950/30'
      }`}
    >
      {isPresent ? (
        <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
      ) : (
        <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
      )}
      <span className="truncate max-w-[120px]">{name}</span>
    </div>
  );
};
