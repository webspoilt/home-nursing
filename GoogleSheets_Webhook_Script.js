/**
 * ==========================================================================
 * Google Sheets Webhook Script for EarthCone Home Nursing
 * (Supports Both Leads & Visitor Analytics In Separate Tabs!)
 * ==========================================================================
 * 
 * Your Spreadsheet will automatically maintain 2 separate tabs:
 *   1. "Leads" -> Customer Name, Phone, Email, Service, Location, Notes
 *   2. "Visitors" -> Real-time Visitor IP, Location/City, Referrer, Page, Timestamp
 */

function getOrCreateSheet(doc, sheetName, headers) {
  var sheet = doc.getSheetByName(sheetName);
  if (!sheet) {
    sheet = doc.insertSheet(sheetName);
    sheet.appendRow(headers);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#0d9488").setFontColor("#ffffff");
  }
  return sheet;
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    var doc = SpreadsheetApp.getActiveSpreadsheet();

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

    // ── Route 1: Visitor Traffic & IP Analytics ──
    if (data.type === 'visit') {
      var visitHeaders = ["Timestamp", "IP Address", "Location / City", "Coordinates", "Page", "Traffic Source", "Screen Size", "Device / User Agent"];
      var visitSheet = getOrCreateSheet(doc, "Visitors", visitHeaders);

      visitSheet.appendRow([
        timestamp,
        data.ip || 'Unknown',
        data.city || 'Bengaluru',
        data.coordinates || '',
        data.page || '/',
        data.referrer || 'Direct',
        data.screen || '',
        data.userAgent || ''
      ]);

      return ContentService
        .createTextOutput(JSON.stringify({ 'result': 'visit_logged' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // ── Route 2: Sales Leads & Quote Inquiries ──
    var leadHeaders = ["Timestamp", "Lead ID", "Name", "Phone", "Email", "Service", "Duration", "Location", "Notes", "Source", "Status"];
    var leadsSheet = getOrCreateSheet(doc, "Leads", leadHeaders);

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

    leadsSheet.appendRow([
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
    .createTextOutput(JSON.stringify({ 'status': 'EarthCone Google Sheet Webhook is active and running with Leads & Visitor Analytics tabs.' }))
    .setMimeType(ContentService.MimeType.JSON);
}
