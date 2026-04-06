'use client';

import React, { useState, useEffect } from 'react';
import { 
  Plus, Trash2, Edit2, CheckCircle, XCircle, 
  X, Image as ImageIcon, Sparkles, Users, 
  ChevronRight, ChevronLeft, Save, Loader2 
} from 'lucide-react';

export default function RoomsManagementPage() {
  const [rooms, setRooms] = useState<any[]>([]);
  const [amenitiesList, setAmenitiesList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalLoading, setModalLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [step, setStep] = useState(1);
  const [currentRoom, setCurrentRoom] = useState<any>({
    name: '',
    description: '',
    price: 0,
    capacity: 0,
    type: 'Deluxe',
    isActive: true,
    order: 0,
    images: [],
    amenities: []
  });

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/website/rooms?admin=true');
      const json = await res.json();
      if (json.success) setRooms(json.data);
    } finally {
      setLoading(false);
    }
  };

  const fetchAmenities = async () => {
    try {
      // We'll use a prisma query later to get these, for now let's use a static list
      // but in a real app, this would be an API call
      const list = [
        'Fast WiFi', 'Air Conditioning', 'Flat-screen TV', 'Mini Bar',
        'Room Service', 'Mountain View', 'Luxury Bedding', 'Private Balcony',
        'Heater', 'Coffee Maker', 'Premium Toiletries', 'Electric Kettle'
      ];
      setAmenitiesList(list);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchRooms();
    fetchAmenities();
  }, []);

  const handleSave = async () => {
    if (!currentRoom.name || currentRoom.images.length === 0) {
      alert('Please provide name and at least one image');
      return;
    }

    setModalLoading(true);
    const method = currentRoom.id ? 'PUT' : 'POST';
    const url = currentRoom.id ? `/api/website/rooms/${currentRoom.id}` : '/api/website/rooms';
    
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentRoom),
      });
      const json = await res.json();
      if (json.success) {
        setShowModal(false);
        fetchRooms();
        alert('Room saved successfully!');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to save room');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this room?')) return;
    try {
      const res = await fetch(`/api/website/rooms/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) fetchRooms();
    } catch (err) {
      console.error(err);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setModalLoading(true);
    try {
      const uploadedUrls = [];
      for (let i = 0; i < files.length; i++) {
        const formData = new FormData();
        formData.append('file', files[i]);
        const res = await fetch('/api/upload', { method: 'POST', body: formData });
        const json = await res.json();
        if (json.success) uploadedUrls.push(json.url);
      }
      setCurrentRoom({ ...currentRoom, images: [...currentRoom.images, ...uploadedUrls] });
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Image upload failed');
    } finally {
      setModalLoading(false);
    }
  };

  const toggleAmenity = (name: string) => {
    const amenities = currentRoom.amenities.includes(name)
      ? currentRoom.amenities.filter((a: string) => a !== name)
      : [...currentRoom.amenities, name];
    setCurrentRoom({ ...currentRoom, amenities });
  };

  return (
    <div className="space-y-8 pb-24">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Rooms Inventory</h1>
          <p className="text-slate-500">Manage your property's room types, pricing, and amenities.</p>
        </div>
        <button
          onClick={() => {
            setCurrentRoom({ name: '', description: '', price: 0, capacity: 2, type: 'Deluxe', isActive: true, order: 0, images: [], amenities: [] });
            setStep(1);
            setShowModal(true);
          }}
          className="bg-pos-primary text-white px-8 py-3 rounded-full font-bold uppercase tracking-widest hover:bg-black transition-all flex items-center gap-2"
        >
          <Plus size={18} />
          Create New Room
        </button>
      </div>

      <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50">
              <th className="p-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Room Info</th>
              <th className="p-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Type</th>
              <th className="p-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Price / Capacity</th>
              <th className="p-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
              <th className="p-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              [1, 2, 3].map(i => (
                <tr key={i} className="animate-pulse">
                  <td colSpan={5} className="p-8 h-20 bg-slate-50/50" />
                </tr>
              ))
            ) : rooms.map((room) => (
              <tr key={room.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-100 flex-shrink-0">
                      <img src={room.images[0]?.url} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">{room.name}</h4>
                      <p className="text-xs text-slate-500 line-clamp-1">{room.description}</p>
                    </div>
                  </div>
                </td>
                <td className="p-6">
                  <span className="px-3 py-1 bg-slate-100 rounded-full text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                    {room.type}
                  </span>
                </td>
                <td className="p-6">
                  <div className="font-bold text-slate-900">₹{room.price}</div>
                  <div className="text-[10px] text-slate-400 uppercase tracking-tight flex items-center gap-1 mt-1">
                    <Users size={12} /> {room.capacity} Guests
                  </div>
                </td>
                <td className="p-6">
                  <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${room.isActive ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'}`}>
                    {room.isActive ? <CheckCircle size={12} /> : <XCircle size={12} />}
                    {room.isActive ? 'Active' : 'Hidden'}
                  </div>
                </td>
                <td className="p-6 text-right">
                  <div className="flex justify-end gap-2">
                    <button 
                      onClick={() => { 
                        setCurrentRoom({
                          ...room,
                          images: room.images.map((img: any) => img.url),
                          amenities: room.amenities.map((am: any) => am.name)
                        }); 
                        setStep(1);
                        setShowModal(true); 
                      }} 
                      className="p-2.5 bg-slate-50 text-slate-600 hover:bg-slate-900 hover:text-white rounded-xl transition-all"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button onClick={() => handleDelete(room.id)} className="p-2.5 bg-slate-50 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && rooms.length === 0 && (
          <div className="py-24 text-center">
            <p className="text-slate-400 font-bold uppercase tracking-widest">No rooms found. Start by creating one!</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
          <div className="bg-white rounded-[40px] w-full max-w-4xl p-10 animate-in zoom-in-95 duration-300 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-8 pb-6 border-b border-slate-50">
              <div>
                <h2 className="text-3xl font-bold uppercase tracking-tighter">{currentRoom.id ? 'Edit' : 'Create'} Room</h2>
                <div className="flex items-center gap-2 mt-2">
                  <div className={`w-2 h-2 rounded-full ${step >= 1 ? 'bg-pos-primary' : 'bg-slate-200'}`} />
                  <div className={`w-8 h-1 rounded-full ${step >= 2 ? 'bg-pos-primary' : 'bg-slate-100'}`} />
                  <div className={`w-2 h-2 rounded-full ${step >= 2 ? 'bg-pos-primary' : 'bg-slate-200'}`} />
                  <div className={`w-8 h-1 rounded-full ${step >= 3 ? 'bg-pos-primary' : 'bg-slate-100'}`} />
                  <div className={`w-2 h-2 rounded-full ${step >= 3 ? 'bg-pos-primary' : 'bg-slate-200'}`} />
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-900 transition-colors">
                <X size={24} />
              </button>
            </div>

            {step === 1 && (
              <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Room Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Royal Himalayan Suite"
                        value={currentRoom.name}
                        onChange={e => setCurrentRoom({ ...currentRoom, name: e.target.value })}
                        className="w-full p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-pos-primary outline-none transition-all font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Room Type</label>
                      <select
                        value={currentRoom.type}
                        onChange={e => setCurrentRoom({ ...currentRoom, type: e.target.value })}
                        className="w-full p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-pos-primary outline-none transition-all font-medium appearance-none"
                      >
                        <option value="Deluxe">Deluxe Room</option>
                        <option value="Premium">Premium Room</option>
                        <option value="Suite">Execuitve Suite</option>
                        <option value="Family">Family Suite</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Price / Night</label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">₹</span>
                          <input
                            type="number"
                            value={currentRoom.price || 0}
                            onChange={e => {
                              const val = parseFloat(e.target.value);
                              setCurrentRoom({ ...currentRoom, price: isNaN(val) ? 0 : val });
                            }}
                            className="w-full p-4 pl-10 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-pos-primary outline-none transition-all font-bold text-slate-900"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Max Guests</label>
                        <input
                          type="number"
                          value={currentRoom.capacity || 0}
                          onChange={e => {
                            const val = parseInt(e.target.value);
                            setCurrentRoom({ ...currentRoom, capacity: isNaN(val) ? 0 : val });
                          }}
                          className="w-full p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-pos-primary outline-none transition-all font-medium"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Display Order</label>
                      <input
                        type="number"
                        value={currentRoom.order || 0}
                        onChange={e => {
                          const val = parseInt(e.target.value);
                          setCurrentRoom({ ...currentRoom, order: isNaN(val) ? 0 : val });
                        }}
                        className="w-full p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-pos-primary outline-none transition-all font-medium"
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Long Description</label>
                  <textarea
                    placeholder="Tell guests what makes this room special..."
                    value={currentRoom.description}
                    onChange={e => setCurrentRoom({ ...currentRoom, description: e.target.value })}
                    className="w-full p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-pos-primary outline-none h-32 transition-all font-medium"
                  />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {amenitiesList.map(name => (
                    <button
                      key={name}
                      onClick={() => toggleAmenity(name)}
                      className={`p-4 rounded-3xl border-2 transition-all text-left flex items-center gap-3 ${currentRoom.amenities.includes(name) ? 'border-pos-primary bg-pos-primary/5 text-pos-primary' : 'border-slate-50 bg-slate-50 text-slate-500 hover:border-slate-200'}`}
                    >
                      <div className={`w-2 h-2 rounded-full ${currentRoom.amenities.includes(name) ? 'bg-pos-primary' : 'bg-slate-300'}`} />
                      <span className="text-[11px] font-bold uppercase tracking-tight">{name}</span>
                    </button>
                  ))}
                </div>
                <div className="bg-slate-50 p-6 rounded-[30px] flex items-start gap-4">
                  <Sparkles className="text-pos-primary mt-1 flex-shrink-0" size={20} />
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-widest mb-1">Amenities Guide</h4>
                    <p className="text-xs text-slate-500 leading-relaxed font-medium">Select features that will be highlighted in the room gallery. Icons will be automatically assigned based on your selection.</p>
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {currentRoom.images.map((url: string, idx: number) => (
                    <div key={idx} className="aspect-square rounded-3xl overflow-hidden bg-slate-100 relative group">
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      <button 
                        onClick={() => setCurrentRoom({ ...currentRoom, images: currentRoom.images.filter((_: any, i: number) => i !== idx) })}
                        className="absolute top-2 right-2 p-1.5 bg-white/90 text-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                  <label className="aspect-square rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-slate-50 transition-all text-slate-400 hover:text-pos-primary">
                    <ImageIcon size={24} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Add Image</span>
                    <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>
                </div>
                
                <div className="flex items-center gap-4 bg-slate-900 text-white p-6 rounded-[30px]">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={currentRoom.isActive}
                    onChange={e => setCurrentRoom({ ...currentRoom, isActive: e.target.checked })}
                    className="w-6 h-6 rounded-lg accent-pos-primary"
                  />
                  <div className="flex-1">
                    <label htmlFor="isActive" className="text-xs font-bold uppercase tracking-widest cursor-pointer block">Publish Room Info</label>
                    <p className="text-[10px] text-slate-400 font-medium">When active, this room will be visible on the public website listing.</p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-between items-center mt-12 pt-8 border-t border-slate-50">
              <button
                onClick={() => step > 1 && setStep(step - 1)}
                disabled={step === 1}
                className={`flex items-center gap-2 px-8 py-3 rounded-full font-bold uppercase tracking-widest transition-all ${step === 1 ? 'opacity-0' : 'text-slate-400 hover:text-slate-900'}`}
              >
                <ChevronLeft size={20} /> Back
              </button>
              
              <div className="flex gap-4">
                {step < 3 ? (
                  <button
                    onClick={() => setStep(step + 1)}
                    className="flex items-center gap-2 px-10 py-3 rounded-full bg-slate-900 text-white font-bold uppercase tracking-widest hover:bg-pos-primary transition-all"
                  >
                    Next Step <ChevronRight size={20} />
                  </button>
                ) : (
                  <button
                    onClick={handleSave}
                    disabled={modalLoading}
                    className="flex items-center gap-2 px-10 py-4 rounded-full bg-pos-primary text-white font-bold uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-pos-primary/20 disabled:opacity-50"
                  >
                    {modalLoading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                    {currentRoom.id ? 'Update Room' : 'Create Room'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
