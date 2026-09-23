// Shared Hotel AI Concierge Engine & Knowledge Base

export interface HotelKnowledge {
  hotelName: string;
  wifiName: string;
  wifiPassword: string;
  breakfastTime: string;
  roomServiceHours: string;
  poolHours: string;
  gymHours: string;
  spaHours: string;
  checkoutTime: string;
  lateCheckoutPolicy: string;
  conciergePhone: string;
  doctorOnCall: string;
}

export interface ChatAction {
  type: 
    | 'HOUSEKEEPING_CREATED' 
    | 'MAINTENANCE_CREATED' 
    | 'ROOM_SERVICE_MENU' 
    | 'SPA_RECOMMENDED' 
    | 'CAB_BOOKING_PREPARED' 
    | 'LATE_CHECKOUT_ELIGIBLE' 
    | 'DND_ACTIVATED' 
    | 'MEDICAL_ASSISTANCE_ALERT';
  ticketNo?: string;
  title: string;
  description: string;
  status?: string;
  ref?: string;
}

export interface ChatMessage {
  id: string;
  role: 'assistant' | 'user' | 'system';
  content: string;
  time: string;
  senderName?: string;
  action?: ChatAction;
  quickReplies?: string[];
  isStaffReply?: boolean;
}

export interface HotelSession {
  id: string;
  room: string;
  roomType: string;
  guest: string;
  guestPhone: string;
  tier: 'Gold Loyalty' | 'Platinum VIP' | 'Silver Member' | 'Regular';
  checkIn: string;
  checkOut: string;
  status: 'ACTIVE' | 'RESOLVED' | 'URGENT';
  lastMsg: string;
  time: string;
  unreadCount: number;
  history: ChatMessage[];
  coPilotDraft?: string;
}

export interface AIConciergeResponse {
  reply: string;
  intent: 
    | 'HOUSEKEEPING' 
    | 'MAINTENANCE' 
    | 'ROOM_SERVICE' 
    | 'SPA' 
    | 'TRANSPORT' 
    | 'CHECKOUT' 
    | 'FAQ' 
    | 'GREETING' 
    | 'DND' 
    | 'EMERGENCY' 
    | 'RECOMMENDATIONS' 
    | 'GENERAL_HINDI' 
    | 'GENERAL';
  action?: ChatAction;
  quickReplies: string[];
  sentiment: 'POSITIVE' | 'NEUTRAL' | 'URGENT';
}

export const DEFAULT_KNOWLEDGE: HotelKnowledge = {
  hotelName: 'GuestFlow Grand Luxury Resort & Suites',
  wifiName: 'GuestFlow-Resort-5G',
  wifiPassword: 'Welcome@Guest2026',
  breakfastTime: '7:00 AM – 10:30 AM (Level 1, The Palm Court)',
  roomServiceHours: '24 Hours (Dial 9 from room phone)',
  poolHours: '6:00 AM – 10:00 PM (Rooftop Deck, 5th Floor)',
  gymHours: '5:00 AM – 11:00 PM (Level 2, Keycard access)',
  spaHours: '9:00 AM – 9:00 PM (Level 3, Ayurvedic & Swedish Therapies)',
  checkoutTime: 'Standard: 11:00 AM · Express Checkout available',
  lateCheckoutPolicy: 'Complimentary until 1:00 PM for Gold/VIP guests, ₹500/hr thereafter',
  conciergePhone: '+91 98765 43210 / Ext 0',
  doctorOnCall: '24/7 Medical assistance available (Dial 0 for Emergency Desk)',
};

export const INITIAL_SESSIONS: HotelSession[] = [
  {
    id: 'sess-204',
    room: '204',
    roomType: 'Deluxe Suite',
    guest: 'Priya Mehta',
    guestPhone: '+91 98201 12345',
    tier: 'Gold Loyalty',
    checkIn: '2026-09-19',
    checkOut: '2026-09-23',
    status: 'ACTIVE',
    lastMsg: 'Can you book a spa slot?',
    time: '2m ago',
    unreadCount: 1,
    history: [
      { id: '1', role: 'assistant', content: 'Good afternoon, Ms. Priya Mehta! Welcome to Room 204. I am your personal AI Concierge. How may I assist you today?', time: '2:15 PM' },
      { id: '2', role: 'user', content: 'What time is breakfast tomorrow?', time: '2:16 PM' },
      { id: '3', role: 'assistant', content: 'Breakfast is served from 7:00 AM to 10:30 AM at The Palm Court restaurant on Level 1. A complimentary buffet with live dosa and waffle counters is included in your booking.', time: '2:16 PM' },
      { id: '4', role: 'user', content: 'Can you book a spa slot?', time: '2:18 PM' }
    ]
  },
  {
    id: 'sess-307',
    room: '307',
    roomType: 'Executive King',
    guest: 'Ramesh Sharma',
    guestPhone: '+91 98450 67890',
    tier: 'Silver Member',
    checkIn: '2026-09-20',
    checkOut: '2026-09-22',
    status: 'RESOLVED',
    lastMsg: 'Need extra towels',
    time: '5m ago',
    unreadCount: 0,
    history: [
      { id: '10', role: 'assistant', content: 'Hello Mr. Sharma, welcome to Room 307. How can we make your stay more comfortable?', time: '1:30 PM' },
      { id: '11', role: 'user', content: 'Need extra towels please', time: '1:32 PM' },
      { 
        id: '12', 
        role: 'assistant', 
        content: 'I have dispatched 2 fresh bath towels to Room 307 right away. Our housekeeping associate will deliver them within 10–12 minutes.', 
        time: '1:32 PM',
        action: { type: 'HOUSEKEEPING_CREATED', ticketNo: 'HK-307-882', title: 'Housekeeping Dispatched', description: '2 Extra Bath Towels requested for Room 307' }
      }
    ]
  },
  {
    id: 'sess-102',
    room: '102',
    roomType: 'Club Twin',
    guest: 'John Smith',
    guestPhone: '+1 415 890 1234',
    tier: 'Platinum VIP',
    checkIn: '2026-09-18',
    checkOut: '2026-09-24',
    status: 'ACTIVE',
    lastMsg: 'What restaurants are nearby?',
    time: '12m ago',
    unreadCount: 0,
    history: [
      { id: '20', role: 'assistant', content: 'Welcome Mr. John Smith! It is an honor to host you in Room 102 as our Platinum VIP guest.', time: '12:00 PM' },
      { id: '21', role: 'user', content: 'What restaurants are nearby?', time: '12:02 PM' },
      { id: '22', role: 'assistant', content: 'Within 500m of the resort:\n1. The Spice Garden (Fine Indian dining, 4.8★)\n2. Café Roma (Authentic Italian & wine cellar, 4.7★)\n3. Dragon Palace (Pan-Asian & Dimsums, 4.9★)\n\nWould you like me to reserve a VIP table or order in-room dining from our kitchen?', time: '12:02 PM' }
    ]
  },
  {
    id: 'sess-415',
    room: '415',
    roomType: 'Presidential Suite',
    guest: 'Ananya Roy',
    guestPhone: '+91 99001 54321',
    tier: 'Gold Loyalty',
    checkIn: '2026-09-20',
    checkOut: '2026-09-25',
    status: 'URGENT',
    lastMsg: 'AC cooling is low',
    time: '18m ago',
    unreadCount: 1,
    history: [
      { id: '30', role: 'assistant', content: 'Good day Ms. Roy, hope you are enjoying your stay in Suite 415!', time: '11:15 AM' },
      { id: '31', role: 'user', content: 'The AC cooling is very low, room is warm.', time: '11:18 AM' }
    ]
  }
];

// Comprehensive NLP processor for Hotel Inquiries
export function processHotelConciergeQuery(
  rawMessage: string,
  guestName: string = 'Guest',
  roomNumber: string = '101',
  knowledge: HotelKnowledge = DEFAULT_KNOWLEDGE,
  preferredLanguage: string = 'en'
): AIConciergeResponse {
  const q = rawMessage.toLowerCase().trim();

  // 1. GREETINGS & PLEASANTRIES
  if (/^(hi|hello|hey|namaste|good\s*(morning|afternoon|evening)|hola|bonjour|salaam)/i.test(q)) {
    if (preferredLanguage === 'hi' || /(namaste|kese|kaise)/i.test(q)) {
      return {
        reply: `नमस्ते ${guestName}! ${knowledge.hotelName} में आपका स्वागत है। Room ${roomNumber} के लिए मैं आपकी क्या सहायता कर सकता हूँ? आप रूम सर्विस, हाउसकीपिंग, स्पा या टैक्सी के लिए कह सकते हैं।`,
        intent: 'GREETING',
        quickReplies: ['रूम सर्विस आर्डर 🍽️', 'एक्स्ट्रा तौलिया 🛁', 'स्पा बुकिंग 🧖', 'WiFi पासवर्ड 📶'],
        sentiment: 'POSITIVE'
      };
    }
    return {
      reply: `Good day, ${guestName}! Warm welcome from ${knowledge.hotelName}. How may I elevate your stay in Room ${roomNumber} today? Feel free to request room service, extra amenities, maintenance, spa bookings, or local recommendations.`,
      intent: 'GREETING',
      quickReplies: ['Order Room Service 🍽️', 'Request Extra Towels 🛁', 'Book Spa Slot 🧖', 'WiFi Password 📶'],
      sentiment: 'POSITIVE'
    };
  }

  // 2. HOUSEKEEPING & AMENITIES
  if (/(towel|towels|tauliya|bath|soap|shampoo|toiletr|water\s*bottle|mineral\s*water|pani|clean|cleaning|saaf|housekeeping|linen|bedsheet|pillow|takia|blanket|kambal|dental|shaving|brush|slippers|trash|dustbin)/i.test(q)) {
    let item = 'Housekeeping service';
    if (/(towel|tauliya)/i.test(q)) item = 'Fresh Bath Towels';
    else if (/(water|pani)/i.test(q)) item = 'Complimentary Mineral Water';
    else if (/(clean|saaf|cleaning|sweep)/i.test(q)) item = 'Full Room Cleaning & Turn-Down';
    else if (/(pillow|blanket|linen|bedsheet|takia|kambal)/i.test(q)) item = 'Extra Linens & Bedding';
    else if (/(soap|shampoo|dental|toiletr|brush|kit)/i.test(q)) item = 'Toiletry & Dental Kit';

    const ticketNo = `HK-${roomNumber}-${Math.floor(100 + Math.random() * 900)}`;

    return {
      reply: `I have immediately scheduled a housekeeping dispatch for ${item} to Room ${roomNumber}. Our floor housekeeping associate has been notified and will arrive within 10 to 12 minutes.`,
      intent: 'HOUSEKEEPING',
      action: {
        type: 'HOUSEKEEPING_CREATED',
        ticketNo,
        title: `Housekeeping: ${item}`,
        description: `Delivering to Room ${roomNumber} (${guestName}) · Priority: Normal`,
        status: 'PENDING'
      },
      quickReplies: ['Need Anything Else?', 'Check Delivery Status', 'Add Cleaning Instructions'],
      sentiment: 'POSITIVE'
    };
  }

  // 3. MAINTENANCE & TECHNICAL ISSUES
  if (/(ac|air\s*condition|cooling|cold|heater|remote|tv|television|water\s*leak|leakage|geyser|hot\s*water|plumb|tap|flush|light|bulb|electricity|power|keycard|key\s*card|door\s*lock|safe|locker|drain)/i.test(q)) {
    let issue = 'Maintenance inspection';
    if (/(ac|cooling|cold)/i.test(q)) issue = 'AC cooling & climate control';
    else if (/(tv|remote)/i.test(q)) issue = 'TV/Remote control';
    else if (/(geyser|hot\s*water)/i.test(q)) issue = 'Geyser / Hot water pressure';
    else if (/(leak|leakage|plumb|tap|flush|drain)/i.test(q)) issue = 'Bathroom plumbing & drainage';
    else if (/(keycard|key\s*card|door\s*lock)/i.test(q)) issue = 'Keycard sensor & door lock';
    else if (/(light|bulb|electricity|power)/i.test(q)) issue = 'Electrical fixtures & lighting';

    const ticketNo = `MNT-${roomNumber}-${Math.floor(100 + Math.random() * 900)}`;

    return {
      reply: `We sincerely apologize for the inconvenience with the ${issue} in Room ${roomNumber}. I have logged an urgent Maintenance Ticket (#${ticketNo}). An on-duty engineering technician has been dispatched to your room right away.`,
      intent: 'MAINTENANCE',
      action: {
        type: 'MAINTENANCE_CREATED',
        ticketNo,
        title: `Engineering: ${issue}`,
        description: `Room ${roomNumber} · Reported by ${guestName} · Priority: URGENT`,
        status: 'DISPATCHED'
      },
      quickReplies: ['Contact Duty Manager', 'Request Technician ETA', 'Switch Room If Delayed'],
      sentiment: 'URGENT'
    };
  }

  // 4. ROOM SERVICE & DINING
  if (/(food|eat|dinner|lunch|breakfast|room\s*service|menu|khana|chai|coffee|tea|snack|drink|beverage|hungry|chef|order|midnight)/i.test(q)) {
    return {
      reply: `Our In-Room Dining is available 24/7! (${knowledge.roomServiceHours}).\n\n🔥 Today's Chef Specials:\n• Mughlai Dum Biryani (Vegetable / Chicken / Lamb)\n• Wood-Fired Margherita Pizza & Fettuccine Alfredo\n• Dal Makhani with Tandoori Butter Naan\n• Classic Club Sandwich with Crinkle Fries & Espresso\n\nWould you like me to open the digital dining menu or place a quick chef's special order for Room ${roomNumber}?`,
      intent: 'ROOM_SERVICE',
      action: {
        type: 'ROOM_SERVICE_MENU',
        title: '24/7 In-Room Dining Menu',
        description: 'Menu ready on guest tablet · Dial 9 from room phone'
      },
      quickReplies: ['View Full Menu 📜', 'Order Dum Biryani 🍲', 'Tea / Coffee Set ☕', 'Breakfast Timings 🍳'],
      sentiment: 'POSITIVE'
    };
  }

  // 5. BREAKFAST INQUIRY
  if (/(breakfast|nashta|morning\s*meal|buffet)/i.test(q)) {
    return {
      reply: `Breakfast is served daily from ${knowledge.breakfastTime}. Our breakfast spread includes live South Indian dosas, American waffles, fresh fruit juices, and artisanal bakery selections. In-room breakfast can also be ordered by dialing 9.`,
      intent: 'FAQ',
      quickReplies: ['View Breakfast Menu', 'Set 7:00 AM Wake-Up Call', 'Order Breakfast to Bed'],
      sentiment: 'POSITIVE'
    };
  }

  // 6. SPA & WELLNESS
  if (/(spa|massage|sauna|jacuzzi|ayurved|facial|therapy|wellness|relax)/i.test(q)) {
    return {
      reply: `Our Sanctuary Wellness Spa is open from ${knowledge.spaHours}. Available treatments:\n• Swedish Deep Relaxation Massage (60 min)\n• Aromatherapy Anti-Stress Session (75 min)\n• Ayurvedic Herbal Oil Shirodhara\n\nNext available slots for Room ${roomNumber} today are 4:00 PM and 6:30 PM. Would you like me to reserve one?`,
      intent: 'SPA',
      action: {
        type: 'SPA_RECOMMENDED',
        title: 'Sanctuary Luxury Spa',
        description: 'Available slots: 4:00 PM & 6:30 PM · Level 3'
      },
      quickReplies: ['Book 4:00 PM Slot 💆', 'Book 6:30 PM Slot 🧖', 'View Spa Tariff 📜'],
      sentiment: 'POSITIVE'
    };
  }

  // 7. SWIMMING POOL & GYM
  if (/(pool|swim|swimming|gym|fitness|workout|exercise|treadmill)/i.test(q)) {
    return {
      reply: `🏊 Swimming Pool: Open daily from ${knowledge.poolHours} on the Rooftop Deck (5th Floor). Heated to 28°C with complimentary poolside towels.\n\n🏋️ Fitness Center: Open daily from ${knowledge.gymHours} on Level 2 with state-of-the-art cardio and strength equipment. Access using your room keycard.`,
      intent: 'FAQ',
      quickReplies: ['Request Pool Towels 🏊', 'Personal Trainer Info', 'Locker Room Access'],
      sentiment: 'POSITIVE'
    };
  }

  // 8. TAXI & AIRPORT TRANSIT
  if (/(taxi|cab|airport|uber|driver|car|pickup|drop|transfer|flight)/i.test(q)) {
    const bookingRef = `CAB-${Math.floor(1000 + Math.random() * 9000)}`;
    return {
      reply: `I can arrange a chauffeur-driven hotel cab for you. We provide sanitized premium sedans and SUVs:\n\n• Airport Drop (Sedan): ₹850 flat\n• Airport Drop (Innova Crysta SUV): ₹1,400 flat\n• 8-Hour City Sightseeing: ₹2,200\n\nPlease let me know your preferred departure time and luggage count to finalize booking ref #${bookingRef}.`,
      intent: 'TRANSPORT',
      action: {
        type: 'CAB_BOOKING_PREPARED',
        ref: bookingRef,
        title: 'Chauffeur Cab Initiated',
        description: `Room ${roomNumber} · Chauffeur arrangement for ${guestName}`
      },
      quickReplies: ['Book Airport Sedan (₹850)', 'Book Airport SUV (₹1400)', 'Flight Status Check'],
      sentiment: 'POSITIVE'
    };
  }

  // 9. CHECKOUT & LATE CHECKOUT
  if (/(checkout|check-out|check\s*out|late\s*checkout|extend|departure|bill|folio)/i.test(q)) {
    return {
      reply: `${knowledge.checkoutTime}.\n\nLate Checkout: ${knowledge.lateCheckoutPolicy}. I can submit a request for complimentary late checkout until 1:00 PM for Room ${roomNumber}. Shall I confirm this for you?`,
      intent: 'CHECKOUT',
      action: {
        type: 'LATE_CHECKOUT_ELIGIBLE',
        title: 'Late Checkout Request',
        description: `Room ${roomNumber} · Extension requested up to 1:00 PM`
      },
      quickReplies: ['Confirm Late Checkout 1:00 PM', 'View Room Bill / Folio', 'Book Airport Cab'],
      sentiment: 'POSITIVE'
    };
  }

  // 10. WIFI DETAILS
  if (/(wifi|wi-fi|internet|password|connect|network)/i.test(q)) {
    return {
      reply: `High-speed complimentary Wi-Fi is active throughout the resort!\n\n📶 Network: "${knowledge.wifiName}"\n🔑 Password: "${knowledge.wifiPassword}"\n\nSimply select the network and enter the credentials. For high-bandwidth conference calls, dial 0 for IT assistance.`,
      intent: 'FAQ',
      quickReplies: ['Test Connection Speed', 'Connect Smart TV', 'Contact IT Desk'],
      sentiment: 'POSITIVE'
    };
  }

  // 11. DO NOT DISTURB (DND)
  if (/(dnd|do\s*not\s*disturb|disturb|shanti|so\s*raha|sleep)/i.test(q)) {
    return {
      reply: `I have placed Room ${roomNumber} on "Do Not Disturb" (DND). Housekeeping and service associates will not knock or ring your room bell. Have a wonderful and peaceful rest!`,
      intent: 'DND',
      action: {
        type: 'DND_ACTIVATED',
        title: 'Do Not Disturb Active',
        description: `Room ${roomNumber} marked DND on Reception Console`
      },
      quickReplies: ['Remove DND Later', 'Schedule Wake-Up Call', 'Quiet Hours Policy'],
      sentiment: 'POSITIVE'
    };
  }

  // 12. MEDICAL & EMERGENCY
  if (/(doctor|medical|medicine|hospital|emergency|pain|headache|fever|sick|ambulance|dawa|tab)/i.test(q)) {
    return {
      reply: `Your health and well-being are our highest priority. We have first-aid and on-call medical assistance available 24/7. Our Duty Manager has been alerted for Room ${roomNumber}. If you need an on-call physician or medicine delivered from the pharmacy, we will arrange it right away.`,
      intent: 'EMERGENCY',
      action: {
        type: 'MEDICAL_ASSISTANCE_ALERT',
        title: 'Priority Medical Alert Triggered',
        description: `Front Desk & On-call Doctor notified for Room ${roomNumber}`
      },
      quickReplies: ['Connect Duty Manager 📞', 'First Aid / Painkiller Needed', 'Call Emergency Ambulance 🚑'],
      sentiment: 'URGENT'
    };
  }

  // 13. LOCAL RECOMMENDATIONS & SIGHTSEEING
  if (/(restaurant|nearby|places|visit|sightseeing|shopping|mall|market|attraction|tourism)/i.test(q)) {
    return {
      reply: `Here are the top attractions and dining spots near ${knowledge.hotelName}:\n\n🍽️ Top Dining:\n• The Spice Garden (500m) - Fine heritage Indian cuisine (4.8★)\n• Waterfront Grill (1.2 km) - Sunset lake-view lounge (4.7★)\n• Café Roma (400m) - Authentic stone-baked Italian (4.8★)\n\n🏛️ Sightseeing & Culture:\n• Heritage City Palace & Museum (3.5 km)\n• Sunset Point & Botanical Walk (2.0 km)\n• Grand Central Shopping Arcade (1.5 km)\n\nOur concierge desk can arrange VIP reservations and chauffeur cars. Would you like me to book a table or taxi?`,
      intent: 'RECOMMENDATIONS',
      quickReplies: ['Reserve Spice Garden', 'Book City Sightseeing Tour', 'Cab to Shopping Mall'],
      sentiment: 'POSITIVE'
    };
  }

  // 14. HINDI / HINGLISH QUERIES FALLBACK
  if (/(chahiye|karo|bhejo|kahan|hai|kitne|baje|madad|theek|nahi|samajh|kardo)/i.test(q)) {
    return {
      reply: `नमस्ते ${guestName}! मैंने आपकी रिक्वेस्ट नोट कर ली है। Room ${roomNumber} के लिए हमारी होटल टीम तत्पर है। क्या आप तौलिया, पानी, रूम की सफाई, या खाना मंगवाना चाहते हैं? बस बताइए, तुरंत अरेंज हो जाएगा!`,
      intent: 'GENERAL_HINDI',
      quickReplies: ['तौलिया चाहिए 🛁', 'पानी की बोतल 💧', 'खाना मंगवाना है 🍲', 'AC ठीक करो ❄️'],
      sentiment: 'POSITIVE'
    };
  }

  // DEFAULT
  return {
    reply: `Thank you for reaching out, ${guestName}! I am here to assist you with anything you need during your stay in Room ${roomNumber}. I can arrange housekeeping, room service, laundry, spa appointments, airport taxis, or answer any questions about the hotel. What can I help you with?`,
    intent: 'GENERAL',
    quickReplies: ['Room Service 🛎️', 'Housekeeping 🧹', 'Spa Booking 🧖', 'Airport Taxi 🚖'],
    sentiment: 'NEUTRAL'
  };
}
