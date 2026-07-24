import express from 'express';
import crypto from 'crypto';
import PDFDocument from 'pdfkit';
import User from '../models/User.js';
import { buildPaymentPayload, verifyFlutterwaveSignature } from '../utils/flutterwave.js';
import { sendEmail } from '../utils/email.js';
import { isDatabaseReady, markDemoPayment } from '../utils/demoStore.js';
import { buildCertificatePdf } from '../utils/certificate.js';

const router = express.Router();

router.post('/initialize', async (req, res) => {
  try {
    const { email, name, amount = 49, subaccount } = req.body;
    const txRef = `iq-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    buildPaymentPayload({ email, name, amount, txRef, subaccount });
    const frontendOrigin = process.env.FRONTEND_URL || 'http://localhost:5173';
    const response = {
      ok: true,
      txRef,
      paymentLink: `${frontendOrigin}/payment-success?tx_ref=${txRef}&email=${encodeURIComponent(email || '')}`
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/confirm', async (req, res) => {
  try {
    const { txRef, email, name } = req.body;
    if (!txRef) {
      return res.status(400).json({ message: 'Transaction reference is required' });
    }

    const normalizedEmail = (email || '').toLowerCase().trim();
    const backendBaseUrl = process.env.BACKEND_URL || process.env.API_BASE_URL || 'http://127.0.0.1:5000';
    const certificateUrl = `${backendBaseUrl}/api/payments/certificate/${txRef}`;

    if (!isDatabaseReady()) {
      const demoUser = markDemoPayment({
        email: normalizedEmail || `${txRef}@example.com`,
        txRef,
        name: name || normalizedEmail || 'Demo learner',
        certificateUnlocked: true,
        certificateUrl
      });

      const certificateBuffer = await buildCertificatePdf(demoUser);
      const certificateBase64 = certificateBuffer.toString('base64');

      return res.json({
        ok: true,
        certificateUrl,
        certificateBase64,
        user: {
          id: demoUser._id,
          name: demoUser.name,
          email: demoUser.email,
          hasPaid: demoUser.hasPaid,
          certificateUnlocked: demoUser.certificateUnlocked
        }
      });
    }

    const user = await User.findOneAndUpdate(
      normalizedEmail ? { email: normalizedEmail } : { flutterwaveTxRef: txRef },
      {
        $setOnInsert: {
          name: name || normalizedEmail || 'Learner',
          email: normalizedEmail || `${txRef}@example.com`
        },
        $set: {
          hasPaid: true,
          flutterwaveTxRef: txRef,
          certificateUnlocked: true,
          certificateUrl,
          certificateIssuedAt: new Date()
        }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const certificateBuffer = await buildCertificatePdf(user);
    const certificateBase64 = certificateBuffer.toString('base64');

    res.json({
      ok: true,
      certificateUrl,
      certificateBase64,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        hasPaid: user.hasPaid,
        certificateUnlocked: user.certificateUnlocked
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/certificate/:txRef', async (req, res) => {
  try {
    const user = await User.findOne({ flutterwaveTxRef: req.params.txRef });
    if (!user || !user.certificateUnlocked) {
      return res.status(404).json({ message: 'Certificate not found' });
    }

    const pdfBuffer = await buildCertificatePdf(user);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="marthington-certificate-${req.params.txRef}.pdf"`);
    res.send(pdfBuffer);
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
