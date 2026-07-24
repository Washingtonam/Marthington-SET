import PDFDocument from 'pdfkit';

export async function buildCertificatePdf(user = {}) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(24).text('Marthington Self-Evaluation Certificate', { align: 'center' });
    doc.moveDown(1.5);
    doc.fontSize(16).text('This certifies that', { align: 'center' });
    doc.moveDown(0.8);
    doc.fontSize(24).text(user.name || 'Learner', { align: 'center' });
    doc.moveDown(0.8);
    doc.fontSize(14).text('has successfully completed the Marthington assessment and unlocked premium insight.', { align: 'center' });
    doc.moveDown(1.2);
    doc.fontSize(12).text(`Email: ${user.email || 'N/A'}`);
    doc.text(`IQ Score: ${user.iqScore || 'N/A'}`);
    doc.text(`Issued: ${new Date().toLocaleDateString()}`);
    doc.end();
  });
}
