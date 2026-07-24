'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronRight, Loader2 } from 'lucide-react';

export const GallerySection = () => {
  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const res = await fetch('/api/website/gallery');
        const json = await res.json();
        if (json.success) setImages(json.data.slice(0, 9)); // Show first 9 images
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchImages();
  }, []);

  if (!loading && images.length === 0) return null;

  return (
    <section className="py-24 bg-white overflow-hidden" id="gallery">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="flex flex-col md:flex-row justify-between items-center md:items-end gap-8 mb-16">
          <div className="space-y-4 text-center md:text-left">
            <span className="text-pos-primary font-bold tracking-[0.4em] uppercase text-xs block">Visual Tour</span>
            <h2 className="text-4xl lg:text-5xl font-extrabold text-gray-900 tracking-tight uppercase leading-none">
              Captured <span className="text-pos-primary">Moments</span>
            </h2>
            <p className="text-gray-500 max-w-xl font-medium text-sm leading-relaxed">
              Explore the cutting-edge features and professional interface of GuestFlow through our curated lens.
            </p>
          </div>
          <Link 
            href="/gallery" 
            className="group flex items-center gap-4 bg-gray-50 hover:bg-black hover:text-white px-8 py-4 rounded-full text-xs font-bold uppercase tracking-widest text-gray-900 transition-all shadow-sm"
          >
            Explore Full Gallery <ChevronRight className="group-hover:translate-x-2 transition-transform" />
          </Link>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <Loader2 className="animate-spin text-pos-primary" size={32} />
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Fetching Gallery...</span>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 md:gap-6">
            {/* Featured Image */}
            <div className="col-span-2 md:col-span-3 md:row-span-2 relative overflow-hidden rounded-[40px] shadow-2xl group border border-gray-100">
              <img 
                src={images[0]?.url} 
                alt="" 
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-10">
                <span className="text-pos-primary font-bold uppercase tracking-[0.3em] text-[10px] mb-2">{images[0]?.category}</span>
                <h3 className="text-white text-2xl font-bold uppercase tracking-tight">Main View</h3>
              </div>
            </div>

            {/* Grid Images */}
            {images.slice(1, 7).map((image, idx) => (
              <div 
                key={image.id} 
                className="col-span-1 md:col-span-1 aspect-square relative overflow-hidden rounded-[30px] shadow-lg group border border-gray-100"
              >
                <img 
                  src={image.url} 
                  alt="" 
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" 
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center">
                  <span className="text-white text-[8px] font-bold uppercase tracking-[0.2em] border border-white/40 px-3 py-1 rounded-full backdrop-blur-sm">
                    {image.category}
                  </span>
                </div>
              </div>
            ))}

            {/* Final Wide Image or CTA */}
            <div className="col-span-2 md:col-span-3 relative overflow-hidden rounded-[40px] shadow-xl group border border-gray-100">
              <img 
                src={images[7]?.url || images[0]?.url} 
                alt="" 
                className="w-full h-48 md:h-full object-cover transition-transform duration-1000 group-hover:scale-110" 
              />
               <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center">
                  <Link href="/gallery" className="bg-white text-black px-8 py-3 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-pos-primary hover:text-white transition-all transform scale-90 group-hover:scale-100 duration-500">
                    See More Photos
                  </Link>
                </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
