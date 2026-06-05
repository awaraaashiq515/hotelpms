/* ─────────────────────────────────────────────
   Walkie-Talkie / Staff Portal — shared types
   Edit this file to add new fields globally.
───────────────────────────────────────────── */

export interface StaffUser {
  id: string
  fullName: string
  email: string
  phone: string | null
  wtStatus: string
  propertyId: string | null
  property?: { id: string; name: string; code: string } | null
  role?: { name: string } | null
}

export interface TalkMessage {
  id: string
  channelId: string
  speakerId: string
  startedAt: string
  endedAt?: string | null
  recordingUrl?: string | null
  speaker?: {
    id: string
    fullName: string
    designation?: string | null
  } | null
}

export interface Contact {
  id: string
  name: string
  designation: string
  wtStatus: string
}

export interface Channel {
  id: string
  name: string
  type: string          // 'group' | 'direct'
  isEmergency: boolean
  membersCount?: number
}

export type Tab = 'ptt' | 'messages' | 'pos' | 'network' | 'settings'
