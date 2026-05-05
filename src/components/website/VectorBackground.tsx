'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Utensils, Beer, Hotel, Package, Coffee, Wine, ChefHat, Bell, Key, CreditCard } from 'lucide-react';

const icons = [
  { Icon: Utensils, top: '10%', left: '5%', size: 40, delay: 0 },
  { Icon: Beer, top: '20%', left: '85%', size: 30, delay: 1 },
  { Icon: Hotel, top: '40%', left: '15%', size: 50, delay: 2 },
  { Icon: Package, top: '60%', left: '80%', size: 35, delay: 1.5 },
  { Icon: Coffee, top: '80%', left: '10%', size: 45, delay: 3 },
  { Icon: Wine, top: '15%', left: '45%', size: 30, delay: 0.5 },
  { Icon: ChefHat, top: '70%', left: '40%', size: 55, delay: 2.5 },
  { Icon: Bell, top: '30%', left: '70%', size: 35, delay: 1.2 },
  { Icon: Key, top: '55%', left: '5%', size: 40, delay: 4 },
  { Icon: CreditCard, top: '90%', left: '60%', size: 30, delay: 0.8 },
];

export const VectorBackground = () => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-10">
      {icons.map((item, index) => {
        const { Icon, top, left, size, delay } = item;
        return (
          <motion.div
            key={index}
            style={{ position: 'absolute', top, left }}
            animate={{
              y: [0, -20, 0],
              rotate: [0, 10, -10, 0],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 5 + Math.random() * 5,
              repeat: Infinity,
              ease: "easeInOut",
              delay,
            }}
          >
            <Icon size={size} className="text-pos-primary" />
          </motion.div>
        );
      })}
      
      {/* Subtle Pattern Overlay */}
      <div className="absolute inset-0 pattern-hospitality opacity-5" />
    </div>
  );
};
