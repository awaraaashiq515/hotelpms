'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Music, Calendar, Mic2, Guitar, Drum, Star,
  ArrowRight, Clock, MapPin, Ticket,
} from 'lucide-react';

const BG      = '#080d18';
const CARD_BG = '#0f172a';
const ROSE    = '#e8a0a0';
const INDIGO  = '#6366f1';

const GENRES = [
  { icon: Guitar,  label: 'Classical',    color: 'text-amber-400',  bg: 'bg-amber-500/10' },
  { icon: Mic2,    label: 'Jazz & Blues', color: 'text-violet-400', bg: 'bg-violet-500/10' },
  { icon: Music,   label: 'Bollywood',    color: 'text-rose-400',   bg: 'bg-rose-500/10' },
  { icon: Drum,    label: 'Sufi & Folk',  color: 'text-emerald-400',bg: 'bg-emerald-500/10' },
];

const UPCOMING_EVENTS = [
  {
    day: 'Fri',
    date: '30 Aug',
    title: 'Monsoon Jazz Night',
    artist: 'The Ragas Quartet',
    time: '8:00 PM – 11:00 PM',
    venue: 'Rooftop Lounge',
    genre: 'Jazz & Blues',
    status: 'Seats Available',
    statusColor: 'text-emerald-400 bg-emerald-500/10',
  },
  {
    day: 'Sat',
    date: '31 Aug',
    title: 'Bollywood Unplugged',
    artist: 'Priya & The Strings',
    time: '7:30 PM – 10:30 PM',
    venue: 'Grand Ballroom',
    genre: 'Bollywood',
    status: 'Almost Full',
    statusColor: 'text-amber-400 bg-amber-500/10',
  },
  {
    day: 'Sun',
    date: '1 Sep',
    title: 'Sufi Evening',
    artist: 'Ustad Rahman Khan',
    time: '6:00 PM – 9:00 PM',
    venue: 'Garden Terrace',
    genre: 'Sufi & Folk',
    status: 'Seats Available',
    statusColor: 'text-emerald-400 bg-emerald-500/10',
  },
  {
    day: 'Fri',
    date: '6 Sep',
    title: 'Classical Night',
    artist: 'The Carnatic Ensemble',
    time: '8:30 PM – 11:30 PM',
    venue: 'Rooftop Lounge',
    genre: 'Classical',
    status: 'Sold Out',
    statusColor: 'text-red-400 bg-red-500/10',
  },
];

const FEATURED_ARTISTS = [
  { name: 'Priya Nair',       genre: 'Bollywood Fusion', initial: 'P', color: 'bg-rose-500/20 text-rose-400',    rating: '4.9' },
  { name: 'Arjun Mehta',      genre: 'Jazz & Classical',  initial: 'A', color: 'bg-violet-500/20 text-violet-400', rating: '4.8' },
  { name: 'Ustad R. Khan',    genre: 'Sufi & Ghazal',     initial: 'U', color: 'bg-amber-500/20 text-amber-400',   rating: '5.0' },
  { name: 'The Raga Band',    genre: 'Fusion & Folk',      initial: 'T', color: 'bg-emerald-500/20 text-emerald-400',rating: '4.7' },
];

export default function LiveMusicPage() {
  const [singers, setSingers] = useState<any[]>([]);

  useEffect(() => {
    // Try to fetch singers from API
    fetch('/api/website/slider') // reusing slider as no dedicated singer API on website side
      .catch(() => {});
  }, []);

  return (
    <main style={{ background: BG, color: '#fff', minHeight: '100vh' }}>

      {/* ══ HERO ══════════════════════════════════════════════════ */}
      <section className="relative pt-32 pb-24 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          {/* Deep indigo/violet glow for music vibe */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full blur-[150px]"
            style={{ background: 'rgba(99,102,241,0.15)' }} />
          <div className="absolute bottom-0 right-1/4 w-[300px] h-[300px] rounded-full blur-[100px]"
            style={{ background: 'rgba(232,160,160,0.08)' }} />
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.5) 1px,transparent 1px)',
            backgroundSize: '80px 80px',
          }} />
          {/* Animated music notes */}
          {['♩','♪','♫','♬'].map((note, i) => (
            <div key={i} className="absolute text-4xl opacity-[0.04] animate-pulse select-none pointer-events-none"
              style={{
                top: `${20 + i * 18}%`,
                left: `${5 + i * 22}%`,
                animationDelay: `${i * 0.5}s`,
                animationDuration: `${3 + i}s`,
              }}>
              {note}
            </div>
          ))}
        </div>

        <div className="container mx-auto px-6 max-w-4xl text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-[0.2em] mb-6 border"
            style={{ background: 'rgba(99,102,241,0.12)', borderColor: `${INDIGO}40`, color: '#818cf8' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
            Live Every Weekend
          </div>

          <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-tight mb-6">
            Live Music &{' '}
            <span style={{ background: `linear-gradient(135deg,${INDIGO},#a78bfa,${ROSE})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Entertainment
            </span>
          </h1>
          <p className="text-lg max-w-xl mx-auto mb-10" style={{ color: 'rgba(255,255,255,0.45)' }}>
            Every evening comes alive with world-class performances — from soulful jazz to electrifying Bollywood nights. Book your table and let the music move you.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/contact"
              className="group px-8 py-4 rounded-2xl text-white font-bold text-sm flex items-center gap-2 transition-all hover:scale-105"
              style={{ background: `linear-gradient(135deg,${INDIGO},#818cf8)`, boxShadow: '0 0 32px rgba(99,102,241,0.4)' }}>
              <Ticket className="w-4 h-4" />
              Reserve a Table
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a href="#events"
              className="px-8 py-4 rounded-2xl font-bold text-sm transition-all hover:bg-white/5"
              style={{ border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}>
              View Schedule
            </a>
          </div>
        </div>
      </section>

      {/* ══ GENRES ════════════════════════════════════════════════ */}
      <section className="pb-16 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {GENRES.map((g, i) => (
              <div key={i} className="flex flex-col items-center gap-3 p-6 rounded-2xl border border-slate-800 text-center transition-all hover:border-slate-700 hover:scale-[1.03]"
                style={{ background: CARD_BG }}>
                <div className={`w-12 h-12 rounded-2xl ${g.bg} ${g.color} flex items-center justify-center`}>
                  <g.icon className="w-5 h-5" strokeWidth={1.8} />
                </div>
                <span className="text-sm font-bold text-white">{g.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ UPCOMING EVENTS ═══════════════════════════════════════ */}
      <section id="events" className="py-24">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="flex items-center justify-between mb-12 flex-wrap gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-[0.3em] block mb-2" style={{ color: '#818cf8' }}>Schedule</span>
              <h2 className="text-3xl md:text-4xl font-black text-white">Upcoming Performances</h2>
            </div>
            <Link href="/contact" className="text-sm font-bold flex items-center gap-2 hover:gap-3 transition-all" style={{ color: '#818cf8' }}>
              Book Table <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="space-y-4">
            {UPCOMING_EVENTS.map((event, i) => (
              <div key={i}
                className="flex flex-col md:flex-row items-start md:items-center gap-4 p-5 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all hover:bg-white/[0.015]"
                style={{ background: CARD_BG }}>
                {/* Date */}
                <div className="flex-shrink-0 w-16 text-center p-2 rounded-xl" style={{ background: 'rgba(99,102,241,0.1)' }}>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">{event.day}</div>
                  <div className="text-lg font-black text-white">{event.date.split(' ')[0]}</div>
                  <div className="text-[9px] text-slate-500 uppercase">{event.date.split(' ')[1]}</div>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-bold text-white mb-1">{event.title}</h3>
                  <div className="flex items-center gap-4 flex-wrap text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>
                    <span className="flex items-center gap-1"><Mic2 className="w-3 h-3" /> {event.artist}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {event.time}</span>
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {event.venue}</span>
                  </div>
                </div>

                {/* Genre + Status */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-400">
                    {event.genre}
                  </span>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg ${event.statusColor}`}>
                    {event.status}
                  </span>
                </div>

                <Link href="/contact"
                  className="flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all hover:opacity-90"
                  style={{ background: event.status === 'Sold Out' ? 'rgba(255,255,255,0.05)' : `linear-gradient(135deg,${INDIGO},#818cf8)`, color: event.status === 'Sold Out' ? 'rgba(255,255,255,0.3)' : '#fff' }}>
                  {event.status === 'Sold Out' ? 'Waitlist' : 'Book Table'}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FEATURED ARTISTS ══════════════════════════════════════ */}
      <section className="py-20 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(15,23,42,0.6)' }}>
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="text-center mb-12">
            <span className="text-xs font-bold uppercase tracking-[0.3em] block mb-3" style={{ color: '#818cf8' }}>Resident Artists</span>
            <h2 className="text-3xl md:text-4xl font-black text-white">Featured Performers</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {FEATURED_ARTISTS.map((artist, i) => (
              <div key={i} className="text-center p-6 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all hover:scale-[1.03]"
                style={{ background: CARD_BG }}>
                <div className={`w-16 h-16 rounded-2xl ${artist.color} flex items-center justify-center mx-auto mb-4 text-2xl font-black`}>
                  {artist.initial}
                </div>
                <div className="text-sm font-bold text-white mb-1">{artist.name}</div>
                <div className="text-xs text-slate-500 mb-3">{artist.genre}</div>
                <div className="flex items-center justify-center gap-1">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  <span className="text-xs font-bold text-amber-400">{artist.rating}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ CTA ═══════════════════════════════════════════════════ */}
      <section className="py-24 text-center relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[500px] h-[300px] rounded-full blur-[120px]" style={{ background: 'rgba(99,102,241,0.15)' }} />
        </div>
        <div className="container mx-auto px-6 max-w-xl relative z-10">
          <h2 className="text-4xl font-black text-white mb-4">
            Don&apos;t Miss the{' '}
            <span style={{ background: `linear-gradient(135deg,${INDIGO},#a78bfa)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Show
            </span>
          </h2>
          <p className="text-base mb-8" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Reserve your table in advance and enjoy an unforgettable evening of live music, fine dining and great company.
          </p>
          <Link href="/contact"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-white text-sm font-bold transition-all hover:scale-105"
            style={{ background: `linear-gradient(135deg,${INDIGO},#818cf8)`, boxShadow: '0 0 28px rgba(99,102,241,0.35)' }}>
            <Ticket className="w-4 h-4" />
            Reserve Your Table
          </Link>
        </div>
      </section>

    </main>
  );
}
