// db.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// This stores your DB in a file called loans.db (in project folder)
const db = new sqlite3.Database(path.resolve(__dirname, 'loans.db'), (err) => {
  if (err) console.error('Failed to connect to SQLite DB:', err);
  else console.log('Connected to SQLite database');
});

module.exports = db;

