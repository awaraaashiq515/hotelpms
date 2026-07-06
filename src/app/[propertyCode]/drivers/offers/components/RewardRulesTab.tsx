'use client';

import React from 'react';
import { Gift, Edit, Trash2, ArrowRight, ArrowUpRight, Target, IndianRupee, RotateCcw, CheckCircle2, Zap, Plus } from 'lucide-react';
import { OfferRule, getLevelStyle } from '../types';

interface RewardRulesTabProps {
  offersList: OfferRule[];
  sortedOffers: OfferRule[];
  activeOffersCount: number;
  onAddRule: () => void;
  onEditOffer: (offer: OfferRule) => void;
  onDeleteOffer: (id: string) => void;
}

export default function RewardRulesTab({
  offersList,
  sortedOffers,
  activeOffersCount,
  onAddRule,
  onEditOffer,
  onDeleteOffer,
}: RewardRulesTabProps) {
  return (
    <div className="space-y-5">

      {/* ── Level Journey Diagram ── */}
      {sortedOffers.length > 1 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <ArrowUpRight size={16} className="text-indigo-500" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-white">Level Progression Journey</h3>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {sortedOffers.map((offer, idx) => {
              const style = getLevelStyle(offer.priority);
              const isAutoUp = offer.resetType === 'NEXT_OFFER' && offer.nextOffer;
              return (
                <React.Fragment key={offer.id}>
                  <div className={`flex-shrink-0 flex flex-col items-center gap-2 px-4 py-3 rounded-xl border ${style.bg} ${style.border} min-w-[120px]`}>
                    <span className="text-lg">{style.icon}</span>
                    <div className="text-center">
                      <p className={`text-xs font-bold ${style.text}`}>Level {offer.priority}</p>
                      <p className={`text-xs font-semibold ${style.text} opacity-80`}>{offer.title}</p>
                    </div>
                    <div className={`text-center text-xs ${style.text} opacity-70`}>
                      <p>{offer.targetRides} customers</p>
                      <p className="font-semibold">
                        {offer.rewardType === 'CASH' ? `₹${offer.rewardValue}` : offer.rewardItem}
                      </p>
                    </div>
                  </div>
                  {idx < sortedOffers.length - 1 && (
                    <div className="flex-shrink-0 flex flex-col items-center gap-1">
                      <ArrowRight size={16} className={isAutoUp ? 'text-indigo-500' : 'text-slate-300 dark:text-slate-600'} />
                      {isAutoUp && (
                        <span className="text-[9px] font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-950/50 px-1.5 py-0.5 rounded-full whitespace-nowrap">
                          AUTO
                        </span>
                      )}
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Rules Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-800 dark:text-white">All Reward Rules</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {offersList.length} rule{offersList.length !== 1 ? 's' : ''} · {activeOffersCount} active
          </p>
        </div>
        <button
          onClick={onAddRule}
          className="flex items-center gap-2 h-9 px-4 text-sm font-semibold bg-pos-primary text-white rounded-xl hover:opacity-90 transition-all"
        >
          <Plus size={13} /> Add Rule
        </button>
      </div>

      {/* ── Rules List ── */}
      {offersList.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-16 text-center">
          <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-950/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Gift size={28} className="text-indigo-400" />
          </div>
          <p className="text-base font-bold text-slate-700 dark:text-slate-300">No reward rules yet</p>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-1 mb-5">Create your first rule to start rewarding drivers</p>
          <button
            onClick={onAddRule}
            className="inline-flex items-center gap-2 h-10 px-5 text-sm font-semibold bg-pos-primary text-white rounded-xl hover:opacity-90"
          >
            <Plus size={14} /> Add First Rule
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedOffers.map(offer => {
            const style = getLevelStyle(offer.priority);
            const isAutoUp = offer.resetType === 'NEXT_OFFER';
            const nextOffer = offer.nextOffer;

            return (
              <div key={offer.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 hover:shadow-md transition-all">
                <div className="flex items-start gap-4">
                  {/* Level Badge */}
                  <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center flex-shrink-0 border ${style.bg} ${style.border}`}>
                    <span className="text-lg leading-none">{style.icon}</span>
                    <span className={`text-[9px] font-bold mt-0.5 ${style.text}`}>L{offer.priority}</span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-bold text-slate-800 dark:text-white">{offer.title}</h4>
                      {!offer.isActive && (
                        <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-400 text-[10px] font-semibold rounded-full">Inactive</span>
                      )}
                      {isAutoUp && (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold rounded-full border border-indigo-200 dark:border-indigo-800">
                          <Zap size={9} /> Auto Level-Up
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-x-5 gap-y-1 mt-2">
                      <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                        <Target size={12} />
                        <span><strong className="text-slate-700 dark:text-slate-200">{offer.targetRides}</strong> customers required</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                        {offer.rewardType === 'CASH'
                          ? <><IndianRupee size={12} /><span>Earn <strong className="text-emerald-600 dark:text-emerald-400">₹{offer.rewardValue}</strong> cash</span></>
                          : <><Gift size={12} /><span>Earn <strong className="text-amber-600 dark:text-amber-400">{offer.rewardItem}</strong></span></>
                        }
                      </div>
                    </div>

                    <div className="mt-3 flex items-center gap-2">
                      {offer.resetType === 'SAME_OFFER' && (
                        <div className="flex items-center gap-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5">
                          <RotateCcw size={11} className="text-slate-400" />
                          <span className="text-slate-600 dark:text-slate-300">Repeats same level</span>
                        </div>
                      )}
                      {offer.resetType === 'NEXT_OFFER' && nextOffer && (
                        <div className="flex items-center gap-1.5 text-xs bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-lg px-2.5 py-1.5">
                          <ArrowRight size={11} className="text-indigo-500" />
                          <span className="text-indigo-700 dark:text-indigo-300">
                            Auto-upgrades to <strong>{nextOffer.title}</strong>
                          </span>
                        </div>
                      )}
                      {offer.resetType === 'CAMPAIGN_RESET' && (
                        <div className="flex items-center gap-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5">
                          <CheckCircle2 size={11} className="text-slate-400" />
                          <span className="text-slate-600 dark:text-slate-300">Stops after reward</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => onEditOffer(offer)}
                      className="flex items-center gap-1.5 text-xs font-semibold text-pos-primary border border-pos-primary/20 bg-pos-primary/5 px-3 py-1.5 rounded-lg hover:bg-pos-primary/10 transition-colors"
                    >
                      <Edit size={12} /> Edit
                    </button>
                    <button
                      onClick={() => onDeleteOffer(offer.id)}
                      className="flex items-center gap-1.5 text-xs font-semibold text-red-500 border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30 px-3 py-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-950/50 transition-colors"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
