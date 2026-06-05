import React, { useState } from 'react';
import { Flame, Leaf, Search } from 'lucide-react';

export default function MenuDisplay({ menuData }) {
  const [selectedCategory, setSelectedCategory] = useState(menuData.categories[0]?.category_name || '');
  const [searchQuery, setSearchQuery] = useState('');

  const currentCategory = menuData.categories.find(
    (cat) => cat.category_name === selectedCategory
  );

  const filteredItems = currentCategory
    ? currentCategory.items.filter((item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  return (
    <div className="w-full max-w-5xl mx-auto glass-panel rounded-2xl p-6 md:p-8 mt-10 shadow-2xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-white/10 pb-6 mb-6 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white">
            {menuData.restaurant_name || 'Extracted Menu'}
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Detected Currency: <span className="font-semibold text-indigo-400">{menuData.currency}</span>
          </p>
        </div>
        
        {/* Search Bar */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex overflow-x-auto gap-2 pb-4 mb-6 border-b border-white/5 scrollbar-thin scrollbar-thumb-white/10">
        {menuData.categories.map((category) => (
          <button
            key={category.category_name}
            onClick={() => {
              setSelectedCategory(category.category_name);
              setSearchQuery('');
            }}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 whitespace-nowrap ${
              selectedCategory === category.category_name
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
            }`}
          >
            {category.category_name} ({category.items.length})
          </button>
        ))}
      </div>

      {/* Grid of Dishes */}
      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredItems.map((item, index) => (
            <div key={index} className="p-4 bg-white/5 hover:bg-white/8 rounded-xl border border-white/10 transition-colors flex justify-between items-start">
              <div className="space-y-1 pr-4">
                <div className="flex items-center gap-2">
                  <h4 className="text-lg font-bold text-white">{item.name}</h4>
                  <div className="flex gap-1.5">
                    {item.is_vegetarian && (
                      <span className="p-1 bg-green-500/10 rounded border border-green-500/30" title="Vegetarian">
                        <Leaf className="h-3.5 w-3.5 text-green-400" />
                      </span>
                    )}
                    {item.is_spicy && (
                      <span className="p-1 bg-red-500/10 rounded border border-red-500/30" title="Spicy">
                        <Flame className="h-3.5 w-3.5 text-red-400" />
                      </span>
                    )}
                  </div>
                </div>
                {item.description && (
                  <p className="text-sm text-gray-400 line-clamp-2">{item.description}</p>
                )}
              </div>
              
              <div className="text-right whitespace-nowrap flex flex-col items-end gap-1">
                <span className="text-lg font-bold text-indigo-400 flex items-center justify-end">
                  <span className="text-sm mr-0.5">{menuData.currency}</span> {item.price}
                </span>
                {item.hsn_code && (
                  <span className="text-[10px] px-1.5 py-0.5 bg-white/5 border border-white/10 rounded text-gray-400">
                    HSN: {item.hsn_code}
                  </span>
                )}
                {item.gst_rate !== undefined && (
                  <span className="text-[10px] px-1.5 py-0.5 bg-indigo-500/10 border border-indigo-500/20 rounded text-indigo-300">
                    GST: {item.gst_rate}%
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          No dishes found under this category matching the search query.
        </div>
      )}
    </div>
  );
}
