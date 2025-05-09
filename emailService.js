// Email service configuration
const SERVER_URL = 'http://localhost:3000';

// Function to send confirmation email
async function sendConfirmationEmail(item, recipientEmail) {
  try {
    const response = await fetch(`${SERVER_URL}/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: recipientEmail
      })
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    console.log('Confirmation email sent successfully');
  } catch (error) {
    console.error('Error sending confirmation email:', error);
  }
}

// Function to send stock alert email
async function sendStockAlertEmail(item, recipientEmail) {
  try {
    const response = await fetch(`${SERVER_URL}/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: recipientEmail
      })
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    console.log('Stock alert email sent successfully');
  } catch (error) {
    console.error('Error sending stock alert email:', error);
  }
} 