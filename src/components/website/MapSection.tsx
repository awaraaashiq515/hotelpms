'use client';

import React, { useState, useEffect } from 'react';

export const MapSection = () => {
  const [mapUrl, setMapUrl] = useState('');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/website/settings');
        const json = await res.json();
        if (json.success) setMapUrl(json.data.mapIframe || '');
      } catch (err) {
        console.error('Failed to fetch map settings', err);
      }
    };
    fetchSettings();
  }, []);

  if (!mapUrl) return null;

  return (
    <section id="location" className="w-full h-[500px] overflow-hidden bg-gray-100 grayscale hover:grayscale-0 transition-all duration-1000">
      <iframe
        src={mapUrl}
        width="100%"
        height="100%"
        style={{ border: 0 }}
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      ></iframe>
    </section>
  );
};
