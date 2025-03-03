// index.js
const express = require('express');
const bcrypt = require('bcryptjs');
const cors = require('cors'); // Import CORS
const pool = require('./db');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors()); // Enable CORS
app.use(express.json()); // Parse JSON bodies

// Create the "users" table if it doesn't exist
pool.query(`
  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    fullName VARCHAR(255),
    idNumber VARCHAR(50),
    username VARCHAR(50) UNIQUE,
    phone VARCHAR(20) UNIQUE,
    password VARCHAR(255)
  );
`, (err, result) => {
  if (err) {
    console.error('Error creating users table:', err);
  } else {
    console.log('Users table is ready.');
  }
});

// Signup endpoint
app.post('/signup', async (req, res) => {
  const { fullName, idNumber, username, phone, password } = req.body;
  if (!fullName || !idNumber || !username || !phone || !password) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }
  try {
    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Insert the new user into the database
    const result = await pool.query(
      'INSERT INTO users (fullName, idNumber, username, phone, password) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [fullName, idNumber, username, phone, hashedPassword]
    );
    res.status(201).json({ message: 'User created successfully', user: result.rows[0] });
  } catch (err) {
    console.error(err);
    if (err.code === '23505') { // Unique violation
      return res.status(400).json({ error: 'Username or phone already exists.' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login endpoint
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Missing username or password.' });
  }
  try {
    // Find the user by username
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'User not found.' });
    }
    const user = result.rows[0];
    
    // Compare the provided password with the hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid password.' });
    }
    res.status(200).json({ message: 'Login successful', user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// A test route
app.get('/', (req, res) => {
  res.send('Loan Backend API is running.');
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

