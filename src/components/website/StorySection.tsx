'use client';

import React, { useState, useEffect } from 'react';

interface Settings {
  storyTitle: string;
  storyContent: string;
  storyImage1: string | null;
  storyImage2: string | null;
}

export const StorySection = () => {
  const [settings, setSettings] = useState<Settings | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/website/settings');
        const json = await res.json();
        if (json.success) setSettings(json.data);
      } catch (err) {
        console.error('Failed to fetch settings', err);
      }
    };
    fetchSettings();
  }, []);

  if (!settings) return null;

  return (
    <section id="story" className="py-24 px-6 lg:px-12 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-16 items-center">
        {/* Images */}
        <div className="lg:w-1/2 relative flex">
          <div className="w-2/3 aspect-[4/5] rounded-2xl overflow-hidden shadow-2xl z-10">
            <img
              src={settings.storyImage1 || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=1000'}
              alt="Restaurant Operations"
              className="w-full h-full object-cover transform hover:scale-110 transition-transform duration-700"
            />
          </div>
          <div className="w-1/2 aspect-square absolute -bottom-10 -right-4 rounded-2xl overflow-hidden shadow-2xl border-8 border-white z-20">
            <img
              src={settings.storyImage2 || 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&q=80&w=1000'}
              alt="OrderMint in Action"
              className="w-full h-full object-cover transform hover:scale-110 transition-transform duration-700"
            />
          </div>
        </div>

        {/* Content */}
        <div className="lg:w-1/2">
          <span className="text-pos-primary font-bold tracking-widest uppercase text-xs mb-4 block">
            The OrderMint Story
          </span>
          <h2 className="text-4xl lg:text-5xl font-semibold text-slate-900 mb-6 tracking-tight leading-tight">
            {settings.storyTitle || 'Built for modern hospitality. Engineered for speed.'}
          </h2>
          <div className="space-y-6 text-slate-600 leading-relaxed text-lg font-medium">
            {settings.storyContent ? <p>{settings.storyContent}</p> : null}
            <p>
              Born out of a need for smarter, faster business operations, OrderMint has been a game-changer for restaurant owners seeking efficiency and modern management tools. Our journey is one of innovation, cutting through the noise to provide a truly seamless retail experience.
            </p>
          </div>
          <button className="mt-12 group flex items-center gap-4 text-pos-primary font-bold uppercase tracking-widest text-sm">
            Read Full Story
            <div className="w-12 h-[2px] bg-pos-primary group-hover:w-20 transition-all duration-300" />
          </button>
        </div>
      </div>
    </section>
  );
};
