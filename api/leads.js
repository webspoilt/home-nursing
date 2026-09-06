// Vercel Serverless Function for Fast Lead Capture & Google Sheets Sync
module.exports = async (req, res) => {
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
    const { phone, email, service, source, name, details } = req.body || {};

    if (!phone || phone.replace(/\D/g, '').length < 8) {
      return res.status(400).json({ success: false, message: 'Valid phone number is required.' });
    }

    const leadId = 'EC-' + Date.now().toString(36).toUpperCase();
    const targetNumber = '919931450495';

    // Forward lead to Google Sheets (if Webhook configured)
    const googleSheetUrl = process.env.GOOGLE_SHEET_WEBHOOK_URL;
    if (googleSheetUrl && googleSheetUrl.startsWith('http')) {
      try {
        await fetch(googleSheetUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            leadId,
            name: (name || 'Estimate Lead').trim(),
            phone: phone.trim(),
            email: (email || '').trim(),
            service: service || 'General Nursing Care',
            duration: '',
            location: 'Bengaluru',
            notes: details || '',
            source: source || 'estimate-form'
          })
        });
      } catch (err) {
        console.warn('Google Sheet sync notice:', err.message);
      }
    }

    // Generate WhatsApp direct link
    let waMsg = `*Hello EarthCone Home Nursing!* 💚\n`;
    waMsg += `I just requested an estimate on your website.\n\n`;
    if (name) waMsg += `👤 *Name:* ${name}\n`;
    waMsg += `📞 *Phone:* ${phone.trim()}\n`;
    if (email) waMsg += `✉️ *Email:* ${email.trim()}\n`;
    waMsg += `🩺 *Service:* ${service || 'General Nursing Care'}\n`;
    if (details) waMsg += `📝 *Details:* ${details}\n`;
    waMsg += `\n_Ref ID: ${leadId}_`;
    waMsg += `\n_Please share an estimate and care availability._`;

    const waUrl = `https://wa.me/${targetNumber}?text=${encodeURIComponent(waMsg)}`;

    return res.status(200).json({
      success: true,
      message: 'Lead received and processed.',
      leadId,
      whatsappUrl: waUrl
    });

  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error saving lead.' });
  }
};
