import express from 'express';
import Joi from 'joi';
import User from '../models/User.js';
import { sendEmail } from '../utils/email.js';
import { isDatabaseReady, upsertDemoLead } from '../utils/demoStore.js';

const router = express.Router();

const leadSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  dob: Joi.string().allow('')
});

router.post('/', async (req, res) => {
  try {
    const { value, error } = leadSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.message });

    if (!isDatabaseReady()) {
      const user = upsertDemoLead({ name: value.name, email: value.email, dob: value.dob });
      return res.json({ ok: true, user });
    }

    const user = await User.findOneAndUpdate(
      { email: value.email },
      { $set: { name: value.name, dob: value.dob ? new Date(value.dob) : undefined } },
      { upsert: true, new: true }
    );

    await sendEmail({
      to: value.email,
      subject: 'Your IQ journey is ready',
      html: `<p>Hello ${value.name}, your IQ test journey has begun. Complete the quiz to unlock your report.</p>`
    });

    res.json({ ok: true, user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
