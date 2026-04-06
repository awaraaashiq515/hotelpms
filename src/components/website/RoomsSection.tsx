'use client';

import React, { useState, useEffect } from 'react';
import { Star, Users, Maximize, ArrowRight } from 'lucide-react';
import Link from 'next/link';


interface Room {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  features: string;
}

export const RoomsSection = () => {
  const [rooms, setRooms] = useState<Room[]>([]);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const res = await fetch('/api/website/rooms');
        const json = await res.json();
        if (json.success) setRooms(json.data);
      } catch (err) {
        console.error('Failed to fetch rooms', err);
      }
    };
    fetchRooms();
  }, []);

  if (rooms.length === 0) return null;

  return (
    <section id="rooms" className="py-24 px-6 lg:px-12 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row justify-between items-end mb-16 gap-8">
          <div className="max-w-2xl">
            <span className="text-pos-primary font-bold tracking-[0.4em] uppercase text-xs mb-4 block">
              Accommodation
            </span>
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 tracking-tighter uppercase leading-tight">
              Luxurious Stay, Unmatched Comfort
            </h2>
          </div>
          <Link href="/rooms" className="px-8 py-4 bg-black text-white rounded-full font-bold uppercase tracking-widest hover:bg-pos-primary transition-all">
            View All Rooms
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {rooms.slice(0, 4).map((room: any) => (
            <Link href={`/rooms/${room.slug}`} key={room.id} className="group flex flex-col md:flex-row bg-[#fafafa] rounded-[40px] overflow-hidden hover:shadow-2xl transition-all duration-500 border border-gray-100">
              <div className="md:w-1/2 aspect-square overflow-hidden relative">
                <img
                  src={room.images[0]?.url || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'}
                  alt={room.name}
                  className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                />
              </div>
              <div className="md:w-1/2 p-10 flex flex-col justify-center">
                <div className="flex items-center gap-1 text-pos-primary mb-4">
                  {[...Array(5)].map((_, i) => <Star key={i} size={14} fill="currentColor" />)}
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2 uppercase tracking-tighter group-hover:text-pos-primary transition-colors">
                  {room.name}
                </h3>
                <p className="text-gray-400 mb-6 text-sm flex gap-4 font-bold uppercase tracking-widest">
                  <span className="flex items-center gap-1"><Users size={14} /> {room.capacity} Guests</span>
                </p>
                <div className="space-y-2 mb-8">
                  {room.amenities.slice(0, 3).map((am: any) => (
                    <div key={am.id} className="flex items-center gap-3 text-[10px] text-gray-600 font-bold uppercase tracking-tight">
                      <div className="w-1.5 h-1.5 rounded-full bg-pos-primary" />
                      {am.name}
                    </div>
                  ))}
                </div>
                <div className="mt-auto flex items-center justify-between">
                  <div className="text-2xl font-black text-pos-primary">
                    ₹{room.price}<span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest ml-1">/ Night</span>
                  </div>
                  <div className="w-14 h-14 rounded-full border border-gray-100 bg-white flex items-center justify-center group-hover:bg-pos-primary group-hover:text-white group-hover:border-pos-primary transition-all duration-500 shadow-sm">
                    <ArrowRight size={20} />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};
