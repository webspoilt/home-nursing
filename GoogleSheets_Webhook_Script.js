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
  try {
    var doc = SpreadsheetApp.getActiveSpreadsheet();
    var leadsSheet = doc.getSheetByName("Leads");
    var visitorsSheet = doc.getSheetByName("Visitors");

    var leadsData = [];
    if (leadsSheet) {
      var leadValues = leadsSheet.getDataRange().getValues();
      if (leadValues.length > 1) {
        var headers = leadValues[0];
        for (var i = 1; i < leadValues.length; i++) {
          var row = leadValues[i];
          var leadObj = {};
          for (var j = 0; j < headers.length; j++) {
            leadObj[headers[j].toString().trim()] = row[j];
          }
          leadsData.push(leadObj);
        }
      }
    }

    var visitorsData = [];
    if (visitorsSheet) {
      var visitorValues = visitorsSheet.getDataRange().getValues();
      if (visitorValues.length > 1) {
        var vHeaders = visitorValues[0];
        for (var k = Math.max(1, visitorValues.length - 100); k < visitorValues.length; k++) {
          var vRow = visitorValues[k];
          var vObj = {};
          for (var m = 0; m < vHeaders.length; m++) {
            vObj[vHeaders[m].toString().trim()] = vRow[m];
          }
          visitorsData.push(vObj);
        }
      }
    }

    return ContentService
      .createTextOutput(JSON.stringify({
        status: 'success',
        spreadsheetName: doc.getName(),
        totalLeads: leadsData.length,
        totalVisitors: visitorsData.length,
        leads: leadsData.reverse(),
        visitors: visitorsData.reverse()
      }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
