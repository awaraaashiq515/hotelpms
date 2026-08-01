import Imap from 'imap';
import { simpleParser } from 'mailparser';

const imap = new Imap({
  user: 'abhinash22112006@gmail.com',
  password: 'zgqg vorr zbzi kxcl',
  host: 'imap.gmail.com',
  port: 993,
  tls: true,
  tlsOptions: { rejectUnauthorized: false },
});

imap.once('ready', () => {
  imap.openBox('INBOX', false, (err, box) => {
    if (err) {
      console.error('Error opening box:', err);
      imap.end();
      return;
    }

    console.log('Successfully connected to Gmail! Total messages:', box.messages.total);

    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - 3);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const dateStr = `${sinceDate.getDate()}-${months[sinceDate.getMonth()]}-${sinceDate.getFullYear()}`;
    console.log('Searching emails SINCE', dateStr);

    const searchCriteria = [
      ['SINCE', dateStr],
      ['OR', ['SUBJECT', 'Agoda'],
      ['OR', ['SUBJECT', 'Booking.com'],
      ['OR', ['SUBJECT', 'Airbnb'],
      ['OR', ['SUBJECT', 'Reservation'],
      ['OR', ['SUBJECT', 'Booking'], ['SUBJECT', 'Confirm']]]]]]
    ];
    console.log('Searching with criteria:', JSON.stringify(searchCriteria));

    imap.search(searchCriteria as any, (searchErr, uids) => {
      if (searchErr) {
        console.error('Error searching:', searchErr);
        imap.end();
        return;
      }

      console.log('Search returned UIDs:', uids);
      if (!uids || uids.length === 0) {
        console.log('No emails found.');
        imap.end();
        return;
      }

      const fetchUids = uids.slice(-5);
      console.log('Fetching details of UIDs:', fetchUids);

      const f = imap.fetch(fetchUids, { bodies: '' });
      f.on('message', (msg, seqno) => {
        msg.on('body', (stream, info) => {
          simpleParser(stream as any, (parseErr, parsed) => {
            if (parseErr) {
              console.error('Parse error:', parseErr);
              return;
            }
            const subject = parsed.subject || '';
            const htmlStr = typeof parsed.html === 'string' ? parsed.html : '';
            const text = parsed.text || htmlStr.replace(/<[^>]*>/g, ' ') || '';
            
            // RUN PARSING ALGORITHM
            let guestName: string | null = null;
            // Use [A-Za-z ] instead of [A-Za-z\s] to prevent matching across lines
            const firstNameMatch = text.match(/(?:First\s+Name|Customer\s+First\s+Name)\s*[:*]*\s*([A-Za-z ]+)/i);
            const lastNameMatch = text.match(/(?:Last\s+Name|Customer\s+Last\s+Name)\s*[:*]*\s*([A-Za-z ]+)/i);
            if (firstNameMatch?.[1]) {
              guestName = firstNameMatch[1].trim();
              if (lastNameMatch?.[1]) {
                guestName += ' ' + lastNameMatch[1].trim();
              }
            }
            if (!guestName || guestName.toLowerCase().includes('details')) {
              const nameMatch = text.match(/(?:Customer\s+Name|Guest\s+Name|Guest\s+1|Booked\s+By)\s*[:*]*\s*([A-Za-z ]+)/i);
              if (nameMatch?.[1]) guestName = nameMatch[1].trim();
            }
            if (!guestName || guestName.toLowerCase().includes('details')) {
              const dearMatch = text.match(/Dear\s+([A-Za-z ]{3,40})/i);
              if (dearMatch?.[1]) guestName = dearMatch[1].trim();
            }

            let checkIn: string | null = null;
            let checkOut: string | null = null;
            // Use word boundaries for \bfrom\b and \bto\b, and literal space inside character set to avoid matching newlines
            const checkInMatch = text.match(/(?:check[-_]in|arrival|\bfrom\b)(?:\s+date|\s+time)?\s*[:*]*\s*([A-Za-z0-9 ,\-\/\.]{6,25})/i);
            if (checkInMatch?.[1]) checkIn = checkInMatch[1].trim();
            const checkOutMatch = text.match(/(?:check[-_]out|departure|\bto\b)(?:\s+date|\s+time)?\s*[:*]*\s*([A-Za-z0-9 ,\-\/\.]{6,25})/i);
            if (checkOutMatch?.[1]) checkOut = checkOutMatch[1].trim();

            let amount: string | null = null;
            // Handle optional middle words like (incl. taxes & fees) or newlines before currency
            const amountPatterns = [
              /(?:net\s+rate|total\s+amount|grand\s+total|total\s+charged\s+amount|room\s+rate)[\s\S]*?(?:inr|rs\.?|₹|\$|usd|eur)?[\s]*([0-9,]+(?:\.[0-9]{1,2})?)/i,
              /INR\s+([0-9,]+(?:\.[0-9]{1,2})?)/i
            ];
            for (const p of amountPatterns) {
              const m = text.match(p);
              if (m?.[1]) {
                const val = parseFloat(m[1].replace(/,/g, ''));
                if (!isNaN(val) && val > 0) {
                  amount = m[1].trim();
                  break;
                }
              }
            }

            console.log(`=======================[ Msg Seq ${seqno} ]=======================`);
            console.log('Subject:', subject);
            console.log('Parsed Guest Name:', guestName);
            console.log('Parsed Check-In:', checkIn);
            console.log('Parsed Check-Out:', checkOut);
            console.log('Parsed Amount:', amount);
          });
        });
      });

      f.once('end', () => {
        console.log('Fetch completed. Closing IMAP.');
        setTimeout(() => {
          imap.end();
        }, 3000);
      });
    });
  });
});

imap.once('error', (err) => {
  console.error('Connection error:', err);
});

imap.once('end', () => {
  console.log('IMAP connection ended.');
});

imap.connect();
