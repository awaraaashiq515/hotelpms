'use client';

import React from 'react';
import { Music } from 'lucide-react';

interface SingerRegistrationFormProps {
  genre: string;
  setGenre: (v: string) => void;
  bio: string;
  setBio: (v: string) => void;
}

export function SingerRegistrationForm({
  genre, setGenre,
  bio, setBio,
}: SingerRegistrationFormProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
          Music Genre
        </label>
        <div className="relative">
          <Music size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <select
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-slate-950/80 border border-white/15 rounded-2xl text-sm font-medium text-white focus:border-violet-500 outline-none"
          >
            <option value="Bollywood">Bollywood & Sufi</option>
            <option value="Pop">Pop & Acoustic</option>
            <option value="Rock">Rock & Metal</option>
            <option value="Classical">Indian Classical / Gazal</option>
            <option value="DJ">DJ & EDM</option>
            <option value="Punjabi">Punjabi Folk & Beats</option>
            <option value="Instrumental">Guitar / Saxophone / Piano</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
          Short Artist Bio
        </label>
        <textarea
          rows={2}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          className="w-full px-4 py-3 bg-slate-950/80 border border-white/15 rounded-2xl text-sm font-medium text-white placeholder-slate-500 focus:border-violet-500 outline-none resize-none"
          placeholder="e.g. Live singer with 5+ years experience in hotel lounges."
        />
      </div>
    </div>
  );
}
