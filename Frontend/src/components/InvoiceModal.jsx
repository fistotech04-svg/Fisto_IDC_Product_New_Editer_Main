import React, { useRef, useState, useEffect } from 'react';
import { X, Download, Share2, Check, Phone, Mail, Globe } from 'lucide-react';
import { Icon } from '@iconify/react';
import { jsPDF } from 'jspdf';
import FlipibookLogo from '../assets/logo/Flipibook_logo.svg';

const InvoiceModal = ({ isOpen, onClose, defaultPlan = 'standard', isAnnual = false }) => {
  const invoiceRef = useRef(null);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // Dynamic user details
  const [userData, setUserData] = useState({
    name: 'Valued Client',
    title: 'Customer / Business Lead',
    companyName: 'Client Enterprise',
    phone: '+1 234 567 8910',
    email: 'client@example.com',
    address: 'Global Corporate Office, Suite 400',
    accountNo: '8849 5678 9102'
  });

  const [selectedPlanKey, setSelectedPlanKey] = useState(defaultPlan);

  useEffect(() => {
    setSelectedPlanKey(defaultPlan);
  }, [defaultPlan]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('user_profile') || localStorage.getItem('user');
      if (stored) {
        const u = JSON.parse(stored);
        const name = u.name || u.fullName || u.username || (u.emailId || u.email ? (u.emailId || u.email).split('@')[0] : 'Valued Customer');
        const email = u.emailId || u.email || 'customer@flipibook.com';
        const phone = u.phone || u.phoneNumber || u.mobile || '+1 (555) 019-2834';
        const company = u.company || u.companyName || u.organization || 'Flipibook Subscriber';
        const designation = u.designation || u.role || u.title || 'Managing Director';
        const address = u.address || u.location || u.city ? `${u.location || u.city || 'Tech Hub'}, United States` : 'Tech Valley Blvd, Suite 210';
        
        // Generate pseudo account number based on user email or random hash
        let hash = 1234567890;
        if (email) {
          hash = Math.abs(email.split('').reduce((acc, char) => (acc << 5) - acc + char.charCodeAt(0), 0));
        }
        const accNumber = String(hash).padEnd(10, '7').slice(0, 10);
        const formattedAcc = `${accNumber.slice(0, 4)} ${accNumber.slice(4, 8)} ${accNumber.slice(8)}`;

        setUserData({
          name: name,
          title: designation,
          companyName: company,
          phone: phone,
          email: email,
          address: address,
          accountNo: formattedAcc
        });
      }
    } catch (e) {
      console.error('Failed to load user profile in InvoiceModal:', e);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Dynamic plan catalogs matching the exact invoice layout
  const plans = {
    free: {
      name: 'Free Starter Plan',
      planCode: 'FREE',
      planBadgeName: 'Free Starter Plan',
      duration: '1 Month',
      users: '1 Account',
      billingCycle: 'Monthly',
      validityPeriod: '12 Oct 2026 – 11 Nov 2026',
      invoiceNo: 'INV-2026-001',
      date: '10 Oct 2026',
      dueDate: '17 Oct 2026',
      currency: '₹',
      clientGreeting: 'Dear Client,',
      clientMessage: 'Thank you for choosing FLIPBOOK. We appreciate your trust in our services and look forward to delivering quality solutions for your business.',
      billedBy: {
        company: 'Flipibook Technologies Pvt. Ltd.',
        addressLine1: 'No. 24, Tech Park Road,',
        addressLine2: 'Coimbatore,Tamil Nadu –',
        addressLine3: '641004, India',
        gstNo: '33ABCD1234F1Z5'
      },
      billTo: {
        name: 'Arun Kumar',
        company: 'ABC Digital Solutions12,',
        addressLine1: 'Anna Nagar, Chennai,Tamil',
        addressLine2: 'Nadu – 600040, India',
        gstNo: '33AACECA1234A1Z5'
      },
      items: [
        {
          title: 'Starter Subscription (Monthly)',
          subtitle: 'Monthly access – 1 account',
          sac: 'SAC: 998314 (Online Information Services)',
          unitPrice: 1500,
          qty: 1
        }
      ],
      subtotal: 1500,
      discount: 0,
      taxableAmount: 1500,
      cgstRate: 0.09,
      sgstRate: 0.09,
      cgstAmount: 135,
      sgstAmount: 135,
      grandTotal: 1770,
      balanceDue: 0,
      helpline: '+91 98765 43210',
      email: 'your@gmail.com'
    },
    standard: {
      name: 'Standard Pro Plan',
      planCode: 'STD',
      planBadgeName: 'Standard Plan – Annual',
      duration: '12 Months',
      users: '1 Account',
      billingCycle: 'Yearly',
      validityPeriod: '12 Oct 2026 – 11 Oct 2027',
      invoiceNo: 'INV-2026-001',
      date: '10 Oct 2026',
      dueDate: '17 Oct 2026',
      currency: '₹',
      clientGreeting: 'Dear Client,',
      clientMessage: 'Thank you for choosing FLIPBOOK. We appreciate your trust in our services and look forward to delivering quality solutions for your business.',
      billedBy: {
        company: 'Flipibook Technologies Pvt. Ltd.',
        addressLine1: 'No. 24, Tech Park Road,',
        addressLine2: 'Coimbatore,Tamil Nadu –',
        addressLine3: '641004, India',
        gstNo: '33ABCD1234F1Z5'
      },
      billTo: {
        name: 'Arun Kumar',
        company: 'ABC Digital Solutions12,',
        addressLine1: 'Anna Nagar, Chennai,Tamil',
        addressLine2: 'Nadu – 600040, India',
        gstNo: '33AACECA1234A1Z5'
      },
      items: [
        {
          title: 'Standard Subscription (Annual)',
          subtitle: 'Annual access – 1 account',
          sac: 'SAC: 998314 (Online Information Services)',
          unitPrice: 3500,
          qty: 1
        }
      ],
      subtotal: 3500,
      discount: 350,
      taxableAmount: 3150,
      cgstRate: 0.09,
      sgstRate: 0.09,
      cgstAmount: 283.5,
      sgstAmount: 283.5,
      grandTotal: 3717,
      balanceDue: 0,
      helpline: '+91 98765 43210',
      email: 'your@gmail.com'
    },
    premium: {
      name: 'Premium Plan – Annual',
      planCode: 'PREM',
      planBadgeName: 'Premium Plan – Annual',
      duration: '12 Months',
      users: '1 Account',
      billingCycle: 'Yearly',
      validityPeriod: '12 Oct 2026 – 11 Oct 2027',
      invoiceNo: 'INV-2026-001',
      date: '10 Oct 2026',
      dueDate: '17 Oct 2026',
      currency: '₹',
      clientGreeting: 'Dear Client,',
      clientMessage: 'Thank you for choosing FLIPBOOK. We appreciate your trust in our services and look forward to delivering quality solutions for your business.',
      billedBy: {
        company: 'Flipibook Technologies Pvt. Ltd.',
        addressLine1: 'No. 24, Tech Park Road,',
        addressLine2: 'Coimbatore,Tamil Nadu –',
        addressLine3: '641004, India',
        gstNo: '33ABCD1234F1Z5'
      },
      billTo: {
        name: 'Arun Kumar',
        company: 'ABC Digital Solutions12,',
        addressLine1: 'Anna Nagar, Chennai,Tamil',
        addressLine2: 'Nadu – 600040, India',
        gstNo: '33AACECA1234A1Z5'
      },
      items: [
        {
          title: 'Premium Subscription (Annual)',
          subtitle: 'Annual access – 1 account',
          sac: 'SAC: 998314 (Online Information Services)',
          unitPrice: 6000,
          qty: 1
        }
      ],
      subtotal: 6000,
      discount: 600,
      taxableAmount: 5400,
      cgstRate: 0.09,
      sgstRate: 0.09,
      cgstAmount: 486,
      sgstAmount: 486,
      grandTotal: 6372,
      balanceDue: 0,
      helpline: '+91 98765 43210',
      email: 'your@gmail.com'
    }
  };

  const activePlan = plans[selectedPlanKey] || plans.free;

  // Format currency with Indian / standard commas
  const formatMoney = (amount) => {
    return Number(amount).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const invoiceNumber = activePlan.invoiceNo;

  // Download PDF - Direct Vector & Native Text Generation (NO HTML2CANVAS)
  // Text in the generated PDF is 100% native vector text, directly selectable and copyable as code/text.
  const handleDownloadPdf = async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'pt',
        format: 'a4' // 595.28 x 841.89 pt
      });

      const pageWidth = 595.28;
      const margin = 45;
      const contentWidth = pageWidth - margin * 2; // 505.28 pt

      // Helper: draw Flipibook brand logo using canvas rasterizer from the SVG image
      let logoDrawn = false;
      try {
        const imgEl = invoiceRef.current?.querySelector('img');
        if (imgEl && imgEl.complete && imgEl.naturalWidth > 0) {
          const logoCanvas = document.createElement('canvas');
          logoCanvas.width = imgEl.naturalWidth * 2;
          logoCanvas.height = imgEl.naturalHeight * 2;
          const ctx = logoCanvas.getContext('2d');
          ctx.drawImage(imgEl, 0, 0, logoCanvas.width, logoCanvas.height);
          const logoDataUrl = logoCanvas.toDataURL('image/png');
          const logoWidth = 140;
          const logoHeight = (imgEl.naturalHeight / imgEl.naturalWidth) * logoWidth;
          pdf.addImage(logoDataUrl, 'PNG', margin, 42, logoWidth, logoHeight);
          logoDrawn = true;
        }
      } catch (e) {
        console.warn('Logo raster fallback:', e);
      }

      if (!logoDrawn) {
        // Fallback pure vector Flipibook badge
        pdf.setFillColor(236, 81, 55);
        pdf.roundedRect(margin, 45, 110, 26, 3, 3, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(13);
        pdf.text('FLIPIBOOK', margin + 14, 62);
      }

      // Title: INVOICE (Top Right)
      pdf.setTextColor(10, 10, 10);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(28);
      // Letter-spaced title
      pdf.text('I N V O I C E', pageWidth - margin, 65, { align: 'right' });

      // Row 2: Greeting (Left) & Metadata with Orange Line (Right)
      const row2Y = 110;

      // Left: Dear Client greeting & message
      pdf.setTextColor(229, 67, 43); // #e5432b
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10.5);
      pdf.text(activePlan.clientGreeting, margin, row2Y);

      pdf.setTextColor(75, 85, 99);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      const splitMsg = pdf.splitTextToSize(activePlan.clientMessage, 240);
      pdf.text(splitMsg, margin, row2Y + 14);

      // Right: Invoice No, Invoice Date, Due Date with exact colon alignment
      const metaBoxWidth = 175;
      const metaRight = pageWidth - margin;
      const metaLeft = metaRight - metaBoxWidth;
      const colonX = metaLeft + 68;

      const metaLines = [
        { label: 'Invoice No', val: activePlan.invoiceNo, bold: true },
        { label: 'Invoice Date', val: activePlan.date, bold: false },
        { label: 'Due Date', val: activePlan.dueDate, bold: false }
      ];

      metaLines.forEach((m, idx) => {
        const y = row2Y + 12 + idx * 14;
        pdf.setTextColor(75, 85, 99);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);
        pdf.text(m.label, metaLeft, y);
        pdf.text(':', colonX, y, { align: 'center' });

        pdf.setFont('helvetica', m.bold ? 'bold' : 'normal');
        pdf.setTextColor(17, 24, 39);
        pdf.text(m.val, metaRight, y, { align: 'right' });
      });

      // Orange line under invoice metadata
      pdf.setDrawColor(229, 67, 43);
      pdf.setLineWidth(1.5);
      pdf.line(metaLeft, row2Y + 54, metaRight, row2Y + 54);

      // Row 3: Billed By (Left Box) & Bill To (Right Box)
      const boxY = row2Y + 70;
      const boxW = (contentWidth - 16) / 2;
      const boxH = 92;

      // Left: Billed By Box
      pdf.setFillColor(250, 251, 252);
      pdf.setDrawColor(241, 242, 244);
      pdf.setLineWidth(0.8);
      pdf.roundedRect(margin, boxY, boxW, boxH, 3, 3, 'FD');

      pdf.setTextColor(229, 67, 43);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      pdf.text('Billed By', margin + 12, boxY + 16);

      pdf.setTextColor(31, 41, 55);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9);
      pdf.text(activePlan.billedBy.company, margin + 12, boxY + 30);

      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(75, 85, 99);
      pdf.text(activePlan.billedBy.addressLine1, margin + 12, boxY + 43);
      pdf.text(activePlan.billedBy.addressLine2, margin + 12, boxY + 55);
      pdf.text(activePlan.billedBy.addressLine3, margin + 12, boxY + 67);
      pdf.text(`GST No  :  ${activePlan.billedBy.gstNo}`, margin + 12, boxY + 81);

      // Right: Bill To Box
      const rightBoxX = margin + boxW + 16;
      pdf.setFillColor(250, 251, 252);
      pdf.setDrawColor(241, 242, 244);
      pdf.roundedRect(rightBoxX, boxY, boxW, boxH, 3, 3, 'FD');

      pdf.setTextColor(229, 67, 43);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      pdf.text('Bill to', rightBoxX + 12, boxY + 16);

      pdf.setTextColor(31, 41, 55);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9);
      pdf.text(activePlan.billTo.name, rightBoxX + 12, boxY + 30);

      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(75, 85, 99);
      pdf.text(activePlan.billTo.company, rightBoxX + 12, boxY + 43);
      pdf.text(activePlan.billTo.addressLine1, rightBoxX + 12, boxY + 55);
      pdf.text(activePlan.billTo.addressLine2, rightBoxX + 12, boxY + 67);
      pdf.text(`GST No  :  ${activePlan.billTo.gstNo}`, rightBoxX + 12, boxY + 81);

      // Row 4: Plan Banner Strip with Crown, Duration, Users, Billing Cycle
      const bannerY = boxY + boxH + 14;
      const bannerH = 38;

      pdf.setFillColor(253, 242, 240); // Soft rose peach background
      pdf.roundedRect(margin, bannerY, contentWidth, bannerH, 4, 4, 'F');

      // Orange Crown Icon Square (crisp 3-pointed crown)
      const crownBx = margin + 8;
      const crownBy = bannerY + 6;
      pdf.setFillColor(229, 67, 43);
      pdf.roundedRect(crownBx, crownBy, 26, 26, 3, 3, 'F');
      
      // Draw white crown peaks
      pdf.setFillColor(255, 255, 255);
      pdf.triangle(crownBx + 6, crownBy + 17, crownBx + 6, crownBy + 10, crownBx + 10, crownBy + 14, 'F');
      pdf.triangle(crownBx + 10, crownBy + 17, crownBx + 13, crownBy + 8, crownBx + 16, crownBy + 17, 'F');
      pdf.triangle(crownBx + 16, crownBy + 14, crownBx + 20, crownBy + 10, crownBx + 20, crownBy + 17, 'F');
      pdf.rect(crownBx + 6, crownBy + 17, 14, 2, 'F');

      // Plan Name & Validity
      pdf.setTextColor(17, 24, 39);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9.5);
      pdf.text(activePlan.planBadgeName, margin + 40, bannerY + 17);
      pdf.setTextColor(107, 114, 128);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.text(activePlan.validityPeriod, margin + 40, bannerY + 28);

      // Vertical dividers and chips
      const div1X = margin + 215;
      const div2X = margin + 305;
      const div3X = margin + 395;

      pdf.setDrawColor(220, 225, 232);
      pdf.setLineWidth(0.8);
      pdf.line(div1X, bannerY + 8, div1X, bannerY + 30);
      pdf.line(div2X, bannerY + 8, div2X, bannerY + 30);
      pdf.line(div3X, bannerY + 8, div3X, bannerY + 30);

      // Duration (calendar icon outline)
      pdf.setDrawColor(55, 65, 81);
      pdf.setLineWidth(0.65);
      pdf.roundedRect(div1X + 10, bannerY + 13, 10, 10, 1.2, 1.2, 'S');
      pdf.line(div1X + 10, bannerY + 16, div1X + 20, bannerY + 16);
      pdf.setTextColor(107, 114, 128);
      pdf.setFontSize(7.5);
      pdf.text('Duration', div1X + 24, bannerY + 16);
      pdf.setTextColor(17, 24, 39);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8.5);
      pdf.text(activePlan.duration, div1X + 24, bannerY + 27);

      // Users (user silhouette outline)
      pdf.setDrawColor(55, 65, 81);
      pdf.circle(div2X + 15, bannerY + 15.5, 2.5, 'S');
      pdf.line(div2X + 11.5, bannerY + 23, div2X + 18.5, bannerY + 23);
      pdf.setTextColor(107, 114, 128);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7.5);
      pdf.text('Users', div2X + 24, bannerY + 16);
      pdf.setTextColor(17, 24, 39);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8.5);
      pdf.text(activePlan.users, div2X + 24, bannerY + 27);

      // Billing Cycle (receipt document outline)
      pdf.setDrawColor(55, 65, 81);
      pdf.roundedRect(div3X + 11, bannerY + 13, 8.5, 11, 1, 1, 'S');
      pdf.line(div3X + 13, bannerY + 16, div3X + 17, bannerY + 16);
      pdf.line(div3X + 13, bannerY + 19, div3X + 17, bannerY + 19);
      pdf.setTextColor(107, 114, 128);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7.5);
      pdf.text('Billing Cycle', div3X + 24, bannerY + 16);
      pdf.setTextColor(17, 24, 39);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8.5);
      pdf.text(activePlan.billingCycle, div3X + 24, bannerY + 27);

      // Row 5: THE TABLE (With angled two-color header)
      const tableTopY = bannerY + bannerH + 18;
      const tableHeaderHeight = 26;

      const orangeW = 265;
      const slantW = 12;
      const darkStart = margin + orangeW;
      const darkW = contentWidth - orangeW;

      // 1. Unified seamless Orange polygon
      pdf.setFillColor(229, 67, 43); // #e5432b
      pdf.lines(
        [
          [orangeW + slantW, 0],
          [-slantW, tableHeaderHeight],
          [-orangeW, 0],
          [0, -tableHeaderHeight]
        ],
        margin,
        tableTopY,
        [1, 1],
        'F',
        true
      );

      // 2. Unified seamless Charcoal polygon
      pdf.setFillColor(43, 46, 53); // #2b2e35
      pdf.lines(
        [
          [darkW - slantW, 0],
          [0, tableHeaderHeight],
          [-(darkW), 0],
          [slantW, -tableHeaderHeight]
        ],
        darkStart + slantW,
        tableTopY,
        [1, 1],
        'F',
        true
      );

      // Column text positions
      const colDescX = margin + 14;
      const colPriceX = margin + 355;
      const colQtyX = margin + 418;
      const colTotalX = pageWidth - margin - 14;

      // Header Labels (Selectable Vector Text)
      pdf.setTextColor(255, 255, 255);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9.5);
      pdf.text('Description', colDescX, tableTopY + 17);
      pdf.text('Unit Price', colPriceX, tableTopY + 17, { align: 'right' });
      pdf.text('Qty', colQtyX, tableTopY + 17, { align: 'center' });
      pdf.text('Total', colTotalX, tableTopY + 17, { align: 'right' });

      // Table Rows with Title, Subtitle, SAC code
      let currentY = tableTopY + tableHeaderHeight;

      activePlan.items.forEach((item) => {
        const rowHeight = 44;

        // Line item title, subtitle, SAC code
        pdf.setTextColor(17, 24, 39);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(9.5);
        pdf.text(item.title, colDescX, currentY + 15);

        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(107, 114, 128);
        pdf.setFontSize(8);
        pdf.text(item.subtitle, colDescX, currentY + 27);
        pdf.text(item.sac, colDescX, currentY + 37);

        // Price, Qty, Total
        pdf.setTextColor(17, 24, 39);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9.5);
        pdf.text(`Rs. ${formatMoney(item.unitPrice)}`, colPriceX, currentY + 22, { align: 'right' });
        pdf.text(String(item.qty), colQtyX, currentY + 22, { align: 'center' });
        pdf.text(`Rs. ${formatMoney(item.unitPrice * item.qty)}`, colTotalX, currentY + 22, { align: 'right' });

        // Row border bottom
        pdf.setDrawColor(241, 242, 244);
        pdf.setLineWidth(0.8);
        pdf.line(margin, currentY + rowHeight, pageWidth - margin, currentY + rowHeight);

        currentY += rowHeight;
      });

      // Row 6: Two-column Bottom Section (Left: Helpline + Terms pushed down, Right: Totals breakdown + Signature)
      const totalsY = currentY + 18;

      // Right: Detailed Totals Breakdown (Subtotal, Discount, Taxable Amount, CGST, SGST)
      const totBoxWidth = 205;
      const totRight = pageWidth - margin;
      const totLeft = totRight - totBoxWidth;
      const totColonX = totLeft + 86;

      const breakdownRows = [
        { label: 'Subtotal', val: `Rs. ${formatMoney(activePlan.subtotal)}`, isGreen: false, isNeg: false },
        { label: 'Discount', val: `-Rs. ${formatMoney(activePlan.discount)}`, isGreen: true, isNeg: true },
        { label: 'Taxable Amount', val: `Rs. ${formatMoney(activePlan.taxableAmount)}`, isGreen: false, isNeg: false },
        { label: 'CGST (9%)', val: `Rs. ${formatMoney(activePlan.cgstAmount)}`, isGreen: false, isNeg: false },
        { label: 'SGST (9%)', val: `Rs. ${formatMoney(activePlan.sgstAmount)}`, isGreen: false, isNeg: false }
      ];

      breakdownRows.forEach((r, idx) => {
        const y = totalsY + idx * 15;
        pdf.setTextColor(r.isGreen ? 22 : 75, r.isGreen ? 163 : 85, r.isGreen ? 74 : 99);
        pdf.setFont('helvetica', r.isGreen ? 'bold' : 'normal');
        pdf.setFontSize(9);
        pdf.text(r.label, totLeft, y);
        pdf.text(':', totColonX, y, { align: 'center' });
        pdf.text(r.val, totRight, y, { align: 'right' });
      });

      // Solid Orange Grand Total Bar
      const grandTotalBarY = totalsY + 5 * 15 + 4;
      const grandTotalBarHeight = 26;

      pdf.setFillColor(229, 67, 43); // #e5432b
      pdf.roundedRect(totLeft, grandTotalBarY, totBoxWidth, grandTotalBarHeight, 2, 2, 'F');

      pdf.setTextColor(255, 255, 255);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9.5);
      pdf.text('Grand Total', totLeft + 12, grandTotalBarY + 17);
      pdf.text(':', totColonX, grandTotalBarY + 17, { align: 'center' });
      pdf.setFontSize(10.5);
      pdf.text(`Rs. ${formatMoney(activePlan.grandTotal)}`, totRight - 10, grandTotalBarY + 17, { align: 'right' });

      // Balance Due
      const balY = grandTotalBarY + grandTotalBarHeight + 14;
      pdf.setTextColor(75, 85, 99);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.text('Balance Due', totLeft, balY);
      pdf.text(':', totColonX, balY, { align: 'center' });
      pdf.setTextColor(17, 24, 39);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`Rs. ${formatMoney(activePlan.balanceDue)}`, totRight, balY, { align: 'right' });

      // Left: Thanks for your business & Contact Details (Pushed down to leave empty space above matching UI)
      const contactStartY = grandTotalBarY - 14;

      pdf.setTextColor(229, 67, 43);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10.5);
      pdf.text('Thanks for your business', margin, contactStartY);

      // Helpline & Email
      const contactItems = [
        { type: 'phone', label: 'Helpline', val: activePlan.helpline },
        { type: 'email', label: 'Email', val: activePlan.email }
      ];

      contactItems.forEach((c, idx) => {
        const cY = contactStartY + 15 + idx * 15;
        const iconX = margin;
        const iconY = cY - 7;

        pdf.setDrawColor(75, 85, 99);
        pdf.setLineWidth(0.7);

        if (c.type === 'phone') {
          pdf.roundedRect(iconX, iconY, 7, 10, 1.5, 1.5, 'S');
          pdf.line(iconX + 2, iconY + 2, iconX + 5, iconY + 2);
          pdf.line(iconX + 3, iconY + 8, iconX + 4, iconY + 8);
        } else if (c.type === 'email') {
          pdf.roundedRect(iconX, iconY + 1.5, 9, 7, 0.8, 0.8, 'S');
          pdf.line(iconX, iconY + 1.5, iconX + 4.5, iconY + 5.5);
          pdf.line(iconX + 9, iconY + 1.5, iconX + 4.5, iconY + 5.5);
        }

        const labelStartX = margin + 14;
        pdf.setTextColor(75, 85, 99);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);
        pdf.text(c.label, labelStartX, cY);
        pdf.text(':', labelStartX + 46, cY);
        pdf.setTextColor(17, 24, 39);
        pdf.setFont('helvetica', 'bold');
        pdf.text(c.val, labelStartX + 56, cY);
      });

      // Bottom Row: Terms & Conditions (Left) & Real Handwritten Signature (Right)
      const bottomY = balY + 42;

      // Handwritten vector signature on Right directly beneath Balance Due
      const sigX = pageWidth - margin - 85;
      const sigY = bottomY - 6;
      pdf.setDrawColor(17, 24, 39);
      pdf.setLineWidth(1.4);
      pdf.lines(
        [
          [7, -12], [6, 10], [5, -16], [6, 12],
          [7, -8], [7, 8], [9, -12], [8, 14], [8, -10], [6, 6]
        ],
        sigX,
        sigY
      );
      pdf.lines([[70, -18]], sigX + 10, sigY + 5);

      // Account Manager underline
      pdf.setTextColor(17, 24, 39);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9.5);
      pdf.text('Account Manager', sigX + 38, bottomY + 18, { align: 'center' });
      pdf.setDrawColor(17, 24, 39);
      pdf.setLineWidth(0.8);
      pdf.line(sigX - 6, bottomY + 21, sigX + 82, bottomY + 21);

      // Terms & Conditions on Left
      pdf.setTextColor(229, 67, 43);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9.5);
      pdf.text('Terms & Conditions', margin, bottomY - 6);

      pdf.setTextColor(107, 114, 128);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      const termsText = 'Payment is due by the specified date. Additional revisions may incur extra charges. Deliverables are provided upon payment confirmation.';
      const splitTerms = pdf.splitTextToSize(termsText, 250);
      pdf.text(splitTerms, margin, bottomY + 6);

      // Row 8: Smooth Bezier curved bottom footer (Identical math to user SVG viewBox="0 0 595 39")
      const pageHeight = 841.89;
      const footerH = 39;
      const footerY = pageHeight - footerH; // 802.89 pt

      // 1. Red-Orange smooth Bezier wave: #EC5137
      // Matches: M6 55V33.96 C6.59 34.18 33.18 35.81 45.88 36.41 C98.86 38.77 162.86 36.79 178.93 36.41 C329 42.5 546.5 -13 595.5 4.5 L601 55 H6Z
      pdf.setFillColor(236, 81, 55);
      pdf.moveTo(0, pageHeight);
      pdf.lineTo(0, footerY + 33.962);
      pdf.curveTo(6.595, footerY + 34.181, 33.185, footerY + 35.818, 45.885, footerY + 36.415);
      pdf.curveTo(98.866, footerY + 38.774, 162.861, footerY + 36.792, 178.934, footerY + 36.415);
      pdf.curveTo(329, footerY + 42.5, 546.5, footerY - 13.0, 595.5, footerY + 4.5);
      pdf.lineTo(pageWidth + 5, pageHeight);
      pdf.lineTo(0, pageHeight);
      pdf.close();
      pdf.fill();

      // 2. Black smooth curved wedge on left: #000000
      // Matches: M0 0L0 55H342L371 38C269 45.5 42 20 0 0Z
      pdf.setFillColor(0, 0, 0);
      pdf.moveTo(0, footerY);
      pdf.lineTo(0, pageHeight);
      pdf.lineTo(342, pageHeight);
      pdf.lineTo(371, footerY + 38);
      pdf.curveTo(269, footerY + 45.5, 42, footerY + 20, 0, footerY);
      pdf.close();
      pdf.fill();

      // Footer website link: crisp selectable text placed over the red-orange curve
      pdf.setTextColor(255, 255, 255);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8.5);
      pdf.text('www.flipibook.com', 515, footerY + 23, { align: 'center' });

      // Save PDF
      pdf.save(`Flipibook_Invoice_${invoiceNumber}.pdf`);
    } catch (err) {
      console.error('Invoice PDF download error:', err);
      alert('Failed to download invoice: ' + (err.message || 'Unknown error'));
    } finally {
      setDownloading(false);
    }
  };

  // Share
  const handleShare = async () => {
    const shareData = {
      title: `Flipibook Invoice - ${invoiceNumber}`,
      text: `Flipibook Invoice for ${activePlan.clientInfo.name} (${activePlan.name}) - Total: ₹${formatMoney(activePlan.grandTotalDisplay)}`,
      url: window.location.href
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        if (err.name !== 'AbortError') {
          copyToClipboard();
        }
      }
    } else {
      copyToClipboard();
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 md:p-6 print:p-0 print:bg-white animate-in fade-in duration-200">
      
      {/* Container Card */}
      <div className="relative w-full max-w-4xl bg-slate-100 rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden flex flex-col h-[94vh] max-h-[980px] print:h-auto print:max-h-none print:shadow-none print:border-none print:rounded-none">
        
        {/* Top Header Control Bar */}
        <div className="bg-[#1e2430] text-white px-5 sm:px-6 py-3 flex items-center justify-between shrink-0 print:hidden border-b border-slate-700/80">
          
          {/* Left: Invoice Title & Badge */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#e5432b] flex items-center justify-center text-white shadow-sm shrink-0 font-bold text-xs">
              FB
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-white tracking-wide">
                Flipibook Invoice Preview
              </span>
              <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-[#e5432b]/20 text-[#e5432b] border border-[#e5432b]/30">
                {activePlan.name}
              </span>
            </div>
          </div>

          {/* Right: Actions (Download, Share, Close) */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            <button
              onClick={handleDownloadPdf}
              disabled={downloading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#e5432b] hover:bg-[#c9321c] text-white text-xs font-semibold rounded-lg shadow-sm hover:shadow transition-all cursor-pointer disabled:opacity-50"
              title="Download PDF"
            >
              {downloading ? (
                <Icon icon="line-md:loading-loop" className="w-3.5 h-3.5" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span className="hidden sm:inline">Download PDF</span>
            </button>

            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition-all cursor-pointer"
              title="Share Invoice Link"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Share2 className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{copied ? 'Copied!' : 'Share'}</span>
            </button>

            <div className="h-5 w-[1px] bg-slate-700 mx-0.5"></div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Close invoice"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Document Wrapper - Only this scrolls */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 flex justify-center bg-slate-200/70 print:p-0 print:bg-white print:overflow-visible">
          
          {/* ------------------------------------------------------------- */}
          {/* THE PRINTABLE / CAPTURABLE INVOICE SHEET (Pixel-perfect replicate) */}
          {/* ------------------------------------------------------------- */}
          <div
            ref={invoiceRef}
            data-invoice-sheet="true"
            className="w-full max-w-[794px] bg-white text-slate-900 shadow-xl border border-slate-200/90 relative flex flex-col justify-between print:shadow-none print:border-none print:max-w-none box-border overflow-hidden"
            style={{
              fontFamily: "'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif",
              minHeight: '1120px',
              padding: '48px 48px 0 48px'
            }}
          >
            <div className="pb-12">
              {/* Row 1: Brand Logo (Left) and INVOICE Title (Right) */}
              <div className="flex items-start justify-between">
                <div className="inline-block">
                  <img
                    src={FlipibookLogo}
                    alt="Flipibook Logo"
                    className="h-12 w-auto object-contain"
                    style={{ maxHeight: '50px' }}
                  />
                </div>

                <div className="text-right">
                  <h1
                    style={{
                      fontSize: '38px',
                      fontWeight: 700,
                      letterSpacing: '12px',
                      color: '#0a0a0a',
                      lineHeight: '1',
                      margin: 0,
                      textTransform: 'uppercase'
                    }}
                  >
                    INVOICE
                  </h1>
                </div>
              </div>

              {/* Row 2: Greeting (Left) & Metadata with Orange Line (Right) */}
              <div className="flex items-start justify-between mt-7">
                {/* Left: Dear Client & message */}
                <div className="max-w-[380px] text-[13px] leading-relaxed text-slate-700">
                  <p style={{ color: '#e5432b', fontWeight: 700, marginBottom: '3px' }}>
                    {activePlan.clientGreeting}
                  </p>
                  <p style={{ color: '#4b5563', lineHeight: '1.45', margin: 0 }}>
                    {activePlan.clientMessage}
                  </p>
                </div>

                {/* Right: Invoice No, Invoice Date, Due Date */}
                <div className="w-[240px]">
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'auto 16px 1fr',
                      rowGap: '5px',
                      alignItems: 'center',
                      fontSize: '12px'
                    }}
                  >
                    <span style={{ color: '#4b5563', fontWeight: 500 }}>Invoice No</span>
                    <span style={{ color: '#4b5563', textAlign: 'center' }}>:</span>
                    <span style={{ fontWeight: 600, textAlign: 'right', color: '#111827' }}>{activePlan.invoiceNo}</span>

                    <span style={{ color: '#4b5563', fontWeight: 500 }}>Invoice Date</span>
                    <span style={{ color: '#4b5563', textAlign: 'center' }}>:</span>
                    <span style={{ fontWeight: 500, textAlign: 'right', color: '#111827' }}>{activePlan.date}</span>

                    <span style={{ color: '#4b5563', fontWeight: 500 }}>Due Date</span>
                    <span style={{ color: '#4b5563', textAlign: 'center' }}>:</span>
                    <span style={{ fontWeight: 500, textAlign: 'right', color: '#111827' }}>{activePlan.dueDate}</span>
                  </div>
                  {/* Solid orange underline */}
                  <div style={{ height: '2px', backgroundColor: '#e5432b', marginTop: '8px', width: '100%' }} />
                </div>
              </div>

              {/* Row 3: Billed By (Left Box) & Bill To (Right Box) */}
              <div className="grid grid-cols-2 gap-4 mt-7">
                {/* Billed By Box */}
                <div
                  style={{
                    backgroundColor: '#fafbfc',
                    border: '1px solid #f1f2f4',
                    borderRadius: '4px',
                    padding: '14px 18px',
                    fontSize: '12px'
                  }}
                >
                  <p style={{ color: '#e5432b', fontWeight: 700, fontSize: '13px', marginBottom: '5px' }}>
                    Billed By
                  </p>
                  <p style={{ fontWeight: 700, color: '#1f2937', marginBottom: '3px' }}>
                    {activePlan.billedBy.company}
                  </p>
                  <p style={{ color: '#4b5563', margin: 0 }}>{activePlan.billedBy.addressLine1}</p>
                  <p style={{ color: '#4b5563', margin: 0 }}>{activePlan.billedBy.addressLine2}</p>
                  <p style={{ color: '#4b5563', margin: 0 }}>{activePlan.billedBy.addressLine3}</p>
                  <p style={{ color: '#4b5563', marginTop: '4px' }}>
                    GST No <span style={{ margin: '0 8px' }}>:</span> <span style={{ fontWeight: 600, color: '#1f2937' }}>{activePlan.billedBy.gstNo}</span>
                  </p>
                </div>

                {/* Bill to Box */}
                <div
                  style={{
                    backgroundColor: '#fafbfc',
                    border: '1px solid #f1f2f4',
                    borderRadius: '4px',
                    padding: '14px 18px',
                    fontSize: '12px'
                  }}
                >
                  <p style={{ color: '#e5432b', fontWeight: 700, fontSize: '13px', marginBottom: '5px' }}>
                    Bill to
                  </p>
                  <p style={{ fontWeight: 700, color: '#1f2937', marginBottom: '3px' }}>
                    {activePlan.billTo.name}
                  </p>
                  <p style={{ color: '#4b5563', margin: 0 }}>{activePlan.billTo.company}</p>
                  <p style={{ color: '#4b5563', margin: 0 }}>{activePlan.billTo.addressLine1}</p>
                  <p style={{ color: '#4b5563', margin: 0 }}>{activePlan.billTo.addressLine2}</p>
                  <p style={{ color: '#4b5563', marginTop: '4px' }}>
                    GST No <span style={{ margin: '0 8px' }}>:</span> <span style={{ fontWeight: 600, color: '#1f2937' }}>{activePlan.billTo.gstNo}</span>
                  </p>
                </div>
              </div>

              {/* Row 4: Plan Banner Strip with Crown, Duration, Users, Billing Cycle */}
              <div
                className="mt-6 flex items-center justify-between"
                style={{
                  backgroundColor: '#fdf2f0',
                  borderRadius: '6px',
                  padding: '10px 16px'
                }}
              >
                {/* Crown Icon + Plan Title + Date */}
                <div className="flex items-center gap-3">
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '6px',
                      backgroundColor: '#e5432b',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ffffff'
                    }}
                  >
                    <Icon icon="solar:crown-bold" style={{ width: '22px', height: '22px' }} />
                  </div>
                  <div>
                    <p style={{ fontWeight: 700, color: '#111827', fontSize: '13px', margin: 0 }}>
                      {activePlan.planBadgeName}
                    </p>
                    <p style={{ color: '#6b7280', fontSize: '11px', margin: 0 }}>
                      {activePlan.validityPeriod}
                    </p>
                  </div>
                </div>

                <div className="h-7 w-[1px] bg-slate-300/60" />

                {/* Duration */}
                <div className="flex items-center gap-2">
                  <Icon icon="solar:calendar-outline" style={{ width: '18px', height: '18px', color: '#374151' }} />
                  <div>
                    <p style={{ fontSize: '10.5px', color: '#6b7280', margin: 0 }}>Duration</p>
                    <p style={{ fontSize: '11.5px', fontWeight: 600, color: '#111827', margin: 0 }}>{activePlan.duration}</p>
                  </div>
                </div>

                <div className="h-7 w-[1px] bg-slate-300/60" />

                {/* Users */}
                <div className="flex items-center gap-2">
                  <Icon icon="solar:user-outline" style={{ width: '18px', height: '18px', color: '#374151' }} />
                  <div>
                    <p style={{ fontSize: '10.5px', color: '#6b7280', margin: 0 }}>Users</p>
                    <p style={{ fontSize: '11.5px', fontWeight: 600, color: '#111827', margin: 0 }}>{activePlan.users}</p>
                  </div>
                </div>

                <div className="h-7 w-[1px] bg-slate-300/60" />

                {/* Billing Cycle */}
                <div className="flex items-center gap-2">
                  <Icon icon="solar:bill-list-outline" style={{ width: '18px', height: '18px', color: '#374151' }} />
                  <div>
                    <p style={{ fontSize: '10.5px', color: '#6b7280', margin: 0 }}>Billing Cycle</p>
                    <p style={{ fontSize: '11.5px', fontWeight: 600, color: '#111827', margin: 0 }}>{activePlan.billingCycle}</p>
                  </div>
                </div>
              </div>

              {/* Row 5: The Table (With Angled Two-Color Header) */}
              <div className="mt-6">
                <table className="w-full text-left border-collapse" style={{ fontSize: '13px' }}>
                  <thead>
                    <tr style={{ color: '#ffffff', height: '40px' }}>
                      <th
                        style={{
                          backgroundColor: '#e5432b',
                          padding: '10px 18px',
                          fontWeight: 600,
                          fontSize: '13.5px',
                          borderTopLeftRadius: '3px',
                          borderBottomLeftRadius: '3px',
                          width: '54%',
                          position: 'relative'
                        }}
                      >
                        Description
                        <span
                          style={{
                            position: 'absolute',
                            top: 0,
                            right: '-16px',
                            bottom: 0,
                            width: '17px',
                            backgroundColor: '#e5432b',
                            clipPath: 'polygon(0 0, 100% 0, 0 100%)',
                            pointerEvents: 'none',
                            zIndex: 2
                          }}
                        />
                      </th>
                      <th
                        style={{
                          backgroundColor: '#2b2e35',
                          padding: '10px 16px 10px 24px',
                          fontWeight: 600,
                          fontSize: '13.5px',
                          textAlign: 'right',
                          width: '18%'
                        }}
                      >
                        Unit Price
                      </th>
                      <th
                        style={{
                          backgroundColor: '#2b2e35',
                          padding: '10px 16px',
                          fontWeight: 600,
                          fontSize: '13.5px',
                          textAlign: 'center',
                          width: '10%'
                        }}
                      >
                        Qty
                      </th>
                      <th
                        style={{
                          backgroundColor: '#2b2e35',
                          padding: '10px 18px',
                          fontWeight: 600,
                          fontSize: '13.5px',
                          textAlign: 'right',
                          borderTopRightRadius: '3px',
                          borderBottomRightRadius: '3px',
                          width: '18%'
                        }}
                      >
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody style={{ color: '#1e2430' }}>
                    {activePlan.items.map((item, idx) => (
                      <tr
                        key={idx}
                        style={{
                          borderBottom: '1px solid #f1f2f4'
                        }}
                      >
                        <td style={{ padding: '16px 18px' }}>
                          <p style={{ fontWeight: 600, fontSize: '13px', color: '#111827', margin: 0 }}>
                            {item.title}
                          </p>
                          <p style={{ fontSize: '11px', color: '#6b7280', margin: '2px 0 0 0' }}>
                            {item.subtitle}
                          </p>
                          <p style={{ fontSize: '11px', color: '#6b7280', margin: '1px 0 0 0' }}>
                            {item.sac}
                          </p>
                        </td>
                        <td
                          style={{
                            padding: '16px 16px',
                            textAlign: 'right',
                            fontWeight: 500,
                            fontSize: '13px',
                            color: '#111827'
                          }}
                        >
                          {activePlan.currency}{formatMoney(item.unitPrice)}
                        </td>
                        <td
                          style={{
                            padding: '16px 16px',
                            textAlign: 'center',
                            fontWeight: 500,
                            fontSize: '13px',
                            color: '#111827'
                          }}
                        >
                          {item.qty}
                        </td>
                        <td
                          style={{
                            padding: '16px 18px',
                            textAlign: 'right',
                            fontWeight: 500,
                            fontSize: '13px',
                            color: '#111827'
                          }}
                        >
                          {activePlan.currency}{formatMoney(item.unitPrice * item.qty)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Two-Column Bottom Section (Exact Grid/Flex Alignment Matching Reference) */}
              <div className="grid grid-cols-2 gap-8 mt-6 items-end">
                {/* Left Column: Pushed down so Helpline & Terms sit at bottom matching reference image */}
                <div className="flex flex-col justify-end space-y-5">
                  {/* Thanks for your business + Helpline + Email */}
                  <div className="space-y-2 text-[12px] text-slate-700">
                    <p style={{ color: '#e5432b', fontWeight: 700, fontSize: '13px', marginBottom: '6px' }}>
                      Thanks for your business
                    </p>
                    <div className="flex items-center gap-2">
                      <Icon icon="solar:phone-calling-outline" style={{ width: '15px', height: '15px', color: '#4b5563' }} />
                      <span style={{ color: '#4b5563', width: '56px' }}>Helpline</span>
                      <span style={{ color: '#4b5563' }}>:</span>
                      <span style={{ color: '#111827', fontWeight: 500 }}>{activePlan.helpline}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Icon icon="solar:letter-outline" style={{ width: '15px', height: '15px', color: '#4b5563' }} />
                      <span style={{ color: '#4b5563', width: '56px' }}>Email</span>
                      <span style={{ color: '#4b5563' }}>:</span>
                      <span style={{ color: '#111827', fontWeight: 500 }}>{activePlan.email}</span>
                    </div>
                  </div>

                  {/* Terms & Conditions */}
                  <div className="text-[12px] leading-tight text-slate-500">
                    <p style={{ color: '#e5432b', fontWeight: 700, fontSize: '12.5px', marginBottom: '4px' }}>
                      Terms &amp; Conditions
                    </p>
                    <p style={{ color: '#4b5563', lineHeight: '1.45', margin: 0 }}>
                      Payment is due by the specified date. Additional revisions may incur extra charges. Deliverables are provided upon payment confirmation.
                    </p>
                  </div>
                </div>

                {/* Right Column: Complete Totals breakdown + Solid Orange Grand Total + Balance Due + Account Manager Signature */}
                <div className="flex flex-col items-end">
                  {/* Totals Breakdown */}
                  <div className="w-full max-w-[310px]">
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'auto 16px 1fr',
                        rowGap: '6px',
                        alignItems: 'center',
                        fontSize: '13px',
                        paddingBottom: '10px'
                      }}
                    >
                      <span style={{ color: '#4b5563' }}>Subtotal</span>
                      <span style={{ color: '#4b5563', textAlign: 'center' }}>:</span>
                      <span style={{ fontWeight: 500, textAlign: 'right', color: '#111827' }}>
                        {activePlan.currency}{formatMoney(activePlan.subtotal)}
                      </span>

                      <span style={{ color: '#16a34a', fontWeight: 500 }}>Discount</span>
                      <span style={{ color: '#16a34a', textAlign: 'center' }}>:</span>
                      <span style={{ color: '#16a34a', fontWeight: 600, textAlign: 'right' }}>
                        -{activePlan.currency}{formatMoney(activePlan.discount)}
                      </span>

                      <span style={{ color: '#4b5563' }}>Taxable Amount</span>
                      <span style={{ color: '#4b5563', textAlign: 'center' }}>:</span>
                      <span style={{ fontWeight: 500, textAlign: 'right', color: '#111827' }}>
                        {activePlan.currency}{formatMoney(activePlan.taxableAmount)}
                      </span>

                      <span style={{ color: '#4b5563' }}>CGST (9%)</span>
                      <span style={{ color: '#4b5563', textAlign: 'center' }}>:</span>
                      <span style={{ fontWeight: 500, textAlign: 'right', color: '#111827' }}>
                        {activePlan.currency}{formatMoney(activePlan.cgstAmount)}
                      </span>

                      <span style={{ color: '#4b5563' }}>SGST (9%)</span>
                      <span style={{ color: '#4b5563', textAlign: 'center' }}>:</span>
                      <span style={{ fontWeight: 500, textAlign: 'right', color: '#111827' }}>
                        {activePlan.currency}{formatMoney(activePlan.sgstAmount)}
                      </span>
                    </div>

                    {/* Solid Red-Orange Grand Total Box */}
                    <div
                      style={{
                        backgroundColor: '#e5432b',
                        color: '#ffffff',
                        padding: '10px 18px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        borderRadius: '2px',
                        fontWeight: 700,
                        fontSize: '14px',
                        boxShadow: '0 1px 3px rgba(229, 67, 43, 0.25)'
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <span>Grand Total</span>
                        <span>:</span>
                      </div>
                      <span style={{ fontSize: '15px', fontWeight: 700 }}>
                        {activePlan.currency}{formatMoney(activePlan.grandTotal)}
                      </span>
                    </div>

                    {/* Balance Due */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'auto 16px 1fr',
                        alignItems: 'center',
                        fontSize: '13px',
                        marginTop: '8px'
                      }}
                    >
                      <span style={{ color: '#4b5563' }}>Balance Due</span>
                      <span style={{ color: '#4b5563', textAlign: 'center' }}>:</span>
                      <span style={{ fontWeight: 600, textAlign: 'right', color: '#111827' }}>
                        {activePlan.currency}{formatMoney(activePlan.balanceDue)}
                      </span>
                    </div>

                    {/* Account Manager Signature - Right Aligned underneath Totals */}
                    <div className="mt-8 flex flex-col items-center ml-auto" style={{ width: '160px' }}>
                      <div className="flex justify-center mb-1">
                        <svg width="120" height="50" viewBox="0 0 120 50" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path
                            d="M15 42C22 30 28 8 34 18C38 25 39 38 45 28C50 20 54 26 58 36C62 42 66 32 72 24C78 18 82 24 88 32C94 38 102 20 108 26M30 46C50 40 78 30 108 22"
                            stroke="#111827"
                            strokeWidth="2.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                      <p
                        style={{
                          fontSize: '13px',
                          fontWeight: 500,
                          color: '#111827',
                          textDecoration: 'underline',
                          textUnderlineOffset: '4px',
                          margin: 0
                        }}
                      >
                        Account Manager
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Curved Banner Footer using exact user SVG */}
            <div className="relative w-full -mx-[48px] overflow-hidden leading-none" style={{ width: 'calc(100% + 96px)', height: '39px' }}>
              <svg
                width="100%"
                height="39"
                viewBox="0 0 595 39"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                preserveAspectRatio="none"
                className="w-full h-full block"
              >
                <g clipPath="url(#modal_clip0_1073_7)">
                  <path d="M6 55.0008V33.9621C6.5953 34.1812 33.1853 35.8175 45.8849 36.415C98.8664 38.7736 162.861 36.7924 178.934 36.415C329 42.5 546.5 -12.998 595.5 4.50283L601 55.0008H6Z" fill="#EC5137"/>
                  <path d="M0.000537872 0L0 55H342L371 38C269 45.5 42 20 0.000537872 0Z" fill="black"/>
                  <path d="M461.143 25L459.294 18.4545H460.866L462.017 23.0568H462.077L463.253 18.4545H464.808L465.984 23.0312H466.048L467.182 18.4545H468.759L466.905 25H465.298L464.071 20.5767H463.982L462.754 25H461.143ZM471.186 25L469.337 18.4545H470.909L472.06 23.0568H472.12L473.296 18.4545H474.851L476.027 23.0312H476.091L477.225 18.4545H478.801L476.948 25H475.341L474.114 20.5767H474.025L472.797 25H471.186ZM481.229 25L479.38 18.4545H480.952L482.103 23.0568H482.163L483.339 18.4545H484.894L486.07 23.0312H486.134L487.268 18.4545H488.844L486.991 25H485.384L484.157 20.5767H484.067L482.84 25H481.229ZM489.981 25.0938C489.723 25.0938 489.501 25.0028 489.316 24.821C489.132 24.6392 489.041 24.4176 489.044 24.1562C489.041 23.9006 489.132 23.6818 489.316 23.5C489.501 23.3182 489.723 23.2273 489.981 23.2273C490.231 23.2273 490.449 23.3182 490.633 23.5C490.821 23.6818 490.916 23.9006 490.919 24.1562C490.916 24.3295 490.87 24.4872 490.782 24.6293C490.697 24.7713 490.583 24.8849 490.441 24.9702C490.302 25.0526 490.149 25.0938 489.981 25.0938ZM495.827 18.4545V19.6477H491.957V18.4545H495.827ZM492.925 25V17.8366C492.925 17.3963 493.016 17.0298 493.197 16.7372C493.382 16.4446 493.629 16.2259 493.939 16.081C494.249 15.9361 494.592 15.8636 494.97 15.8636C495.237 15.8636 495.474 15.8849 495.682 15.9276C495.889 15.9702 496.043 16.0085 496.142 16.0426L495.835 17.2358C495.77 17.2159 495.688 17.196 495.588 17.1761C495.489 17.1534 495.378 17.142 495.256 17.142C494.969 17.142 494.766 17.2116 494.646 17.3509C494.53 17.4872 494.472 17.6832 494.472 17.9389V25H492.925ZM498.577 16.2727V25H497.035V16.2727H498.577ZM500.164 25V18.4545H501.706V25H500.164ZM500.939 17.5256C500.695 17.5256 500.485 17.4446 500.309 17.2827C500.132 17.1179 500.044 16.9205 500.044 16.6903C500.044 16.4574 500.132 16.2599 500.309 16.098C500.485 15.9332 500.695 15.8509 500.939 15.8509C501.186 15.8509 501.397 15.9332 501.57 16.098C501.746 16.2599 501.834 16.4574 501.834 16.6903C501.834 16.9205 501.746 17.1179 501.57 17.2827C501.397 17.4446 501.186 17.5256 500.939 17.5256ZM503.293 27.4545V18.4545H504.81V19.5369H504.899C504.979 19.3778 505.091 19.2088 505.236 19.0298C505.381 18.848 505.577 18.6932 505.824 18.5653C506.071 18.4347 506.386 18.3693 506.77 18.3693C507.276 18.3693 507.732 18.4986 508.138 18.7571C508.547 19.0128 508.871 19.392 509.109 19.8949C509.351 20.3949 509.472 21.0085 509.472 21.7358C509.472 22.4545 509.354 23.0653 509.118 23.5682C508.882 24.071 508.561 24.4545 508.155 24.7188C507.749 24.983 507.288 25.1151 506.774 25.1151C506.399 25.1151 506.088 25.0526 505.841 24.9276C505.594 24.8026 505.395 24.652 505.244 24.4759C505.097 24.2969 504.982 24.1278 504.899 23.9688H504.835V27.4545H503.293ZM504.805 21.7273C504.805 22.1506 504.865 22.5213 504.984 22.8395C505.107 23.1577 505.281 23.4062 505.509 23.5852C505.739 23.7614 506.017 23.8494 506.344 23.8494C506.685 23.8494 506.97 23.7585 507.2 23.5767C507.43 23.392 507.604 23.1406 507.72 22.8224C507.839 22.5014 507.899 22.1364 507.899 21.7273C507.899 21.321 507.841 20.9602 507.724 20.6449C507.608 20.3295 507.435 20.0824 507.205 19.9034C506.974 19.7244 506.688 19.6349 506.344 19.6349C506.014 19.6349 505.734 19.7216 505.504 19.8949C505.274 20.0682 505.099 20.3111 504.98 20.6236C504.864 20.9361 504.805 21.304 504.805 21.7273ZM510.793 25V18.4545H512.335V25H510.793ZM511.568 17.5256C511.324 17.5256 511.114 17.4446 510.938 17.2827C510.761 17.1179 510.673 16.9205 510.673 16.6903C510.673 16.4574 510.761 16.2599 510.938 16.098C511.114 15.9332 511.324 15.8509 511.568 15.8509C511.815 15.8509 512.026 15.9332 512.199 16.098C512.375 16.2599 512.463 16.4574 512.463 16.6903C512.463 16.9205 512.375 17.1179 512.199 17.2827C512.026 17.4446 511.815 17.5256 511.568 17.5256ZM513.99 25V16.2727H515.532V19.5369H515.596C515.676 19.3778 515.788 19.2088 515.933 19.0298C516.078 18.848 516.274 18.6932 516.521 18.5653C516.768 18.4347 517.083 18.3693 517.467 18.3693C517.973 18.3693 518.429 18.4986 518.835 18.7571C519.244 19.0128 519.568 19.392 519.806 19.8949C520.048 20.3949 520.169 21.0085 520.169 21.7358C520.169 22.4545 520.051 23.0653 519.815 23.5682C519.579 24.071 519.258 24.4545 518.852 24.7188C518.446 24.983 517.985 25.1151 517.471 25.1151C517.096 25.1151 516.785 25.0526 516.538 24.9276C516.291 24.8026 516.092 24.652 515.941 24.4759C515.794 24.2969 515.679 24.1278 515.596 23.9688H515.507V25H513.99ZM515.502 21.7273C515.502 22.1506 515.562 22.5213 515.681 22.8395C515.804 23.1577 515.978 23.4062 516.206 23.5852C516.436 23.7614 516.714 23.8494 517.041 23.8494C517.382 23.8494 517.667 23.7585 517.897 23.5767C518.127 23.392 518.301 23.1406 518.417 22.8224C518.537 22.5014 518.596 22.1364 518.596 21.7273C518.596 21.321 518.538 20.9602 518.422 20.6449C518.305 20.3295 518.132 20.0824 517.902 19.9034C517.672 19.7244 517.385 19.6349 517.041 19.6349C516.711 19.6349 516.431 19.7216 516.201 19.8949C515.971 20.0682 515.797 20.3111 515.677 20.6236C515.561 20.9361 515.502 21.304 515.502 21.7273ZM524.335 25.1278C523.696 25.1278 523.142 24.9872 522.673 24.706C522.205 24.4247 521.841 24.0312 521.582 23.5256C521.327 23.0199 521.199 22.429 521.199 21.7528C521.199 21.0767 521.327 20.4844 521.582 19.9759C521.841 19.4673 522.205 19.0724 522.673 18.7912C523.142 18.5099 523.696 18.3693 524.335 18.3693C524.974 18.3693 525.528 18.5099 525.997 18.7912C526.466 19.0724 526.828 19.4673 527.084 19.9759C527.342 20.4844 527.472 21.0767 527.472 21.7528C527.472 22.429 527.342 23.0199 527.084 23.5256C526.828 24.0312 526.466 24.4247 525.997 24.706C525.528 24.9872 524.974 25.1278 524.335 25.1278ZM524.344 23.892C524.69 23.892 524.98 23.7969 525.213 23.6065C525.446 23.4134 525.619 23.1548 525.733 22.831C525.849 22.5071 525.908 22.1463 525.908 21.7486C525.908 21.348 525.849 20.9858 525.733 20.6619C525.619 20.3352 525.446 20.0753 525.213 19.8821C524.98 19.6889 524.69 19.5923 524.344 19.5923C523.989 19.5923 523.693 19.6889 523.457 19.8821C523.224 20.0753 523.05 20.3352 522.933 20.6619C522.82 20.9858 522.763 21.348 522.763 21.7486C522.763 22.1463 522.82 22.5071 522.933 22.831C523.05 23.1548 523.224 23.4134 523.457 23.6065C523.693 23.7969 523.989 23.892 524.344 23.892ZM531.636 25.1278C530.997 25.1278 530.443 24.9872 529.974 24.706C529.505 24.4247 529.142 24.0312 528.883 23.5256C528.627 23.0199 528.5 22.429 528.5 21.7528C528.5 21.0767 528.627 20.4844 528.883 19.9759C529.142 19.4673 529.505 19.0724 529.974 18.7912C530.443 18.5099 530.997 18.3693 531.636 18.3693C532.275 18.3693 532.829 18.5099 533.298 18.7912C533.767 19.0724 534.129 19.4673 534.385 19.9759C534.643 20.4844 534.772 21.0767 534.772 21.7528C534.772 22.429 534.643 23.0199 534.385 23.5256C534.129 24.0312 533.767 24.4247 533.298 24.706C532.829 24.9872 532.275 25.1278 531.636 25.1278ZM531.645 23.892C531.991 23.892 532.281 23.7969 532.514 23.6065C532.747 23.4134 532.92 23.1548 533.034 22.831C533.15 22.5071 533.208 22.1463 533.208 21.7486C533.208 21.348 533.15 20.9858 533.034 20.6619C532.92 20.3352 532.747 20.0753 532.514 19.8821C532.281 19.6889 531.991 19.5923 531.645 19.5923C531.289 19.5923 530.994 19.6889 530.758 19.8821C530.525 20.0753 530.35 20.3352 530.234 20.6619C530.12 20.9858 530.064 21.348 530.064 21.7486C530.064 22.1463 530.12 22.5071 530.234 22.831C530.35 23.1548 530.525 23.4134 530.758 23.6065C530.994 23.7969 531.289 23.892 531.645 23.892ZM537.488 22.946L537.484 21.0838H537.731L540.083 18.4545H541.886L538.992 21.6761H538.673L537.488 22.946ZM536.082 25V16.2727H537.624V25H536.082ZM540.19 25L538.059 22.0213L539.099 20.9347L542.035 25H540.19ZM543.864 25.0938C543.605 25.0938 543.384 25.0028 543.199 24.821C543.015 24.6392 542.924 24.4176 542.926 24.1562C542.924 23.9006 543.015 23.6818 543.199 23.5C543.384 23.3182 543.605 23.2273 543.864 23.2273C544.114 23.2273 544.331 23.3182 544.516 23.5C544.703 23.6818 544.799 23.9006 544.801 24.1562C544.799 24.3295 544.753 24.4872 544.665 24.6293C544.58 24.7713 544.466 24.8849 544.324 24.9702C544.185 25.0526 544.032 25.0938 543.864 25.0938ZM549.249 25.1278C548.596 25.1278 548.035 24.9844 547.566 24.6974C547.1 24.4105 546.741 24.0142 546.488 23.5085C546.238 23 546.113 22.4148 546.113 21.7528C546.113 21.0881 546.241 20.5014 546.496 19.9929C546.752 19.4815 547.113 19.0838 547.579 18.7997C548.048 18.5128 548.602 18.3693 549.241 18.3693C549.772 18.3693 550.242 18.4673 550.651 18.6634C551.063 18.8565 551.391 19.1307 551.636 19.4858C551.88 19.8381 552.019 20.25 552.053 20.7216H550.579C550.519 20.4062 550.377 20.1435 550.153 19.9332C549.931 19.7202 549.634 19.6136 549.262 19.6136C548.947 19.6136 548.67 19.6989 548.431 19.8693C548.192 20.0369 548.006 20.2784 547.873 20.5938C547.742 20.9091 547.677 21.2869 547.677 21.7273C547.677 22.1733 547.742 22.5568 547.873 22.8778C548.004 23.196 548.187 23.4418 548.423 23.6151C548.661 23.7855 548.941 23.8707 549.262 23.8707C549.489 23.8707 549.692 23.8281 549.871 23.7429C550.053 23.6548 550.205 23.5284 550.327 23.3636C550.45 23.1989 550.533 22.9986 550.579 22.7628H552.053C552.016 23.2259 551.88 23.6364 551.644 23.9943C551.408 24.3494 551.087 24.6278 550.681 24.8295C550.275 25.0284 549.798 25.1278 549.249 25.1278ZM556.175 25.1278C555.536 25.1278 554.982 24.9872 554.513 24.706C554.044 24.4247 553.681 24.0312 553.422 23.5256C553.167 23.0199 553.039 22.429 553.039 21.7528C553.039 21.0767 553.167 20.4844 553.422 19.9759C553.681 19.4673 554.044 19.0724 554.513 18.7912C554.982 18.5099 555.536 18.3693 556.175 18.3693C556.814 18.3693 557.368 18.5099 557.837 18.7912C558.306 19.0724 558.668 19.4673 558.924 19.9759C559.182 20.4844 559.311 21.0767 559.311 21.7528C559.311 22.429 559.182 23.0199 558.924 23.5256C558.668 24.0312 558.306 24.4247 557.837 24.706C557.368 24.9872 556.814 25.1278 556.175 25.1278ZM556.184 23.892C556.53 23.892 556.82 23.7969 557.053 23.6065C557.286 23.4134 557.459 23.1548 557.573 22.831C557.689 22.5071 557.748 22.1463 557.748 21.7486C557.748 21.348 557.689 20.9858 557.573 20.6619C557.459 20.3352 557.286 20.0753 557.053 19.8821C556.82 19.6889 556.53 19.5923 556.184 19.5923C555.828 19.5923 555.533 19.6889 555.297 19.8821C555.064 20.0753 554.89 20.3352 554.773 20.6619C554.659 20.9858 554.603 21.348 554.603 21.7486C554.603 22.1463 554.659 22.5071 554.773 22.831C554.89 23.1548 555.064 23.4134 555.297 23.6065C555.533 23.7969 555.828 23.892 556.184 23.892ZM560.621 25V18.4545H562.095V19.5668H562.172C562.308 19.1918 562.534 18.8991 562.849 18.6889C563.165 18.4759 563.541 18.3693 563.979 18.3693C564.422 18.3693 564.795 18.4773 565.099 18.6932C565.406 18.9062 565.622 19.1974 565.747 19.5668H565.815C565.96 19.2031 566.205 18.9134 566.548 18.6974C566.895 18.4787 567.305 18.3693 567.78 18.3693C568.382 18.3693 568.874 18.5597 569.254 18.9403C569.635 19.321 569.825 19.8764 569.825 20.6065V25H568.278V20.8452C568.278 20.4389 568.17 20.142 567.955 19.9545C567.739 19.7642 567.474 19.669 567.162 19.669C566.79 19.669 566.499 19.7855 566.288 20.0185C566.081 20.2486 565.977 20.5483 565.977 20.9176V25H564.464V20.7812C564.464 20.4432 564.362 20.1733 564.158 19.9716C563.956 19.7699 563.692 19.669 563.365 19.669C563.143 19.669 562.942 19.7259 562.76 19.8395C562.578 19.9503 562.433 20.108 562.325 20.3125C562.217 20.5142 562.163 20.75 562.163 21.0199V25H560.621Z" fill="white"/>
                </g>
                <defs>
                  <clipPath id="modal_clip0_1073_7">
                    <rect width="595" height="39" fill="white"/>
                  </clipPath>
                </defs>
              </svg>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default InvoiceModal;

