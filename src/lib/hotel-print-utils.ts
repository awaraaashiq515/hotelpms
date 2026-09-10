import { ReservationItem } from '@/components/hotel/operations/ReservationWidget';

export function printDailyOperationsManifest(
  reservations: ReservationItem[],
  hotelName: string = 'Hotel Grand Palace',
  currency: string = '₹'
) {
  const printWindow = window.open('', '_blank', 'width=1000,height=800');
  if (!printWindow) {
    alert('Please allow popups to print the daily operations manifest.');
    return;
  }

  const todayStr = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const rowsHtml = reservations
    .map(
      (r, idx) => `
    <tr>
      <td style="text-align: center;">${idx + 1}</td>
      <td style="font-weight: 700; color: #0f172a;">${r.guestName}</td>
      <td style="font-family: monospace;">${r.reservationNumber}</td>
      <td style="font-weight: 700; text-align: center;">Room ${r.unitNumber}</td>
      <td>
        <span style="display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 700; background: #f1f5f9; border: 1px solid #cbd5e1;">
          ${r.status}
        </span>
      </td>
      <td>${r.arrivalDate ? new Date(r.arrivalDate).toLocaleDateString('en-GB') : '-'}</td>
      <td>${r.departureDate ? new Date(r.departureDate).toLocaleDateString('en-GB') : '-'}</td>
      <td style="text-align: right; font-weight: 700;">${currency} ${(r.totalAmount || 0).toLocaleString('en-IN')}</td>
      <td style="text-align: right; font-weight: 700; color: #dc2626;">${currency} ${(r.dueAmount || 0).toLocaleString('en-IN')}</td>
      <td style="font-size: 10px; color: #475569;">${r.notes || '-'}</td>
    </tr>
  `
    )
    .join('');

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Daily Operations Manifest - ${hotelName}</title>
        <style>
          @page {
            size: A4 landscape;
            margin: 10mm 12mm;
          }
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #0f172a;
            background: #ffffff;
            font-size: 11px;
            line-height: 1.3;
            padding: 20px;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            border-bottom: 2px solid #0f172a;
            padding-bottom: 12px;
            margin-bottom: 16px;
          }
          .title {
            font-size: 20px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .subtitle {
            font-size: 11px;
            color: #475569;
            margin-top: 2px;
          }
          .meta {
            text-align: right;
            font-size: 11px;
            color: #334155;
            font-weight: 600;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 8px;
          }
          th, td {
            border: 1px solid #cbd5e1;
            padding: 6px 8px;
            text-align: left;
          }
          th {
            background: #f1f5f9;
            font-size: 10px;
            font-weight: 800;
            text-transform: uppercase;
            color: #475569;
          }
          .footer {
            margin-top: 30px;
            display: flex;
            justify-content: space-between;
            font-size: 10px;
            color: #64748b;
            border-top: 1px solid #e2e8f0;
            padding-top: 8px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="title">${hotelName}</div>
            <div class="subtitle">DAILY FRONT DESK OPERATIONS MANIFEST & RESERVATIONS LIST</div>
          </div>
          <div class="meta">
            <div>Date: <strong>${todayStr}</strong></div>
            <div>Total Records: <strong>${reservations.length}</strong></div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 30px; text-align: center;">#</th>
              <th>Guest Full Name</th>
              <th>Res. Number</th>
              <th style="text-align: center;">Unit</th>
              <th>Status</th>
              <th>Arrival</th>
              <th>Departure</th>
              <th style="text-align: right;">Total Amount</th>
              <th style="text-align: right;">Balance Due</th>
              <th>Special Notes</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml || '<tr><td colspan="10" style="text-align: center; padding: 20px; color: #94a3b8;">No records found.</td></tr>'}
          </tbody>
        </table>

        <div class="footer">
          <div>Printed from Hotel Operations Desk &bull; Confidential Internal Report</div>
          <div>Authorized Front Desk Officer Signature: _______________________</div>
        </div>

        <script>
          window.onload = function() {
            window.print();
            setTimeout(() => { window.close(); }, 500);
          };
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
}
