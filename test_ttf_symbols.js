const PDFDocument = require('pdfkit');
const fs = require('fs');

try {
  const doc = new PDFDocument();
  doc.pipe(fs.createWriteStream('test_symbols.pdf'));
  
  // Register Arial fonts
  doc.registerFont('Arial', 'C:\\Windows\\Fonts\\arial.ttf');
  doc.registerFont('Arial-Bold', 'C:\\Windows\\Fonts\\arialbd.ttf');
  
  doc.font('Arial-Bold').fontSize(14);
  doc.text('Currency symbols test:');
  
  doc.font('Arial').fontSize(12);
  doc.text('INR symbol: ₹ 150.00');
  doc.text('USD symbol: $ 150.00');
  doc.text('NPR symbol: रु 150.00');
  
  doc.end();
  console.log('PDF generated successfully with Arial!');
} catch (err) {
  console.error('Error during generation:', err);
}
