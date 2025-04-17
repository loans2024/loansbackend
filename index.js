require("dotenv").config();
const express = require('express');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const db = require('./db'); // now using SQLite

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Create the "users" table if it doesn't exist
db.run(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fullName TEXT,
    idNumber TEXT,
    username TEXT UNIQUE,
    phone TEXT UNIQUE,
    password TEXT
  )
`, (err) => {
  if (err) console.error('Error creating users table:', err);
  else console.log('Users table is ready.');
});

// Signup endpoint (example)
app.post('/signup', (req, res) => {
  const { fullName, idNumber, username, phone, password } = req.body;
  const hashedPassword = bcrypt.hashSync(password, 10);

  db.run(`
    INSERT INTO users (fullName, idNumber, username, phone, password)
    VALUES (?, ?, ?, ?, ?)
  `, [fullName, idNumber, username, phone, hashedPassword], function (err) {
    if (err) {
      console.error('Signup error:', err);
      return res.status(500).json({ error: 'Signup failed' });
    }
    res.status(201).json({ message: 'User created', userId: this.lastID });
  });
});

// Test route
app.get('/', (req, res) => {
  res.send('Loan Backend API is running.');
});

// Mount M-Pesa routes (assumes mpesa.js is properly set up)
const mpesaRoutes = require('./mpesa');
app.use("/api", mpesaRoutes);

// Callback endpoint for M-Pesa notifications
app.post('/mpesa-callback', (req, res) => {
  console.log('M-Pesa Callback received:', req.body);
  // Process callback here
  res.status(200).json({ message: 'Callback received successfully' });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
