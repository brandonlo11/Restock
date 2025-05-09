const express = require('express');
const cors = require('cors');
const sgMail = require('@sendgrid/mail');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Email sending endpoint
app.post('/send-email', async (req, res) => {
  try {
    const { to } = req.body;

    const msg = {
      to,
      from: 'thelegendarypanda11@gmail.com',
      subject: 'Stock Alert Confirmation',
      text: 'You have successfully set up a stock alert. You will receive an email when the product is back in stock.',
      html: '<strong>You have successfully set up a stock alert. You will receive an email when the product is back in stock.</strong>'
    };

    await sgMail.send(msg);
    console.log('Email sent successfully to:', to);
    res.status(200).json({ message: 'Email sent successfully' });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', sendgrid: !!process.env.SENDGRID_API_KEY });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log('Environment:', {
    NODE_ENV: process.env.NODE_ENV,
    SENDGRID_API_KEY: process.env.SENDGRID_API_KEY ? 'Set' : 'Not set'
  });
}); 