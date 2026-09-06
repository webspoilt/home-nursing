/**
 * ==========================================================================
 * Google Sheets Webhook Script for EarthCone Home Nursing
 * ==========================================================================
 * 
 * Follow these 5 quick steps to connect your website to Google Sheets for FREE:
 * 
 * STEP 1: Open Google Sheets (https://sheets.google.com) and create a new blank sheet.
 * 
 * STEP 2: In Row 1, add these exact column headers:
 *   A1: Timestamp
 *   B1: Lead ID
 *   C1: Name
 *   D1: Phone
 *   E1: Email
 *   F1: Service
 *   G1: Duration
 *   H1: Location
 *   I1: Notes
 *   J1: Source
 *   K1: Status
 * 
 * STEP 3: Click on "Extensions" in the top menu -> select "Apps Script".
 * 
 * STEP 4: Delete any code inside Code.gs and paste THIS WHOLE FILE into it.
 * 
 * STEP 5: Click the blue "Deploy" button (top right) -> "New deployment"
 *   - Click the gear icon next to "Select type" -> select "Web app"
 *   - Description: EarthCone Leads Webhook
 *   - Execute as: "Me"
 *   - Who has access: "Anyone" (IMPORTANT!)
 *   - Click "Deploy", then authorize permissions if asked.
 *   - Copy the "Web app URL" provided (it looks like: https://script.google.com/macros/s/AKfycb.../exec).
 * 
 * STEP 6: Add this URL to your Vercel Environment Variables:
 *   Name: GOOGLE_SHEET_WEBHOOK_URL
 *   Value: [Your Web App URL]
 *   (Or paste it directly into server.js and api/leads.js)
 */

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    var doc = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = doc.getActiveSheet();

    var rawData = e.postData ? e.postData.contents : '';
    var data = {};

    if (rawData) {
      try {
        data = JSON.parse(rawData);
      } catch (err) {
        data = e.parameter;
      }
    } else {
      data = e.parameter || {};
    }

    var timestamp = new Date();
    var leadId = data.leadId || ('EC-' + new Date().getTime().toString(36).toUpperCase());
    var name = data.name || 'Website Visitor';
    var phone = data.phone || '';
    var email = data.email || '';
    var service = data.service || 'General Nursing Inquiry';
    var duration = data.duration || '';
    var location = data.location || 'Bengaluru';
    var notes = data.notes || '';
    var source = data.source || 'website';
    var status = 'New';

    sheet.appendRow([
      timestamp,
      leadId,
      name,
      phone,
      email,
      service,
      duration,
      location,
      notes,
      source,
      status
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ 'result': 'success', 'leadId': leadId }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ 'result': 'error', 'error': error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);

  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ 'status': 'EarthCone Google Sheet Webhook is active and running.' }))
    .setMimeType(ContentService.MimeType.JSON);
}
