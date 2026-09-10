export interface HousekeepingPrintItem {
  unitNumber: string;
  unitType: string;
  condition: string;
  unitStatus: string;
  arrivalTime: string;
  arrivalDate: string;
  departureDate: string;
  frontdeskStatus: string;
  assignedTo: string;
  doNotDisturb: boolean;
}

export function printHousekeepingInspectionSheet(
  items: HousekeepingPrintItem[],
  hotelName: string = 'Hotel Grand Palace'
) {
  const printWindow = window.open('', '_blank', 'width=1050,height=800');
  if (!printWindow) {
    alert('Please allow popups to print the Housekeeping Inspection Sheet.');
    return;
  }

  const todayStr = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const rowsHtml = items
    .map(
      (item, idx) => `
    <tr>
      <td style="text-align: center; font-weight: bold;">${idx + 1}</td>
      <td style="font-weight: 800; font-size: 13px; color: #0f172a;">${item.unitNumber}</td>
      <td style="color: #475569;">${item.unitType}</td>
      <td>
        <span style="display: inline-block; padding: 3px 8px; border-radius: 4px; font-size: 10px; font-weight: 800; text-transform: uppercase; ${
          item.condition.toUpperCase() === 'CLEAN'
            ? 'background: #dcfce7; color: #166534; border: 1px solid #86efac;'
            : item.condition.toUpperCase() === 'DIRTY'
            ? 'background: #fee2e2; color: #991b1b; border: 1px solid #fca5a5;'
            : 'background: #fef3c7; color: #92400e; border: 1px solid #fde68a;'
        }">
          ${item.condition}
        </span>
      </td>
      <td>
        <span style="font-weight: 700; color: ${item.unitStatus === 'Occupied' ? '#0284c7' : '#64748b'};">
          ${item.unitStatus}
        </span>
      </td>
      <td style="font-family: monospace;">${item.arrivalTime}</td>
      <td>${item.arrivalDate}</td>
      <td>${item.departureDate}</td>
      <td>
        <span style="display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 700; background: #f1f5f9; border: 1px solid #cbd5e1;">
          ${item.frontdeskStatus}
        </span>
      </td>
      <td style="font-weight: 600; color: #334155;">${item.assignedTo || 'Unassigned'}</td>
      <td style="text-align: center; font-weight: 700; color: ${item.doNotDisturb ? '#dc2626' : '#94a3b8'};">
        ${item.doNotDisturb ? 'DND YES' : 'NO'}
      </td>
      <td style="border-left: 1px dashed #cbd5e1; width: 80px;"></td>
    </tr>
  `
    )
    .join('');

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Housekeeping Inspection Sheet - ${hotelName}</title>
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
            line-height: 1.35;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            padding-bottom: 12px;
            border-bottom: 2px solid #0f172a;
            margin-bottom: 14px;
          }
          .title-box h1 {
            font-size: 20px;
            font-weight: 800;
            color: #0f172a;
            text-transform: uppercase;
            letter-spacing: -0.5px;
          }
          .title-box p {
            font-size: 12px;
            font-weight: 600;
            color: #64748b;
            margin-top: 2px;
          }
          .meta-box {
            text-align: right;
            font-size: 11px;
            color: #475569;
          }
          .meta-box strong {
            color: #0f172a;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 10.5px;
          }
          th {
            background: #f8fafc;
            color: #334155;
            font-weight: 800;
            text-transform: uppercase;
            font-size: 9.5px;
            letter-spacing: 0.5px;
            padding: 7px 6px;
            border: 1px solid #cbd5e1;
            text-align: left;
          }
          td {
            padding: 6px 6px;
            border: 1px solid #e2e8f0;
            vertical-align: middle;
          }
          tr:nth-child(even) {
            background-color: #f8fafc;
          }
          .summary-bar {
            margin-top: 14px;
            padding-top: 10px;
            border-top: 1px solid #cbd5e1;
            display: flex;
            justify-content: space-between;
            font-size: 11px;
            color: #64748b;
          }
          .signature-box {
            margin-top: 28px;
            display: flex;
            justify-content: space-between;
            padding: 0 40px;
          }
          .sig-line {
            border-top: 1px solid #0f172a;
            width: 200px;
            text-align: center;
            font-size: 11px;
            font-weight: 700;
            padding-top: 5px;
          }
          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title-box">
            <h1>Housekeeping Inspection Sheet</h1>
            <p>${hotelName} • Daily Room Condition & Readiness Manifest</p>
          </div>
          <div class="meta-box">
            <div>Date: <strong>${todayStr}</strong></div>
            <div>Total Units: <strong>${items.length}</strong></div>
            <div>Dirty Pending: <strong>${items.filter((i) => i.condition.toUpperCase() === 'DIRTY').length}</strong></div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 30px; text-align: center;">#</th>
              <th style="width: 60px;">Unit</th>
              <th style="width: 110px;">Unit Type</th>
              <th style="width: 80px;">Condition</th>
              <th style="width: 75px;">Unit Status</th>
              <th style="width: 65px;">Arr Time</th>
              <th style="width: 80px;">Arr Date</th>
              <th style="width: 80px;">Dep Date</th>
              <th style="width: 90px;">Frontdesk</th>
              <th style="width: 110px;">Assigned To</th>
              <th style="width: 65px; text-align: center;">DND</th>
              <th style="width: 80px; text-align: center;">Supervisor Sign</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <div class="summary-bar">
          <div>Printed from Hotel PMS Housekeeping Console</div>
          <div>Page 1 of 1</div>
        </div>

        <div class="signature-box">
          <div class="sig-line">Housekeeping Supervisor</div>
          <div class="sig-line">Duty Frontdesk Manager</div>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 350);
          };
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
}
