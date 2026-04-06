'use client';

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface GallerySliderProps {
  section: string;
  title: string;
}

export const GallerySlider = ({ section, title }: GallerySliderProps) => {
  const [images, setImages] = useState<any[]>([]);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const res = await fetch(`/api/website/slider?section=${section}`);
        const json = await res.json();
        if (json.success) setImages(json.data);
      } catch (err) {
        console.error('Failed to fetch gallery images', err);
      }
    };
    fetchImages();
  }, [section]);

  if (images.length === 0) return null;

  return (
    <section className="py-24 bg-white overflow-hidden" id="gallery">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 mb-12 flex justify-between items-end">
        <div>
           <span className="text-pos-primary font-bold tracking-[0.4em] uppercase text-xs mb-4 block">Visuals</span>
           <h2 className="text-4xl font-bold tracking-tighter uppercase">{title}</h2>
        </div>
        <div className="flex gap-4">
          <button onClick={() => setCurrent(prev => (prev - 1 + images.length) % images.length)} className="w-12 h-12 rounded-full border border-gray-200 flex items-center justify-center hover:bg-pos-primary hover:text-white transition-all">
            <ChevronLeft size={20} />
          </button>
          <button onClick={() => setCurrent(prev => (prev + 1) % images.length)} className="w-12 h-12 rounded-full border border-gray-200 flex items-center justify-center hover:bg-pos-primary hover:text-white transition-all">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
      
      <div className="flex gap-8 transition-transform duration-700 ease-in-out px-12" style={{ transform: `translateX(-${current * 30}%)` }}>
        {images.map((img, idx) => (
          <div key={img.id} className="min-w-[40%] aspect-video rounded-3xl overflow-hidden shadow-xl">
            {img.type === 'VIDEO' || img.url?.match(/\.(mp4|webm|ogg|mov)$/i) ? (
              <video 
                src={img.url} 
                autoPlay 
                muted 
                loop 
                playsInline
                className="w-full h-full object-cover" 
              />
            ) : (
              <img src={img.url} alt="Gallery" className="w-full h-full object-cover hover:scale-110 transition-transform duration-1000" />
            )}
          </div>
        ))}
      </div>
    </section>
  );
};
