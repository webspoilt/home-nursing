const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, 'earthcone.db');
let db = null;

async function initDatabase() {
  const SQL = await initSqlJs();

  // Load existing database or create new
  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  // Create tables
  db.run(`
    CREATE TABLE IF NOT EXISTS leads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT NOT NULL,
      email TEXT DEFAULT '',
      service TEXT DEFAULT 'General Inquiry',
      source TEXT DEFAULT 'website',
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      status TEXT DEFAULT 'new',
      notes TEXT DEFAULT ''
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS inquiries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      service TEXT DEFAULT 'General Inquiry',
      duration TEXT DEFAULT '',
      location TEXT DEFAULT 'Bengaluru',
      notes TEXT DEFAULT '',
      source TEXT DEFAULT 'form',
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      status TEXT DEFAULT 'new'
    )
  `);

  save();
  console.log('💾 SQLite database initialized at', DB_PATH);
  return db;
}

function save() {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  }
}

function insertLead({ phone, email, service, source }) {
  db.run(
    `INSERT INTO leads (phone, email, service, source) VALUES (?, ?, ?, ?)`,
    [phone, email || '', service || 'General Inquiry', source || 'website']
  );
  save();
  const result = db.exec(`SELECT last_insert_rowid() as id`);
  return result[0].values[0][0];
}

function insertInquiry({ name, phone, service, duration, location, notes, source }) {
  db.run(
    `INSERT INTO inquiries (name, phone, service, duration, location, notes, source) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [name, phone, service || 'General Inquiry', duration || '', location || 'Bengaluru', notes || '', source || 'form']
  );
  save();
  const result = db.exec(`SELECT last_insert_rowid() as id`);
  return result[0].values[0][0];
}

function getAllLeads() {
  const result = db.exec(`SELECT * FROM leads ORDER BY created_at DESC`);
  if (!result.length) return [];
  return result[0].values.map(row => {
    const obj = {};
    result[0].columns.forEach((col, i) => { obj[col] = row[i]; });
    return obj;
  });
}

function getAllInquiries() {
  const result = db.exec(`SELECT * FROM inquiries ORDER BY created_at DESC`);
  if (!result.length) return [];
  return result[0].values.map(row => {
    const obj = {};
    result[0].columns.forEach((col, i) => { obj[col] = row[i]; });
    return obj;
  });
}

function getLeadCount() {
  const r = db.exec(`SELECT COUNT(*) as count FROM leads`);
  return r.length ? r[0].values[0][0] : 0;
}

function getInquiryCount() {
  const r = db.exec(`SELECT COUNT(*) as count FROM inquiries`);
  return r.length ? r[0].values[0][0] : 0;
}

module.exports = {
  initDatabase,
  insertLead,
  insertInquiry,
  getAllLeads,
  getAllInquiries,
  getLeadCount,
  getInquiryCount
};
