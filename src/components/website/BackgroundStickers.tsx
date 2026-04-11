'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Pizza, 
  Coffee, 
  UtensilsCrossed, 
  Sparkles, 
  Circle, 
  Plus, 
  Grape, 
  Cherry, 
  Soup
} from 'lucide-react';

export const BackgroundStickers = () => {
  const stickers = [
    { icon: <Pizza size={40} />, top: '10%', left: '5%', delay: 0 },
    { icon: <Coffee size={32} />, top: '25%', left: '85%', delay: 1 },
    { icon: <UtensilsCrossed size={44} />, top: '65%', left: '10%', delay: 2 },
    { icon: <Plus size={24} />, top: '45%', left: '90%', delay: 0.5 },
    { icon: <Circle size={16} />, top: '15%', left: '40%', delay: 1.5 },
    { icon: <Sparkles size={28} />, top: '75%', left: '80%', delay: 3 },
    { icon: <Soup size={36} />, top: '40%', left: '5%', delay: 1.2 },
    { icon: <Grape size={32} />, top: '85%', left: '30%', delay: 2.5 },
    { icon: <Cherry size={32} />, top: '60%', left: '92%', delay: 0.8 },
  ];

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0">
      {stickers.map((sticker, idx) => (
        <motion.div
          key={idx}
          className="absolute text-pos-primary/10"
          style={{ top: sticker.top, left: sticker.left }}
          animate={{
            y: [0, -20, 0],
            rotate: [0, 10, -10, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 8 + idx,
            repeat: Infinity,
            delay: sticker.delay,
            ease: "easeInOut"
          }}
        >
          {sticker.icon}
        </motion.div>
      ))}
      
      {/* Additional Blurry Blobs for Depth */}
      <div className="absolute top-1/4 left-1/4 w-[40vw] h-[40vw] bg-pos-primary/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 right-1/4 w-[30vw] h-[30vw] bg-pos-accent/5 rounded-full blur-[100px]" />
    </div>
  );
};
