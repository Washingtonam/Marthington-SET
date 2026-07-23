import express from 'express';
import crypto from 'crypto';
import PDFDocument from 'pdfkit';
import User from '../models/User.js';
import { buildPaymentPayload, verifyFlutterwaveSignature } from '../utils/flutterwave.js';
import { sendEmail } from '../utils/email.js';
import { isDatabaseReady, markDemoPayment } from '../utils/demoStore.js';

const router = express.Router();

router.post('/initialize', async (req, res) => {
  try {
    const { email, name, amount = 49, subaccount } = req.body;
    const txRef = `iq-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const payload = buildPaymentPayload({ email, name, amount, txRef, subaccount });
    const response = {
      ok: true,
      txRef,
      paymentLink: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment-success?tx_ref=${txRef}`
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/webhook', async (req, res) => {
  try {
    const signature = req.headers['verif-hash'];
    const rawBody = JSON.stringify(req.body);

    if (!verifyFlutterwaveSignature(rawBody, signature)) {
      return res.status(400).json({ message: 'Invalid signature' });
    }

    const event = req.body;
    const txRef = event?.data?.tx_ref || event?.tx_ref;

    if (!isDatabaseReady()) {
      const user = markDemoPayment({ email: req.body?.data?.customer?.email || req.body?.customer?.email, txRef });
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      return res.json({ ok: true, user });
    }

    const user = await User.findOne({ flutterwaveTxRef: txRef });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.hasPaid = true;
    user.flutterwaveTxRef = txRef;
    await user.save();

    const doc = new PDFDocument();
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', async () => {
      const pdfBuffer = Buffer.concat(chunks);
      const downloadUrl = `https://example.com/certificates/${user._id}.pdf`;
      await sendEmail({
        to: user.email,
        subject: 'Your official IQ certificate is ready',
        html: `<p>Your official IQ certificate is ready. Download it here: <a href="${downloadUrl}">${downloadUrl}</a></p>`
      });
    });

    doc.text(`Official IQ Certificate\nName: ${user.name}\nIQ Score: ${user.iqScore || 'N/A'}`);
    doc.end();

    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
