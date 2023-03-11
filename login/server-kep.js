const express = require('express');
const mysql = require('mysql');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const port = 3000;

// Create a MySQL connection pool
const pool = mysql.createPool({
  connectionLimit: 10,
  host: 'localhost',
  user: 'admin',
  password: '9y9nx9h9czzds',
  database: 'userdata'
});

// Middleware for parsing JSON request bodies
app.use(express.json());

// Route for registering a new user
app.post('/register', (req, res) => {
  const { username, email, password } = req.body;

  // Hash the password using bcrypt
  bcrypt.hash(password, 10, (err, hashedPassword) => {
    if (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
      return;
    }

    // Insert the user's data into the database
    const sql = 'INSERT INTO users (username, email, password) VALUES (?, ?, ?)';
    const values = [username, email, hashedPassword];

    pool.query(sql, values, (err, result) => {
      if (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
        return;
      }

      // Generate a JWT token for the new user
      const token = jwt.sign({ userId: result.insertId }, 'secret');

      res.json({ token });
    });
  });
});

// Route for authenticating a user
app.post('/login', (req, res) => {
  const { email, password } = req.body;

  // Query the database for the user with the given email
  const sql = 'SELECT * FROM users WHERE email = ?';
  const values = [email];

  pool.query(sql, values, (err, result) => {
    if (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
      return;
    }

    // Check if a user was found
    if (result.length === 0) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    // Check if the password is correct
    bcrypt.compare(password, result[0].password, (err, passwordMatches) => {
      if (err || !passwordMatches) {
        res.status(401).json({ error: 'Invalid email or password' });
        return;
      }

      // Generate a JWT token for the authenticated user
      const token = jwt.sign({ userId: result[0].id }, 'secret');

      res.json({ token });
    });
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});