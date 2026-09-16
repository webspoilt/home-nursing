// Vercel Serverless Function for Lead Intake, Google Sheets Sync & WhatsApp formulation
module.exports = async (req, res) => {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, phone, email, service, duration, location, notes, source } = req.body || {};

    if (!phone || phone.replace(/\D/g, '').length < 8) {
      return res.status(400).json({ success: false, message: 'Valid Phone number is required.' });
    }

    const leadId = 'EC-' + Date.now().toString(36).toUpperCase();
    const targetNumber = '919931450495';

    // ── 1. Asynchronously forward lead to Google Sheets (Webhook) ──
    const googleSheetUrl = process.env.GOOGLE_SHEET_WEBHOOK_URL || 'https://script.google.com/macros/s/AKfycbw4E1alIwDGS1dhuPaSZuXy-B3CL_zYX6Bp882Q-VHdXPRfmDPEPjOJZKOvvCB5Uq5ydw/exec';
    if (googleSheetUrl && googleSheetUrl.startsWith('http')) {
      try {
        await fetch(googleSheetUrl, {
          method: 'POST',
          redirect: 'follow',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            leadId,
            name: (name || 'Website Visitor').trim(),
            phone: phone.trim(),
            email: (email || '').trim(),
            service: service || 'General Nursing Inquiry',
            duration: duration || '',
            location: location || 'Bengaluru',
            notes: notes || '',
            source: source || 'inquiry-form'
          })
        });
      } catch (err) {
        console.warn('Google Sheet sync notice:', err.message);
      }
    }

    // ── 2. Formulate WhatsApp Message ──
    let waMessage = `*Hello EarthCone Home Nursing, I would like to book a service:*\n\n`;
    waMessage += `👤 *Name:* ${(name || 'Customer').trim()}\n`;
    waMessage += `📞 *Contact Phone:* ${phone.trim()}\n`;
    if (email) waMessage += `✉️ *Email:* ${email.trim()}\n`;
    waMessage += `🩺 *Service Required:* ${service || 'General Inquiries'}\n`;
    if (duration) waMessage += `⏱️ *Shift / Duration:* ${duration}\n`;
    waMessage += `📍 *Location in Bengaluru:* ${location || 'Bengaluru'}\n`;
    if (notes && notes.trim() !== '') waMessage += `📝 *Patient Notes:* ${notes.trim()}\n`;
    waMessage += `\n_Reference ID: ${leadId}_`;

    const encodedMessage = encodeURIComponent(waMessage);
    const waUrl = `https://wa.me/${targetNumber}?text=${encodedMessage}`;

    return res.status(200).json({
      success: true,
      leadId,
      whatsappUrl: waUrl
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error processing request.' });
  }
};
