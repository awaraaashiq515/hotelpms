'use client';

import React, { useState, useEffect } from 'react';
import { ChevronRight } from 'lucide-react';

interface Experience {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
}

export const ExperiencesSection = () => {
  const [experiences, setExperiences] = useState<Experience[]>([]);

  useEffect(() => {
    const fetchExperiences = async () => {
      try {
        const res = await fetch('/api/website/experience');
        const json = await res.json();
        if (json.success) setExperiences(json.data);
      } catch (err) {
        console.error('Failed to fetch experiences', err);
      }
    };
    fetchExperiences();
  }, []);

  if (experiences.length === 0) return null;

  return (
    <section id="experiences" className="py-24 px-6 lg:px-12 bg-[#faf9f6]">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4 tracking-tighter uppercase">
            Experiences
          </h2>
          <div className="w-24 h-1 bg-pos-primary mx-auto mb-6" />
          <p className="text-gray-500 max-w-2xl mx-auto font-light italic">
            Discover the best local attractions and activities, where every moment is a chance to make memories.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {experiences.map((exp) => (
            <div key={exp.id} className="group bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500">
              <div className="aspect-[3/4] overflow-hidden relative">
                <img
                  src={exp.imageUrl}
                  alt={exp.title}
                  className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </div>
              <div className="p-8">
                <h3 className="text-xl font-bold text-gray-900 mb-3 tracking-tight uppercase">
                  {exp.title}
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed line-clamp-3 mb-6 font-light">
                  {exp.description}
                </p>
                <button className="flex items-center gap-2 text-pos-primary text-xs font-bold uppercase tracking-widest group-hover:translate-x-2 transition-transform">
                  Explore Now <ChevronRight size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
