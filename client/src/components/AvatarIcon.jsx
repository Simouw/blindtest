import React from 'react';
import { 
  Headphones, 
  Mic, 
  Flame, 
  Zap, 
  Sparkles, 
  Disc, 
  Radio, 
  Music2, 
  Trophy, 
  ShieldCheck 
} from 'lucide-react';

export const AVATAR_OPTIONS = [
  { id: 'headphones', label: 'Audio', icon: Headphones, color: 'text-violet-400', border: 'border-violet-500/30 bg-violet-500/15' },
  { id: 'mic', label: 'Vocal', icon: Mic, color: 'text-pink-400', border: 'border-pink-500/30 bg-pink-500/15' },
  { id: 'flame', label: 'Fire', icon: Flame, color: 'text-amber-400', border: 'border-amber-500/30 bg-amber-500/15' },
  { id: 'zap', label: 'Electro', icon: Zap, color: 'text-yellow-400', border: 'border-yellow-500/30 bg-yellow-500/15' },
  { id: 'sparkles', label: 'Star', icon: Sparkles, color: 'text-cyan-400', border: 'border-cyan-500/30 bg-cyan-500/15' },
  { id: 'disc', label: 'Vinyl', icon: Disc, color: 'text-emerald-400', border: 'border-emerald-500/30 bg-emerald-500/15' },
  { id: 'radio', label: 'Radio', icon: Radio, color: 'text-indigo-400', border: 'border-indigo-500/30 bg-indigo-500/15' },
  { id: 'music', label: 'Melody', icon: Music2, color: 'text-purple-400', border: 'border-purple-500/30 bg-purple-500/15' },
  { id: 'trophy', label: 'Champ', icon: Trophy, color: 'text-amber-300', border: 'border-amber-400/30 bg-amber-400/15' },
  { id: 'shield', label: 'Elite', icon: ShieldCheck, color: 'text-slate-300', border: 'border-slate-500/30 bg-slate-500/15' }
];

export default function AvatarIcon({ id = 'headphones', className = 'w-4 h-4', containerClassName = 'p-1.5' }) {
  const avatar = AVATAR_OPTIONS.find(a => a.id === id) || AVATAR_OPTIONS[0];
  const IconComponent = avatar.icon;

  return (
    <div className={`inline-flex items-center justify-center rounded-xl border ${avatar.border} ${avatar.color} ${containerClassName} shrink-0`}>
      <IconComponent className={className} />
    </div>
  );
}

