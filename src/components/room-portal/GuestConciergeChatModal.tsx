'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  X, Send, Bot, User, Sparkles, Loader2, Volume2, 
  MessageSquare, Clock, Check, CheckCheck, RefreshCw, ChevronDown, Bell, UtensilsCrossed, ChefHat
} from 'lucide-react';
import { playNotificationSound, setupAudioUnlock } from '@/lib/notification-sound';

interface GuestChatMessage {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  time: string;
  senderName?: string;
  isStaffReply?: boolean;
  action?: any;
  quickReplies?: string[];
}

interface GuestConciergeChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  guestName: string;
  roomNumber: string;
  token: string;
  hotelName?: string;
}

const DEFAULT_QUICK_CHIPS = [
  '🛁 Extra Bath Towels',
  '❄️ AC Not Cooling Properly',
  '📶 What is the Wi-Fi Password?',
  '🍽️ In-Room Dining Menu',
  '🕒 Late Checkout till 1 PM',
  '🚖 Book Airport Cab',
  '🧹 Room Cleaning Service',
];

export default function GuestConciergeChatModal({
  isOpen,
  onClose,
  guestName,
  roomNumber,
  token,
  hotelName = 'Hotel Concierge',
}: GuestConciergeChatModalProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<GuestChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const messagesBodyRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const knownMsgIdsRef = useRef<Set<string>>(new Set());
  const initialLoadDoneRef = useRef(false);

  // Setup audio on first interaction
  useEffect(() => {
    setupAudioUnlock();
  }, []);

  // Scroll to bottom without scrolling window/page
  const scrollToBottom = () => {
    if (messagesBodyRef.current) {
      messagesBodyRef.current.scrollTop = messagesBodyRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        scrollToBottom();
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, messages]);

  // Fetch messages from API
  const fetchHistory = async (silent = false) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/room-portal/chat?token=${token}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });
      const data = await res.json();
      if (data.success && data.data?.messages) {
        const fetchedMsgs: GuestChatMessage[] = data.data.messages;

        if (fetchedMsgs.length === 0 && !initialLoadDoneRef.current) {
          // Provide an initial greeting if no chat history yet
          const initialGreeting: GuestChatMessage = {
            id: 'init-1',
            role: 'assistant',
            content: `Namaste & Welcome ${guestName}! Warm greetings to Room ${roomNumber}. I am your 24/7 AI Concierge & Front Desk assistant. How can we make your stay wonderful today?`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            senderName: 'AI Concierge',
            quickReplies: ['Extra Towels 🛁', 'Wi-Fi Details 📶', 'Room Service 🍽️', 'Housekeeping 🧹'],
          };
          setMessages([initialGreeting]);
          knownMsgIdsRef.current.add('init-1');
        } else {
          // Check for newly arrived messages that weren't here before
          if (initialLoadDoneRef.current && fetchedMsgs.length > 0) {
            const hasNewIncoming = fetchedMsgs.some(
              (m) => m.role === 'assistant' && !knownMsgIdsRef.current.has(m.id)
            );
            if (hasNewIncoming) {
              // Sound notification on guest side!
              playNotificationSound('lead');
            }
          }

          fetchedMsgs.forEach((m) => knownMsgIdsRef.current.add(m.id));
          setMessages(fetchedMsgs);
        }

        initialLoadDoneRef.current = true;
      }
    } catch (err) {
      console.warn('[Fetch Chat History Error]:', err);
    } finally {
      if (!silent) setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchHistory(false);
    }
  }, [token]);

  // 1. Cross-tab BroadcastChannel for 0ms instant sync with hotel reception
  useEffect(() => {
    let channel: BroadcastChannel | null = null;
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      channel = new BroadcastChannel('concierge_chat_channel');
      channel.onmessage = (event) => {
        const payload = event.data;
        if (!payload) return;

        // If staff or concierge replied specifically to this room
        const incomingRoom = String(payload.roomNumber || payload.room || '').trim();
        const currentRoom = String(roomNumber || '').trim();

        if (
          payload.type === 'STAFF_REPLY' &&
          (incomingRoom === currentRoom || !incomingRoom)
        ) {
          const newReply: GuestChatMessage = {
            id: `msg-staff-${Date.now()}-${Math.random()}`,
            role: 'assistant',
            content: payload.message || payload.content,
            time: payload.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            senderName: payload.senderName || 'Front Desk Associate',
            isStaffReply: true,
          };

          knownMsgIdsRef.current.add(newReply.id);
          setMessages((prev) => [...prev, newReply]);

          // Sound effect on guest tablet / phone!
          playNotificationSound('booking');

          // Scroll to bottom
          setTimeout(scrollToBottom, 50);
        }
      };
    }

    return () => {
      if (channel) channel.close();
    };
  }, [roomNumber]);

  // 2. Polling loop every 2.5 seconds when modal is open
  useEffect(() => {
    if (!isOpen || !token) return;
    const interval = setInterval(() => {
      fetchHistory(true);
    }, 2500);

    return () => clearInterval(interval);
  }, [isOpen, token]);

  // Handle quick chips and interactive actions (e.g. immediately opening menu)
  const handleQuickChipAction = (chipText: string) => {
    const lower = chipText.toLowerCase();
    if (
      lower.includes('menu') || 
      lower.includes('dining') || 
      lower.includes('order food') || 
      lower.includes('view full menu') ||
      lower.includes('view food menu') ||
      lower.includes('order dum biryani') ||
      lower.includes('order biryani') ||
      lower.includes('open in-room dining')
    ) {
      if (lower.includes('buffet') || lower.includes('daily')) {
        onClose();
        router.push('/room-portal/dashboard/daily-menu');
        return;
      }
      onClose();
      router.push('/room-portal/dashboard/room-service');
      return;
    }
    handleSendMessage(chipText);
  };

  // Send message
  const handleSendMessage = async (textToSend?: string) => {
    const raw = (textToSend || input).trim();
    if (!raw || sending || !token) return;

    setupAudioUnlock();
    playNotificationSound('ding');

    const currentTimeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const localUserMsg: GuestChatMessage = {
      id: `local-${Date.now()}`,
      role: 'user',
      content: raw,
      time: currentTimeStr,
      senderName: guestName,
    };

    knownMsgIdsRef.current.add(localUserMsg.id);
    setMessages((prev) => [...prev, localUserMsg]);
    setInput('');
    setSending(true);

    // 1. Broadcast instantly to Reception AI Concierge tab (0ms latency!)
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const bc = new BroadcastChannel('concierge_chat_channel');
        bc.postMessage({
          type: 'GUEST_MESSAGE',
          room: String(roomNumber),
          roomNumber: String(roomNumber),
          guest: guestName,
          guestName: guestName,
          content: raw,
          message: raw,
          time: currentTimeStr,
        });
        setTimeout(() => bc.close(), 500);
      }
    } catch (e) {}

    // 2. Call API route to save to DB and get AI Concierge reply
    try {
      const res = await fetch('/api/room-portal/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: raw }),
      });

      const data = await res.json();
      if (data.success && data.aiMessage) {
        const aiMsg: GuestChatMessage = {
          id: data.aiMessage.id || `ai-${Date.now()}`,
          role: 'assistant',
          content: data.aiMessage.content,
          time: data.aiMessage.time || currentTimeStr,
          action: data.aiMessage.action,
          quickReplies: data.aiMessage.quickReplies,
          senderName: data.aiMessage.senderName || 'AI Concierge',
        };

        knownMsgIdsRef.current.add(aiMsg.id);
        setMessages((prev) => [...prev, aiMsg]);

        // Play pleasant chime on guest side when reply arrives!
        playNotificationSound('lead');

        // Also broadcast the reply to keep reception session updated
        try {
          if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
            const bc = new BroadcastChannel('concierge_chat_channel');
            bc.postMessage({
              type: 'AI_REPLY_SYNC',
              roomNumber: String(roomNumber),
              message: aiMsg.content,
              action: aiMsg.action,
              time: currentTimeStr,
            });
            setTimeout(() => bc.close(), 500);
          }
        } catch (e) {}
      }
    } catch (err) {
      console.error('[Send Message Error]:', err);
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: 'rgba(3, 7, 18, 0.75)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div 
        style={{
          width: '100%',
          maxWidth: '560px',
          height: '92vh',
          maxHeight: '680px',
          background: '#090d16',
          border: '1px solid rgba(139, 92, 246, 0.35)',
          borderRadius: '24px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 35px rgba(139, 92, 246, 0.25)',
        }}
      >
        {/* Header */}
        <div 
          style={{
            padding: '16px 20px',
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(99, 102, 241, 0.15) 100%)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div 
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 16px rgba(139, 92, 246, 0.4)',
                position: 'relative',
              }}
            >
              <Sparkles size={20} color="white" />
              <span 
                style={{
                  position: 'absolute',
                  bottom: '-2px',
                  right: '-2px',
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: '#10b981',
                  border: '2px solid #090d16',
                }}
              />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ color: 'white', fontSize: '15px', fontWeight: 900, margin: 0 }}>
                  AI Concierge & Helpdesk
                </h3>
                <span 
                  style={{
                    padding: '2px 8px',
                    borderRadius: '6px',
                    background: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    color: '#6ee7b7',
                    fontSize: '10px',
                    fontWeight: 800,
                  }}
                >
                  Room {roomNumber}
                </span>
              </div>
              <p style={{ color: 'rgb(148, 163, 184)', fontSize: '11px', margin: '2px 0 0 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>Guest: {guestName}</span>
                <span>•</span>
                <span style={{ color: '#a78bfa', fontWeight: 700 }}>24/7 Live Assistance</span>
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => fetchHistory(false)}
              title="Refresh Chat"
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: 'rgb(148, 163, 184)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <RefreshCw size={14} />
            </button>
            <button
              onClick={onClose}
              title="Close"
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '10px',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: 'rgb(252, 165, 165)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Quick Suggestion Chips Bar */}
        <div 
          style={{
            padding: '8px 16px',
            background: 'rgba(15, 23, 42, 0.6)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            overflowX: 'auto',
            whiteSpace: 'nowrap',
          }}
        >
          <span style={{ fontSize: '10px', fontWeight: 800, color: 'rgb(100, 116, 139)', textTransform: 'uppercase', letterSpacing: '1px', flexShrink: 0 }}>
            Quick:
          </span>
          {DEFAULT_QUICK_CHIPS.map((chip, idx) => (
            <button
              key={idx}
              onClick={() => handleQuickChipAction(chip)}
              disabled={sending}
              style={{
                padding: '4px 12px',
                borderRadius: '12px',
                background: 'rgba(139, 92, 246, 0.12)',
                border: '1px solid rgba(139, 92, 246, 0.25)',
                color: '#ddd6fe',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                flexShrink: 0,
                transition: 'all 0.15s ease',
              }}
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Messages Body */}
        <div 
          ref={messagesBodyRef}
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
          }}
        >
          {loadingHistory ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, flexDirection: 'column', gap: '8px' }}>
              <Loader2 size={28} className="animate-spin" color="#a78bfa" />
              <p style={{ color: 'rgb(148, 163, 184)', fontSize: '12px', fontWeight: 600 }}>Loading conversation...</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div 
                  key={msg.id}
                  style={{
                    display: 'flex',
                    flexDirection: isUser ? 'row-reverse' : 'row',
                    gap: '10px',
                    alignItems: 'flex-start',
                  }}
                >
                  {/* Avatar */}
                  <div 
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '10px',
                      background: isUser ? '#6366f1' : msg.isStaffReply ? 'linear-gradient(135deg, #d97706, #b45309)' : 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      flexShrink: 0,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                    }}
                  >
                    {isUser ? <User size={15} /> : <Bot size={15} />}
                  </div>

                  {/* Message Bubble */}
                  <div style={{ maxWidth: '82%', display: 'flex', flexDirection: 'column', alignItems: isUser ? 'flex-end' : 'flex-start' }}>
                    <div 
                      style={{
                        padding: '10px 14px',
                        borderRadius: '16px',
                        borderTopRightRadius: isUser ? '4px' : '16px',
                        borderTopLeftRadius: !isUser ? '4px' : '16px',
                        background: isUser 
                          ? 'linear-gradient(135deg, #6366f1, #4f46e5)' 
                          : msg.isStaffReply
                          ? 'rgba(30, 41, 59, 0.95)'
                          : 'rgba(30, 41, 59, 0.85)',
                        border: isUser 
                          ? '1px solid rgba(99, 102, 241, 0.5)' 
                          : msg.isStaffReply
                          ? '1px solid rgba(245, 158, 11, 0.4)'
                          : '1px solid rgba(255, 255, 255, 0.08)',
                        color: 'white',
                        fontSize: '13px',
                        lineHeight: 1.5,
                        boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
                        whiteSpace: 'pre-line',
                      }}
                    >
                      {msg.isStaffReply && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '6px', fontSize: '10px', fontWeight: 800, color: '#fbbf24' }}>
                          <Bell size={12} />
                          <span>Front Desk Reception Staff:</span>
                        </div>
                      )}
                      {msg.content}

                      {/* Action Notification Card if housekeeping or maintenance dispatched */}
                      {msg.action && (
                        <div 
                          style={{
                            marginTop: '8px',
                            padding: '8px 12px',
                            borderRadius: '10px',
                            background: 'rgba(139, 92, 246, 0.15)',
                            border: '1px solid rgba(139, 92, 246, 0.3)',
                            fontSize: '11px',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span style={{ fontWeight: 800, color: '#c4b5fd' }}>
                              ⚡ {msg.action.title}
                            </span>
                            {msg.action.ticketNo && (
                              <span style={{ fontSize: '9px', fontFamily: 'monospace', color: '#a78bfa' }}>
                                #{msg.action.ticketNo}
                              </span>
                            )}
                          </div>
                          <p style={{ margin: 0, color: 'rgb(203, 213, 225)', fontSize: '10px' }}>
                            {msg.action.description}
                          </p>
                        </div>
                      )}

                      {/* 🍽️ Actionable Menu Buttons when guest asks about food/menu */}
                      {(msg.action?.type === 'ROOM_SERVICE_MENU' || 
                        msg.content.toLowerCase().includes('dining') || 
                        msg.content.toLowerCase().includes('menu') || 
                        msg.content.toLowerCase().includes('biryani') ||
                        msg.content.toLowerCase().includes('food') ||
                        msg.content.toLowerCase().includes('khana') ||
                        msg.content.toLowerCase().includes('chef special')) && (
                        <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              router.push('/room-portal/dashboard/room-service');
                            }}
                            style={{
                              padding: '9px 14px',
                              borderRadius: '12px',
                              background: 'linear-gradient(135deg, #f59e0b, #ea580c)',
                              border: 'none',
                              color: 'white',
                              fontWeight: 800,
                              fontSize: '11px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px',
                              cursor: 'pointer',
                              boxShadow: '0 4px 14px rgba(245, 158, 11, 0.35)',
                              transition: 'transform 0.1s ease',
                            }}
                          >
                            <UtensilsCrossed size={14} />
                            <span>🍽️ Open In-Room Dining Menu (Order Food)</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              router.push('/room-portal/dashboard/daily-menu');
                            }}
                            style={{
                              padding: '8px 14px',
                              borderRadius: '12px',
                              background: 'rgba(255, 255, 255, 0.08)',
                              border: '1px solid rgba(255, 255, 255, 0.2)',
                              color: '#fef3c7',
                              fontWeight: 700,
                              fontSize: '11px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px',
                              cursor: 'pointer',
                            }}
                          >
                            <ChefHat size={14} />
                            <span>👨‍🍳 View Today's Buffet & Daily Spreads</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Meta / Timestamp */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', padding: '0 4px' }}>
                      <span style={{ fontSize: '10px', color: 'rgb(100, 116, 139)' }}>
                        {msg.senderName || (isUser ? guestName : 'Concierge')} · {msg.time}
                      </span>
                    </div>

                    {/* Contextual Quick Replies Chips */}
                    {msg.quickReplies && msg.quickReplies.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                        {msg.quickReplies.map((qr, i) => (
                          <button
                            key={i}
                            onClick={() => handleQuickChipAction(qr)}
                            style={{
                              padding: '4px 11px',
                              borderRadius: '10px',
                              background: 'rgba(99, 102, 241, 0.18)',
                              border: '1px solid rgba(99, 102, 241, 0.35)',
                              color: '#c7d2fe',
                              fontSize: '10px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            {qr}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}

          {sending && (
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <div 
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                }}
              >
                <Bot size={15} />
              </div>
              <div 
                style={{
                  padding: '8px 14px',
                  borderRadius: '16px',
                  background: 'rgba(30, 41, 59, 0.85)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#a78bfa' }} className="animate-bounce" />
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#a78bfa' }} className="animate-bounce" />
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#a78bfa' }} className="animate-bounce" />
                <span style={{ fontSize: '11px', color: 'rgb(148, 163, 184)', marginLeft: '4px' }}>Concierge is typing…</span>
              </div>
            </div>
          )}
        </div>

        {/* Input Footer */}
        <div 
          style={{
            padding: '14px 16px',
            background: 'rgba(15, 23, 42, 0.95)',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            style={{ display: 'flex', alignItems: 'center', gap: '10px' }}
          >
            <input 
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything or request service for Room "
              style={{
                flex: 1,
                height: '44px',
                borderRadius: '14px',
                background: 'rgba(30, 41, 59, 0.8)',
                border: '1px solid rgba(139, 92, 246, 0.25)',
                padding: '0 16px',
                color: 'white',
                fontSize: '13px',
                outline: 'none',
              }}
            />

            <button
              type="submit"
              disabled={!input.trim() || sending}
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '14px',
                background: input.trim() && !sending ? 'linear-gradient(135deg, #8b5cf6, #6366f1)' : 'rgba(255, 255, 255, 0.06)',
                border: 'none',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: input.trim() && !sending ? 'pointer' : 'default',
                opacity: input.trim() && !sending ? 1 : 0.4,
                boxShadow: input.trim() && !sending ? '0 4px 16px rgba(139, 92, 246, 0.4)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
