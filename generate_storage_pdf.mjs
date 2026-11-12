import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fs from 'fs';
import path from 'path';

async function createStorageArchitecturePdf() {
  const pdfDoc = await PDFDocument.create();
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontMono = await pdfDoc.embedFont(StandardFonts.Courier);

  const PAGE_WIDTH = 595.28; // A4
  const PAGE_HEIGHT = 841.89;
  const MARGIN_LEFT = 45;
  const MARGIN_RIGHT = 45;
  const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT;

  let currentPage = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = PAGE_HEIGHT - 50;

  function addNewPage() {
    currentPage = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    y = PAGE_HEIGHT - 50;
    drawPageHeader();
  }

  function drawPageHeader() {
    currentPage.drawRectangle({
      x: MARGIN_LEFT,
      y: PAGE_HEIGHT - 35,
      width: CONTENT_WIDTH,
      height: 1,
      color: rgb(0.2, 0.25, 0.3)
    });
    currentPage.drawText('BASE METRICS  |  Enterprise Multi-Sector Storage & Scaling Guide', {
      x: MARGIN_LEFT,
      y: PAGE_HEIGHT - 28,
      size: 8,
      font: fontBold,
      color: rgb(0.18, 0.63, 0.26)
    });
    currentPage.drawText('CONFIDENTIAL & PROPRIETARY', {
      x: PAGE_WIDTH - MARGIN_RIGHT - 130,
      y: PAGE_HEIGHT - 28,
      size: 8,
      font: fontRegular,
      color: rgb(0.55, 0.58, 0.62)
    });
  }

  function checkSpace(neededHeight) {
    if (y - neededHeight < 45) {
      drawPageFooter();
      addNewPage();
    }
  }

  function drawPageFooter() {
    currentPage.drawRectangle({
      x: MARGIN_LEFT,
      y: 35,
      width: CONTENT_WIDTH,
      height: 1,
      color: rgb(0.2, 0.25, 0.3)
    });
    currentPage.drawText('Support & Operations: murtalaabdulsamad142@gmail.com  •  Base Metrics Data Engine', {
      x: MARGIN_LEFT,
      y: 22,
      size: 8,
      font: fontRegular,
      color: rgb(0.55, 0.58, 0.62)
    });
    const pageNum = pdfDoc.getPageCount();
    currentPage.drawText(`Page ${pageNum}`, {
      x: PAGE_WIDTH - MARGIN_RIGHT - 35,
      y: 22,
      size: 8,
      font: fontBold,
      color: rgb(0.55, 0.58, 0.62)
    });
  }

  function addCoverBanner() {
    // Top Brand Card
    currentPage.drawRectangle({
      x: MARGIN_LEFT,
      y: y - 80,
      width: CONTENT_WIDTH,
      height: 80,
      color: rgb(0.08, 0.1, 0.13),
      borderColor: rgb(0.18, 0.63, 0.26),
      borderWidth: 1.5
    });

    currentPage.drawText('BASE METRICS', {
      x: MARGIN_LEFT + 20,
      y: y - 32,
      size: 22,
      font: fontBold,
      color: rgb(0.18, 0.63, 0.26)
    });

    currentPage.drawText('ENTERPRISE STORAGE ARCHITECTURE & SCALING BLUEPRINT', {
      x: MARGIN_LEFT + 20,
      y: y - 52,
      size: 11,
      font: fontBold,
      color: rgb(0.94, 0.96, 0.99)
    });

    currentPage.drawText('Comprehensive Multi-Sector Technical Guide: 5,000+ Users, Qualitative Audio, Photos & GPS', {
      x: MARGIN_LEFT + 20,
      y: y - 68,
      size: 8.5,
      font: fontRegular,
      color: rgb(0.55, 0.58, 0.62)
    });

    y -= 100;
  }

  function addSectionTitle(title) {
    checkSpace(35);
    currentPage.drawRectangle({
      x: MARGIN_LEFT,
      y: y - 20,
      width: CONTENT_WIDTH,
      height: 20,
      color: rgb(0.09, 0.11, 0.14)
    });
    currentPage.drawRectangle({
      x: MARGIN_LEFT,
      y: y - 20,
      width: 4,
      height: 20,
      color: rgb(0.18, 0.63, 0.26)
    });
    currentPage.drawText(title, {
      x: MARGIN_LEFT + 12,
      y: y - 14,
      size: 11,
      font: fontBold,
      color: rgb(0.94, 0.96, 0.99)
    });
    y -= 30;
  }

  function addParagraph(text, options = {}) {
    const size = options.size || 9;
    const font = options.font || fontRegular;
    const color = options.color || rgb(0.2, 0.22, 0.25);
    const lineHeight = size * 1.35;

    const words = text.split(' ');
    let line = '';

    for (const word of words) {
      const testLine = line + (line ? ' ' : '') + word;
      const testWidth = font.widthOfTextAtSize(testLine, size);

      if (testWidth > CONTENT_WIDTH) {
        checkSpace(lineHeight);
        currentPage.drawText(line, { x: MARGIN_LEFT, y, size, font, color });
        y -= lineHeight;
        line = word;
      } else {
        line = testLine;
      }
    }

    if (line) {
      checkSpace(lineHeight);
      currentPage.drawText(line, { x: MARGIN_LEFT, y, size, font, color });
      y -= lineHeight;
    }

    y -= options.spaceBelow || 6;
  }

  function addBullet(bulletTitle, bulletText) {
    const size = 9;
    const lineHeight = size * 1.35;
    const indent = 15;
    const textWidth = CONTENT_WIDTH - indent;

    checkSpace(lineHeight * 2);

    currentPage.drawText('•', {
      x: MARGIN_LEFT + 2,
      y,
      size: 12,
      font: fontBold,
      color: rgb(0.18, 0.63, 0.26)
    });

    const fullText = bulletTitle ? `${bulletTitle}: ${bulletText}` : bulletText;
    const words = fullText.split(' ');
    let line = '';
    let firstLine = true;

    for (const word of words) {
      const testLine = line + (line ? ' ' : '') + word;
      const testWidth = fontRegular.widthOfTextAtSize(testLine, size);

      if (testWidth > textWidth) {
        checkSpace(lineHeight);
        if (firstLine && bulletTitle) {
          // Draw bold title part
          const titleStr = `${bulletTitle}: `;
          const titleWidth = fontBold.widthOfTextAtSize(titleStr, size);
          currentPage.drawText(titleStr, { x: MARGIN_LEFT + indent, y, size, font: fontBold, color: rgb(0.1, 0.12, 0.15) });
          const remainingLine = line.substring(titleStr.length);
          currentPage.drawText(remainingLine, { x: MARGIN_LEFT + indent + titleWidth, y, size, font: fontRegular, color: rgb(0.2, 0.22, 0.25) });
          firstLine = false;
        } else {
          currentPage.drawText(line, { x: MARGIN_LEFT + indent, y, size, font: fontRegular, color: rgb(0.2, 0.22, 0.25) });
        }
        y -= lineHeight;
        line = word;
      } else {
        line = testLine;
      }
    }

    if (line) {
      checkSpace(lineHeight);
      if (firstLine && bulletTitle) {
        const titleStr = `${bulletTitle}: `;
        const titleWidth = fontBold.widthOfTextAtSize(titleStr, size);
        currentPage.drawText(titleStr, { x: MARGIN_LEFT + indent, y, size, font: fontBold, color: rgb(0.1, 0.12, 0.15) });
        const remainingLine = line.substring(titleStr.length);
        currentPage.drawText(remainingLine, { x: MARGIN_LEFT + indent + titleWidth, y, size, font: fontRegular, color: rgb(0.2, 0.22, 0.25) });
      } else {
        currentPage.drawText(line, { x: MARGIN_LEFT + indent, y, size, font: fontRegular, color: rgb(0.2, 0.22, 0.25) });
      }
      y -= lineHeight;
    }

    y -= 3;
  }

  function addTable(headers, rows, colWidths) {
    const rowHeight = 18;
    const tableHeight = (rows.length + 1) * rowHeight;
    checkSpace(tableHeight + 10);

    // Header background
    currentPage.drawRectangle({
      x: MARGIN_LEFT,
      y: y - rowHeight,
      width: CONTENT_WIDTH,
      height: rowHeight,
      color: rgb(0.12, 0.15, 0.18)
    });

    // Draw header text
    let curX = MARGIN_LEFT;
    headers.forEach((h, idx) => {
      currentPage.drawText(h, {
        x: curX + 6,
        y: y - 13,
        size: 8,
        font: fontBold,
        color: rgb(0.94, 0.96, 0.99)
      });
      curX += colWidths[idx];
    });

    y -= rowHeight;

    // Draw rows
    rows.forEach((row, rIdx) => {
      checkSpace(rowHeight);
      const isEven = rIdx % 2 === 0;
      if (isEven) {
        currentPage.drawRectangle({
          x: MARGIN_LEFT,
          y: y - rowHeight,
          width: CONTENT_WIDTH,
          height: rowHeight,
          color: rgb(0.96, 0.97, 0.98)
        });
      }

      curX = MARGIN_LEFT;
      row.forEach((cell, cIdx) => {
        currentPage.drawText(String(cell), {
          x: curX + 6,
          y: y - 13,
          size: 7.5,
          font: cIdx === 0 ? fontBold : fontRegular,
          color: rgb(0.15, 0.18, 0.22)
        });
        curX += colWidths[cIdx];
      });

      // Bottom row line
      currentPage.drawRectangle({
        x: MARGIN_LEFT,
        y: y - rowHeight,
        width: CONTENT_WIDTH,
        height: 0.5,
        color: rgb(0.85, 0.88, 0.9)
      });

      y -= rowHeight;
    });

    y -= 10;
  }

  // --- BEGIN CONTENT GENERATION ---

  addCoverBanner();

  addSectionTitle('1. EXECUTIVE SUMMARY & DUAL-TIER STORAGE ARCHITECTURE');
  addParagraph(
    'Base Metrics is engineered to handle rigorous, high-throughput field data collection across diverse sectors, including Education, Healthcare, Agriculture, WASH, and Humanitarian aid. To support 5,000+ active field users without performance bottlenecks or excessive costs, Base Metrics employs an industry-standard Dual-Tier Cloud Architecture:'
  );

  addBullet('Tier 1: Cloud Firestore (NoSQL Operational Database)', 'Houses all lightweight structured documents, questionnaire responses, student attendance, enumerator rosters, audit logs, and locked GPS coordinates. Firestore scales effortlessly to millions of documents with sub-second query latency.');
  addBullet('Tier 2: Google Cloud Storage (Media & Qualitative Object Storage)', 'Houses all binary media files, including high-resolution photographic evidence, voice recordings, and qualitative audio interviews. Only the lightweight HTTPS URL string (100 bytes) is written to Firestore.');

  addSectionTitle('2. THE 1 MB FIRESTORE DOCUMENT RULE & DATA SIZING');
  addParagraph(
    'A fundamental rule of Google Cloud Firestore is that every single document has a hard maximum size limit of 1 MB (1,048,576 bytes). Understanding this boundary is key to maintaining a high-performance system:'
  );

  const sizingHeaders = ['Data Category', 'Average Payload Size', 'Documents to Reach 1 MB', 'Firestore Capacity'];
  const sizingRows = [
    ['Structured Survey / Attendance', '1 KB - 4 KB', '250 - 1,000 surveys', 'Virtually Unlimited'],
    ['High-Precision GPS Lock', '80 - 120 Bytes', '10,000+ GPS points', 'Negligible footprint'],
    ['Compressed Verification Photo', '60 KB - 120 KB', '8 - 14 photos', 'Exceeds limit if stacked'],
    ['1-Minute Audio Voice Note', '500 KB - 1.2 MB', '1 - 2 files', 'Breaches 1 MB limit'],
    ['15-Minute Qualitative Interview', '5 MB - 15 MB', 'Direct breach', 'MUST use Cloud Storage']
  ];
  addTable(sizingHeaders, sizingRows, [160, 110, 125, 110]);

  addParagraph(
    'Key Architecture Rule: By decoupling binary files (photos and audio) from Firestore documents and hosting them in Cloud Storage, each Firestore survey document stays under 5 KB. This guarantees that 1-click CSV exports remain ultra-fast and Excel/SPSS never choke on oversized payloads.'
  );

  addSectionTitle('3. 5,000 USER CAPACITY CALCULATIONS & COST PROJECTIONS');
  addParagraph(
    'The following table outlines monthly storage, bandwidth, and cost estimates for a deployment of 5,000 active field workers submitting an average of 5 reports per day (25,000 records daily / 750,000 monthly):'
  );

  const scalingHeaders = ['Deployment Tier', 'Monthly Records', 'Firestore DB Size', 'Cloud Media Size', 'Estimated Cost'];
  const scalingRows = [
    ['Structured Text + GPS Only', '750,000 reports', '2.25 GB / month', '0 GB', '$0.40 - $2.50 / mo'],
    ['Text + GPS + 1 Photo/Audit', '750,000 reports', '2.25 GB / month', '60.0 GB / month', '$2.00 - $4.00 / mo'],
    ['Text + GPS + Photo + Audio', '750,000 reports', '2.25 GB / month', '250.0 GB / month', '$7.50 - $12.00 / mo']
  ];
  addTable(scalingHeaders, scalingRows, [140, 100, 100, 95, 70]);

  addBullet('Firestore Storage Cost', 'Google Cloud charges $0.18 per GB per month for Firestore database storage.');
  addBullet('Cloud Storage Cost', 'Google Cloud Storage standard tier costs only $0.026 per GB per month (over 85% cheaper than database storage). Storing 100 GB of field photos costs less than $2.60 per month.');
  addBullet('Network Bandwidth', 'Client-side compression ensures field personnel consume minimal mobile data bundles (less than 150 KB per full report with photo and GPS).');

  addSectionTitle('4. QUALITATIVE DATA COLLECTION & AUDIO INTERVIEWS');
  addParagraph(
    'Qualitative data collection often requires rich, verbatim open-ended responses from community elders, clinic head nurses, or beneficiary focus groups. Base Metrics is prepared to support audio data collection through the following pipeline:'
  );

  addBullet('Browser MediaRecorder API', 'Captures crystal-clear voice notes directly from mobile browsers or PWA without requiring external third-party apps.');
  addBullet('Modern Codec Compression', 'Audio is encoded using Opus / AAC (16 kHz, mono), producing high-clarity voice recordings at a compact ~8 KB/sec (only ~500 KB per minute).');
  addBullet('Automatic Speech-to-Text Transcription', 'Audio recordings can be fed directly to the Gemini API or Whisper transcription backend. The resulting text transcript is stored in Firestore, enabling instant keyword search, sentiment tagging, and full thematic qualitative analysis.');
  addBullet('Qualitative Text Fields', 'For typed qualitative responses (e.g. detailed case notes, beneficiary testimonials), Firestore string fields support up to 500,000 characters per field without any external storage needed.');

  addSectionTitle('5. PHOTOGRAPHIC AUDIT & GPS TAMPER-PROOFING');
  addParagraph(
    'For field verification, physical evidence is vital to ensure enumerators are legitimately on-site:'
  );

  addBullet('Client-Side Image Canvas Compression', 'PhotoCapture automatically resizes mobile camera uploads to a maximum 960px dimension at 72% JPEG quality. This reduces an 8 MB raw camera snapshot down to 70 KB in milliseconds before transmission.');
  addBullet('Programmatic GPS Locking', 'High-accuracy GPS coordinates (latitude, longitude, horizontal accuracy radius in meters) are locked programmatically via the HTML5 Geolocation API at the moment of submission.');
  addBullet('Anti-Spoofing Protocol', 'GPS timestamps are cross-referenced with server-generated Firestore request timestamps, preventing device clock tampering.');

  addSectionTitle('6. OFFLINE OUTBOX & DEVICE LOCAL STORAGE (RURAL OPERATION)');
  addParagraph(
    'In remote communities where cellular connectivity is nonexistent, Base Metrics provides complete offline operational reliability:'
  );

  addBullet('Offline Storage Hierarchy', 'Modern mobile browsers provide 5 MB - 10 MB in localStorage and 50 MB - 2 GB in IndexedDB (up to 20% of device storage).');
  addBullet('Offline Capacity Per Phone', 'A single facilitator smartphone can store over 10,000 structured text reports, or 50 to 100 complete reports with compressed photos, completely offline.');
  addBullet('Automatic Queue Flushing (Outbox Sync)', 'The built-in service worker and offline sync manager monitor network events. As soon as the enumerator returns to a network zone, the app automatically flushes the outbox queue in batches without any manual intervention.');

  addSectionTitle('7. ENTERPRISE DATA GOVERNANCE & SECURITY');
  addParagraph(
    'All multi-sector data collected through Base Metrics is protected by enterprise-grade controls:'
  );

  addBullet('End-to-End Encryption', 'Enforced TLS 1.3 encryption in transit and AES-256 cloud encryption at rest on Google Cloud.');
  addBullet('Role-Based Access Control (RBAC)', 'Strict server-side Firestore security rules partition data between Facilitators, Supervisors, B1 Collectors, and Administrators.');
  addBullet('One-Time Access Codes & Master Gate', 'Every field user requires an approved one-time activation code. Admin command center features are secured behind master gate verification.');
  addBullet('Google API Limited Use & GDPR Compliance', 'Strict compliance with Google API Services User Data Policy: zero advertising, zero third-party data broker sharing, and guaranteed data deletion requests within 48 business hours.');

  // Finish last footer
  drawPageFooter();

  const pdfBytes = await pdfDoc.save();
  const outputPath = path.join(process.cwd(), 'public', 'Base_Metrics_Storage_Architecture_And_Scaling_Specification.pdf');
  fs.writeFileSync(outputPath, pdfBytes);
  console.log(`SUCCESS: PDF written to ${outputPath} (${(pdfBytes.length / 1024).toFixed(1)} KB)`);
}

createStorageArchitecturePdf().catch(err => {
  console.error('Error generating PDF:', err);
  process.exit(1);
});
