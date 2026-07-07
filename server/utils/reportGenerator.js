const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { SYMBOLS } = require('./currency');
function generatePdfReport(user, transactions, goals, budgets, outputPath = null) {
  return new Promise((resolve, reject) => {
    try {
      if (!outputPath) {
        const dateStr = new Date().toISOString().slice(0, 7).replace('-', '');
        outputPath = path.join(os.tmpdir(), `finsight_statement_${dateStr}.pdf`);
      }

      const doc = new PDFDocument({ size: 'A4', margin: 50, bufferPages: true });
      const stream = fs.createWriteStream(outputPath);
      doc.pipe(stream);

      // Register system fonts to support unicode currency symbols
      if (os.platform() === 'win32') {
        doc.registerFont('Arial', 'C:\\Windows\\Fonts\\arial.ttf');
        doc.registerFont('Arial-Bold', 'C:\\Windows\\Fonts\\arialbd.ttf');
        doc.registerFont('Mangal', 'C:\\Windows\\Fonts\\mangal.ttf');
        doc.registerFont('Mangal-Bold', 'C:\\Windows\\Fonts\\mangalb.ttf');
      } else {
        const fontDir = path.join(__dirname, '..', 'fonts');
        doc.registerFont('NotoDeva', path.join(fontDir, 'NotoSansDevanagari-Regular.ttf'));
      }

      const isNpr = user.preferred_currency === 'NPR';
      let regularFont, boldFont;
      if (os.platform() === 'win32') {
        regularFont = isNpr ? 'Mangal' : 'Arial';
        boldFont = isNpr ? 'Mangal-Bold' : 'Arial-Bold';
      } else {
        regularFont = isNpr ? 'NotoDeva' : 'Helvetica';
        boldFont = isNpr ? 'NotoDeva' : 'Helvetica-Bold';
      }

      const sym = SYMBOLS[user.preferred_currency || 'INR'] || '';

      // --- HEADER ---
      // Left vertical accent bar
      doc.rect(50, 48, 5, 24).fill('#1e3a8a');
      
      doc.font(boldFont).fontSize(16).fillColor('#0f172a').text('FINSIGHT ACCOUNT STATEMENT', 62, 50);
      doc.moveDown(0.4);
      doc.strokeColor('#cbd5e1').lineWidth(0.5).moveTo(50, doc.y).lineTo(545, doc.y).stroke();
      doc.moveDown(0.8);

      const headerY = doc.y;
      
      // Account & User Details (Left side)
      doc.font(boldFont).fontSize(9).fillColor('#475569');
      doc.text('Account Holder:', 50, headerY);
      doc.font(regularFont).fillColor('#0f172a').text(user.full_name, 140, headerY);
      
      doc.font(boldFont).fillColor('#475569').text('Email Address:', 50, headerY + 15);
      doc.font(regularFont).fillColor('#0f172a').text(user.email, 140, headerY + 15);

      doc.font(boldFont).fillColor('#475569').text('Preferred Currency:', 50, headerY + 30);
      doc.font(regularFont).fillColor('#0f172a').text(`${user.preferred_currency || 'INR'} (${sym})`, 140, headerY + 30);

      // Statement Metadata (Right side)
      const rightX = 350;
      const currentDate = new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });

      // Compute transaction date range (DD-MM-YYYY to DD-MM-YYYY)
      let periodText = 'N/A';
      if (Array.isArray(transactions) && transactions.length > 0) {
        const dates = transactions.map(t => new Date(t.transaction_date));
        const minDate = new Date(Math.min.apply(null, dates));
        const maxDate = new Date(Math.max.apply(null, dates));
        const fmt = d => d.toLocaleDateString('en-GB').replace(/\//g, '-'); // DD-MM-YYYY
        periodText = `${fmt(minDate)} to ${fmt(maxDate)}`;
      }

      doc.font(boldFont).fillColor('#475569').text('Statement Date:', rightX, headerY);
      doc.font(regularFont).fillColor('#0f172a').text(currentDate, rightX + 95, headerY);

      doc.font(boldFont).fillColor('#475569').text('Statement Period:', rightX, headerY + 15);
      doc.font(regularFont).fillColor('#0f172a').text(periodText, rightX + 95, headerY + 15);

      doc.font(boldFont).fillColor('#475569').text('Account Status:', rightX, headerY + 30);
      doc.font(boldFont).fillColor('#10b981').text('ACTIVE', rightX + 95, headerY + 30);

      doc.moveDown(3);

      // --- CALCULATIONS & STATEMENT SUMMARY ---
      const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + parseFloat(t.amount), 0);
      const expense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + parseFloat(t.amount), 0);
      const closingBalance = income - expense;

      // Draw modern card-style summary dashboard
      const summaryY = doc.y;
      doc.roundedRect(50, summaryY, 495, 60, 6).fill('#f8fafc');
      doc.strokeColor('#e2e8f0').lineWidth(1).roundedRect(50, summaryY, 495, 60, 6).stroke();

      // Divider lines inside the summary card
      doc.strokeColor('#cbd5e1').lineWidth(0.5);
      doc.moveTo(170, summaryY + 10).lineTo(170, summaryY + 50).stroke();
      doc.moveTo(295, summaryY + 10).lineTo(295, summaryY + 50).stroke();
      doc.moveTo(420, summaryY + 10).lineTo(420, summaryY + 50).stroke();

      // Card 1
      doc.fillColor('#475569').font(boldFont).fontSize(7.5);
      doc.text('STARTING BALANCE', 65, summaryY + 14);
      doc.fillColor('#0f172a').font(boldFont).fontSize(11).text(`${sym}0.00`, 65, summaryY + 28);

      // Card 2
      doc.fillColor('#475569').font(boldFont).fontSize(7.5);
      doc.text('TOTAL DEPOSITS (CR)', 185, summaryY + 14);
      doc.fillColor('#10b981').font(boldFont).fontSize(11).text(`${sym}${income.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 185, summaryY + 28);

      // Card 3
      doc.fillColor('#475569').font(boldFont).fontSize(7.5);
      doc.text('TOTAL WITHDRAWALS (DR)', 310, summaryY + 14);
      doc.fillColor('#ef4444').font(boldFont).fontSize(11).text(`${sym}${expense.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 310, summaryY + 28);

      // Card 4
      doc.fillColor('#475569').font(boldFont).fontSize(7.5);
      doc.text('CLOSING BALANCE', 435, summaryY + 14);
      doc.fillColor('#1e3a8a').font(boldFont).fontSize(11).text(`${sym}${closingBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 435, summaryY + 28);

      doc.moveDown(4.8);

      // --- TRANSACTION LEDGER ---
      if (transactions && transactions.length > 0) {
        doc.fillColor('#0f172a').font(boldFont).fontSize(11).text('Transaction Ledger');
        doc.moveDown(0.5);

        // Sort oldest to newest to compute running balance
        const sortedTxs = [...transactions].sort((a, b) => new Date(a.transaction_date) - new Date(b.transaction_date));
        let runningBalance = 0;
        const statementTxs = sortedTxs.map(t => {
          const amt = parseFloat(t.amount);
          if (t.type === 'income') {
            runningBalance += amt;
            return {
              date: t.transaction_date,
              description: t.description || 'Deposit',
              category: t.category_name || 'Income',
              debit: '',
              credit: amt,
              balance: runningBalance
            };
          } else {
            runningBalance -= amt;
            return {
              date: t.transaction_date,
              description: t.description || 'Withdrawal',
              category: t.category_name || 'Expense',
              debit: amt,
              credit: '',
              balance: runningBalance
            };
          }
        });

        // Double-line Premium Table Header
        let y = doc.y;
        doc.rect(50, y, 495, 22).fill('#f8fafc');
        doc.strokeColor('#cbd5e1').lineWidth(0.5).moveTo(50, y).lineTo(545, y).stroke();
        doc.moveTo(50, y + 22).lineTo(545, y + 22).stroke();
        
        doc.fillColor('#475569').font(boldFont).fontSize(8);
        doc.text('Date', 55, y + 7, { width: 60 });
        doc.text('Description', 120, y + 7, { width: 140 });
        doc.text('Category', 265, y + 7, { width: 80 });
        doc.text('Withdrawals (DR)', 350, y + 7, { width: 60, align: 'right' });
        doc.text('Deposits (CR)', 415, y + 7, { width: 60, align: 'right' });
        doc.text('Balance', 480, y + 7, { width: 60, align: 'right' });
        
        y += 22;

        // Rows (oldest to newest for chronological flow)
        doc.font(regularFont).fontSize(8);
        statementTxs.forEach((t, index) => {
          // Check page boundary
          if (y > 700) {
            doc.addPage();
            y = 50;
            doc.rect(50, y, 495, 22).fill('#f8fafc');
            doc.strokeColor('#cbd5e1').lineWidth(0.5).moveTo(50, y).lineTo(545, y).stroke();
            doc.moveTo(50, y + 22).lineTo(545, y + 22).stroke();
            
            doc.fillColor('#475569').font(boldFont).fontSize(8);
            doc.text('Date', 55, y + 7, { width: 60 });
            doc.text('Description', 120, y + 7, { width: 140 });
            doc.text('Category', 265, y + 7, { width: 80 });
            doc.text('Withdrawals (DR)', 350, y + 7, { width: 60, align: 'right' });
            doc.text('Deposits (CR)', 415, y + 7, { width: 60, align: 'right' });
            doc.text('Balance', 480, y + 7, { width: 60, align: 'right' });
            doc.fillColor('black').font(regularFont).fontSize(8);
            y += 22;
          }

          // Alternating row background
          if (index % 2 === 1) {
            doc.rect(50, y, 495, 20).fill('#f8fafc');
          }

          // Format Date
          let dateStr = '';
          try {
            const d = new Date(t.date);
            dateStr = d.toLocaleDateString('en-US', { day: '2-digit', month: 'short' });
          } catch (e) {
            dateStr = t.date || '';
          }

          const debitStr = t.debit !== '' ? `${sym}${t.debit.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '-';
          const creditStr = t.credit !== '' ? `${sym}${t.credit.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '-';
          const balanceStr = `${sym}${t.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

          doc.fillColor('#334155');
          doc.text(dateStr, 55, y + 6);
          doc.text(t.description, 120, y + 6, { width: 140, height: 12, ellipsis: true });
          doc.text(t.category, 265, y + 6, { width: 80, height: 12, ellipsis: true });
          
          if (t.debit !== '') doc.fillColor('#ef4444');
          doc.text(debitStr, 350, y + 6, { width: 60, align: 'right' });
          
          if (t.credit !== '') doc.fillColor('#10b981');
          doc.text(creditStr, 415, y + 6, { width: 60, align: 'right' });
          
          doc.fillColor('#1e3a8a').font(boldFont);
          doc.text(balanceStr, 480, y + 6, { width: 60, align: 'right' });
          doc.font(regularFont); // Reset font

          // Row separator line
          doc.strokeColor('#f1f5f9').lineWidth(0.5).moveTo(50, y + 20).lineTo(545, y + 20).stroke();

          y += 20;
        });

        doc.y = y + 15;
      }

      // Savings Goals Section
      if (goals && goals.length > 0) {
        if (doc.y > 600) {
          doc.addPage();
        }
        doc.moveDown(0.8);
        doc.fillColor('#0f172a').font(boldFont).fontSize(11).text('Linked Savings Goals');
        doc.moveDown(0.5);

        let y = doc.y;
        doc.rect(50, y, 495, 22).fill('#f8fafc');
        doc.strokeColor('#cbd5e1').lineWidth(0.5).moveTo(50, y).lineTo(545, y).stroke();
        doc.moveTo(50, y + 22).lineTo(545, y + 22).stroke();
        
        doc.fillColor('#475569').font(boldFont).fontSize(8);
        doc.text('Goal Target', 55, y + 7, { width: 160 });
        doc.text('Target Amount', 225, y + 7, { width: 100, align: 'right' });
        doc.text('Current Savings', 335, y + 7, { width: 100, align: 'right' });
        doc.text('Progress', 445, y + 7, { width: 95, align: 'right' });

        y += 22;

        doc.font(regularFont).fontSize(8);
        goals.forEach((g, index) => {
          if (y > 700) {
            doc.addPage();
            y = 50;
            doc.rect(50, y, 495, 22).fill('#f8fafc');
            doc.strokeColor('#cbd5e1').lineWidth(0.5).moveTo(50, y).lineTo(545, y).stroke();
            doc.moveTo(50, y + 22).lineTo(545, y + 22).stroke();
            
            doc.fillColor('#475569').font(boldFont).fontSize(8);
            doc.text('Goal Target', 55, y + 7, { width: 160 });
            doc.text('Target Amount', 225, y + 7, { width: 100, align: 'right' });
            doc.text('Current Savings', 335, y + 7, { width: 100, align: 'right' });
            doc.text('Progress', 445, y + 7, { width: 95, align: 'right' });
            doc.fillColor('black').font(regularFont).fontSize(8);
            y += 22;
          }

          if (index % 2 === 1) {
            doc.rect(50, y, 495, 20).fill('#f8fafc');
          }

          const targetAmt = parseFloat(g.target_amount);
          const currentAmt = parseFloat(g.current_amount);
          const progPct = g.progress_pct || 0;
          const statusStr = g.status ? g.status.toUpperCase() : 'ACTIVE';

          doc.fillColor('#334155');
          doc.text(`${g.name} (${statusStr})`, 55, y + 6, { width: 160, height: 12, ellipsis: true });
          doc.text(`${sym}${targetAmt.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 225, y + 6, { width: 100, align: 'right' });
          doc.text(`${sym}${currentAmt.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 335, y + 6, { width: 100, align: 'right' });
          
          if (progPct >= 100) doc.fillColor('#10b981').font(boldFont);
          doc.text(`${progPct.toFixed(1)}%`, 445, y + 6, { width: 95, align: 'right' });
          doc.font(regularFont);

          doc.strokeColor('#f1f5f9').lineWidth(0.5).moveTo(50, y + 20).lineTo(545, y + 20).stroke();
          y += 20;
        });
      }

      // Add footers with page numbering dynamically to all buffered pages
      const range = doc.bufferedPageRange();
      for (let i = 0; i < range.count; i++) {
        doc.switchToPage(i);
        
        // Footer top rule
        doc.strokeColor('#cbd5e1').lineWidth(0.5).moveTo(50, 745).lineTo(545, 745).stroke();
        
        doc.font(regularFont).fontSize(7.5).fillColor('#94a3b8');
        doc.text('FinSight Financial Statement  |  Generated Automatically', 50, 755, { align: 'left' });
        doc.text(`Page ${i + 1} of ${range.count}`, 50, 755, { align: 'right', width: 495 });
      }

      doc.end();

      stream.on('finish', () => {
        resolve(outputPath);
      });
      stream.on('error', (err) => {
        reject(err);
      });
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = {
  generatePdfReport
};
