require("dotenv").config();
const express = require('express');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const db = require('./db'); // SQLite connection

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

// Signup route with UNIQUE constraint error handling
app.post('/signup', (req, res) => {
  const { fullName, idNumber, username, phone, password } = req.body;
  const hashedPassword = bcrypt.hashSync(password, 10);

  db.run(`
    INSERT INTO users (fullName, idNumber, username, phone, password)
    VALUES (?, ?, ?, ?, ?)
  `, [fullName, idNumber, username, phone, hashedPassword], function (err) {
    if (err) {
      console.error('Signup error:', err);

      // Handle duplicate username or phone number
      if (err.code === 'SQLITE_CONSTRAINT') {
        let errorMessage = 'Signup failed';
        if (err.message.includes('users.username')) {
          errorMessage = 'Username already taken.';
        } else if (err.message.includes('users.phone')) {
          errorMessage = 'Phone number already used.';
        }
        return res.status(400).json({ error: errorMessage });
      }

      return res.status(500).json({ error: 'Internal server error' });
    }

    res.status(201).json({ message: 'User created', userId: this.lastID });
  });
});

// Login route
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
    if (err) {
      console.error('Login error:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }

    if (!user) {
      return res.status(400).json({ error: 'Invalid username or password.' });
    }

    const isPasswordCorrect = bcrypt.compareSync(password, user.password);

    if (!isPasswordCorrect) {
      return res.status(400).json({ error: 'Invalid username or password.' });
    }

    res.status(200).json({ message: 'Login successful', userId: user.id });
  });
});

// Test route
app.get('/', (req, res) => {
  res.send('Loan Backend API is running.');
});

// M-Pesa routes
const mpesaRoutes = require('./mpesa');
app.use("/api", mpesaRoutes);

// M-Pesa callback route
app.post('/mpesa-callback', (req, res) => {
  console.log('M-Pesa Callback received:', req.body);
  res.status(200).json({ message: 'Callback received successfully' });
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

