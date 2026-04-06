'use client';

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Play } from 'lucide-react';

interface SliderItem {
  id: string;
  type: string;
  url: string;
  title: string | null;
  subtitle: string | null;
}

export const HeroSlider = () => {
  const [sliders, setSliders] = useState<SliderItem[]>([]);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSliders = async () => {
      try {
        const res = await fetch('/api/website/slider?section=HERO');
        const json = await res.json();
        if (json.success) setSliders(json.data);
      } catch (err) {
        console.error('Failed to fetch sliders', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSliders();
  }, []);

  useEffect(() => {
    if (sliders.length === 0) return;
    
    const currentSlideItem = sliders[current];
    const isVideo = currentSlideItem?.type === 'VIDEO' || currentSlideItem?.url?.match(/\.(mp4|webm|ogg|mov)$/i);

    let timer: NodeJS.Timeout;
    
    // Only auto-advance on a timer if it's an image. 
    // If it's a video, we wait for the onEnded event.
    if (!isVideo) {
      timer = setInterval(() => {
        setCurrent((prev) => (prev + 1) % sliders.length);
      }, 6000);
    }
    
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [sliders, current]);

  const nextSlide = () => setCurrent((prev) => (prev + 1) % sliders.length);
  const prevSlide = () => setCurrent((prev) => (prev - 1 + sliders.length) % sliders.length);

  if (loading) return <div className="h-screen bg-gray-900 animate-pulse"></div>;
  if (sliders.length === 0) return null;

  return (
    <section className="relative h-screen w-full overflow-hidden">
      {sliders.map((slide, idx) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            idx === current ? 'opacity-100 z-10' : 'opacity-0 z-0'
          }`}
        >
          {slide.type === 'VIDEO' || slide.url?.match(/\.(mp4|webm|ogg|mov)$/i) ? (
            <video
              src={slide.url}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
              onEnded={() => {
                if (idx === current) {
                  nextSlide();
                }
              }}
            />
          ) : (
            <div
              className="w-full h-full bg-cover bg-center"
              style={{ backgroundImage: `url(${slide.url})` }}
            />
          )}
          
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/40 flex flex-col justify-center items-center text-center px-6">
            <h1 className="text-5xl lg:text-8xl font-bold text-white mb-6 animate-in slide-in-from-bottom duration-1000 tracking-tighter uppercase">
              {slide.title}
            </h1>
            <p className="text-lg lg:text-2xl text-white/90 mb-12 max-w-2xl animate-in slide-in-from-bottom duration-1000 delay-200 font-light italic">
              {slide.subtitle}
            </p>
            <div className="flex gap-4 animate-in slide-in-from-bottom duration-1000 delay-500">
              <button className="bg-pos-primary text-white px-10 py-4 rounded-full font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-all duration-300">
                Explore Rooms
              </button>
              {(slide.type === 'VIDEO' || slide.url?.match(/\.(mp4|webm|ogg|mov)$/i)) && (
                <button className="bg-white/20 backdrop-blur-md text-white w-14 h-14 rounded-full flex items-center justify-center hover:bg-white hover:text-black transition-all">
                  <Play fill="currentColor" size={24} />
                </button>
              )}
            </div>
          </div>
        </div>
      ))}

      {/* Controls */}
      <button
        onClick={prevSlide}
        className="absolute left-8 top-1/2 -translate-y-1/2 z-20 text-white/50 hover:text-white transition-colors"
      >
        <ChevronLeft size={48} strokeWidth={1} />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-8 top-1/2 -translate-y-1/2 z-20 text-white/50 hover:text-white transition-colors"
      >
        <ChevronRight size={48} strokeWidth={1} />
      </button>

      {/* Indicators */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-20 flex gap-3">
        {sliders.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrent(idx)}
            className={`h-1 transition-all duration-300 ${
              idx === current ? 'w-12 bg-pos-primary' : 'w-4 bg-white/30'
            }`}
          />
        ))}
      </div>
    </section>
  );
};
