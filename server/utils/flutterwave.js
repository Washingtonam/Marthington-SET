import crypto from 'crypto';

export const FLUTTERWAVE_SECRET_KEY = process.env.FLUTTERWAVE_SECRET_KEY || 'FLWSECK_TEST-...';
export const FLUTTERWAVE_PUBLIC_KEY = process.env.FLUTTERWAVE_PUBLIC_KEY || 'FLWPUBK_TEST-...';

export const buildPaymentPayload = ({ email, name, amount, txRef, subaccount }) => ({
  tx_ref: txRef,
  amount,
  currency: 'USD',
  redirect_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment-success`,
  customer: { email, name },
  payment_options: 'card',
  customizations: {
    title: 'Marthington SET Official Report',
    description: 'Unlock your full IQ report and certificate.'
  },
  subaccounts: subaccount ? [{ id: subaccount }] : []
});

export const verifyFlutterwaveSignature = (payload, signature) => {
  const hash = crypto.createHmac('sha256', FLUTTERWAVE_SECRET_KEY).update(payload).digest('hex');
  return hash === signature;
};
