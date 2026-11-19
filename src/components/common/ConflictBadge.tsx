'use client';

import { useEffect, useState, useCallback } from 'react';
import { ConflictResolver, type ConflictRecord } from '@/lib/conflict-resolver';

export function ConflictBadge() {
  const [conflicts, setConflicts] = useState<ConflictRecord[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedConflict, setSelectedConflict] = useState<ConflictRecord | null>(null);

  const refreshConflicts = useCallback(() => {
    const list = ConflictResolver.getUnresolved();
    setConflicts(list);
  }, []);

  useEffect(() => {
    refreshConflicts();
    const handler = () => refreshConflicts();
    window.addEventListener('guestflow-conflict-updated', handler);
    return () => window.removeEventListener('guestflow-conflict-updated', handler);
  }, [refreshConflicts]);

  if (conflicts.length === 0) return null;

  const handleResolve = (winner: 'local' | 'cloud') => {
    if (!selectedConflict) return;
    ConflictResolver.markResolved(selectedConflict.id, winner);
    setSelectedConflict(null);
    refreshConflicts();
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 transition shadow-sm animate-pulse"
        title="Sync Conflicts Detected"
      >
        <span>⚠️</span>
        <span>{conflicts.length} Conflict{conflicts.length > 1 ? 's' : ''}</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl text-slate-100 overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/40">
              <div className="flex items-center gap-2">
                <span className="text-xl">⚠️</span>
                <h3 className="text-base font-bold text-white">
                  Sync Data Conflicts ({conflicts.length})
                </h3>
              </div>
              <button
                onClick={() => {
                  setIsOpen(false);
                  setSelectedConflict(null);
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              {selectedConflict ? (
                <div className="space-y-4">
                  <div className="text-sm text-slate-300">
                    Conflict in model: <b className="text-amber-400">{selectedConflict.model}</b> (ID: {selectedConflict.recordId})
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Local side */}
                    <div className="p-4 rounded-xl bg-blue-950/30 border border-blue-900/40 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-blue-400 text-xs">LOCAL PC (OFFLINE)</span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(selectedConflict.localUpdatedAt).toLocaleTimeString()}
                        </span>
                      </div>
                      <pre className="text-xs font-mono bg-black/40 p-2.5 rounded-lg text-slate-200 overflow-x-auto max-h-48">
                        {JSON.stringify(selectedConflict.localData, null, 2)}
                      </pre>
                      <button
                        onClick={() => handleResolve('local')}
                        className="w-full mt-2 py-1.5 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition"
                      >
                        Keep Local Version
                      </button>
                    </div>

                    {/* Cloud side */}
                    <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-900/40 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-purple-400 text-xs">CLOUD SERVER</span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(selectedConflict.cloudUpdatedAt).toLocaleTimeString()}
                        </span>
                      </div>
                      <pre className="text-xs font-mono bg-black/40 p-2.5 rounded-lg text-slate-200 overflow-x-auto max-h-48">
                        {JSON.stringify(selectedConflict.cloudData, null, 2)}
                      </pre>
                      <button
                        onClick={() => handleResolve('cloud')}
                        className="w-full mt-2 py-1.5 px-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold transition"
                      >
                        Keep Cloud Version
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedConflict(null)}
                    className="text-xs text-slate-400 hover:text-white underline mt-2 block"
                  >
                    ← Back to conflict list
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-slate-400 mb-3">
                    A discrepancy occurred between the local offline copy and the cloud server. Select which version to keep:
                  </p>
                  {conflicts.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => setSelectedConflict(c)}
                      className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/50 hover:border-amber-500/50 flex items-center justify-between cursor-pointer transition"
                    >
                      <div>
                        <div className="font-medium text-sm text-slate-200">
                          {c.model} Record #{c.recordId}
                        </div>
                        <div className="text-xs text-slate-400">
                          Local update: {new Date(c.localUpdatedAt).toLocaleString()}
                        </div>
                      </div>
                      <span className="px-2.5 py-1 text-xs bg-amber-500/20 text-amber-300 rounded-lg">
                        Resolve →
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/40 flex justify-end">
              <button
                onClick={() => {
                  setIsOpen(false);
                  setSelectedConflict(null);
                }}
                className="px-4 py-1.5 text-xs text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default ConflictBadge;
