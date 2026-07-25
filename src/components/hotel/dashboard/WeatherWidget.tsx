import React from 'react';
import { CloudSun, CloudRain, Cloud, Sun, Droplets, Wind } from 'lucide-react';
import type { WeatherData } from '@/types/hotel/dashboard.types';

// Mock data — replace with OpenWeather API integration
function getMockWeather(): WeatherData {
  return { temp: 32, feels: 36, condition: 'Partly Cloudy', humidity: 68, wind: 14, icon: 'cloud-sun', city: 'Mumbai' };
}

function WeatherIcon({ icon, size = 40 }: { icon: string; size?: number }) {
  if (icon === 'rain')      return <CloudRain size={size} className="text-blue-400" />;
  if (icon === 'sun')       return <Sun size={size} className="text-yellow-400" />;
  if (icon === 'cloud')     return <Cloud size={size} className="text-slate-400" />;
  return <CloudSun size={size} className="text-amber-400" />;
}

export function WeatherWidget() {
  const w = getMockWeather();
  return (
    <div className="rounded-2xl bg-gradient-to-br from-blue-900/40 to-slate-900/40 border border-blue-500/20 p-4">
      <div className="flex items-center gap-1.5 mb-3">
        <CloudSun size={12} className="text-blue-300" />
        <span className="text-[10px] font-black text-white uppercase tracking-wider">Weather · {w.city}</span>
      </div>
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-end gap-1">
            <span className="text-4xl font-black text-white">{w.temp}°</span>
            <span className="text-sm text-slate-400 mb-1">C</span>
          </div>
          <p className="text-[10px] text-slate-400">{w.condition}</p>
          <p className="text-[9px] text-slate-500 mt-0.5">Feels like {w.feels}°C</p>
        </div>
        <WeatherIcon icon={w.icon} size={40} />
      </div>
      <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-white/5">
        <div className="flex items-center gap-1.5">
          <Droplets size={10} className="text-blue-400" />
          <span className="text-[9px] text-slate-400">{w.humidity}% Humidity</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Wind size={10} className="text-slate-400" />
          <span className="text-[9px] text-slate-400">{w.wind} km/h Wind</span>
        </div>
      </div>
      <p className="text-[8px] text-slate-700 mt-2">* Integrate OpenWeather API in Settings</p>
    </div>
  );
}
