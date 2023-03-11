const mysql = require('mysql2/promise');
const express = require('express');
const cors = require('cors');

const app = express();

const table_name = "users";

// Enable CORS
app.use(cors());
app.use(express.json())

async function connectToDatabase() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'admin',
    password: '9y9nx9h9czzds',
    database: 'userdata'
    });

  const [table_check] = await connection.execute(`
    SHOW TABLES LIKE '${table_name}'
  `);

  console.log(table_check)

  const createTableQuery = `
    CREATE TABLE ${table_name} (
      id INT(11) NOT NULL AUTO_INCREMENT,
      username VARCHAR(255) NOT NULL,
      password VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      PRIMARY KEY (id)
    )
  `;

  console.log("table length : ?", [table_check.length]);
  if (table_check.length === 1){
    console.log("there is already one table, skip it");
  } else {
    console.log("there is no table, we need create one");
    const [table_create] = await connection.execute( createTableQuery );
  }

  return connection;
}

// Handle login request
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  // Connect to database
  const connection = await connectToDatabase();

  // Check if username and password are valid
  const [rows] = await connection.execute(
    'SELECT * FROM ? WHERE username = ? AND password = ?',
    [table_name, username, password]
  );

  if (rows.length === 1) {
    // Successful login
    res.json({ username: rows[0].username });
  } else {
    // Failed login
    res.status(401).json({ error: 'Invalid username or password' });
  }

  // Close database connection
  connection.end();
});

// Handle registration request
app.post('/api/register', async (req, res) => {
  const { username, password, email } = req.body;

  console.log("enter api/register");

  // Connect to database
  const connection = await connectToDatabase();

  // Check if username is already taken
  const [rows] = await connection.execute(
    'SELECT * FROM ? WHERE username = ?',
    [table_name, username]
  );

  if (rows.length === 1) {
    // Username already taken
    res.status(409).json({ error: 'Username already taken' });
  } else {
    // Add new user to database
    await connection.execute(
      'INSERT INTO ? (username, password, email) VALUES (?, ?, ?)',
      [table_name, username, password, email]
    );

    // Successful registration
    res.json({ username });
  }

  // Close database connection
  connection.end();
});

const nodemailer = require('nodemailer');

// Handle forgot username request
app.post('/api/forgot-username', async (req, res) => {
  const { email } = req.body;

  console.log("enter api/forgot-username");

  // Connect to database
  const connection = await connectToDatabase();

  // Check if email address is valid
  const [rows] = await connection.execute(
    'SELECT * FROM ? WHERE email = ?',
    [table_name, email]
  );

  if (rows.length === 1) {
    // Send email with username
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'myemail@gmail.com',
        pass: 'mypassword'
      }
    });

    const mailOptions = {
      from: 'myemail@gmail.com',
      to: email,
      subject: 'Forgot username',
      text: `Your username is: ${rows[0].username}`
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to send email' });
      } else {
        console.log(`Email sent: ${info.response}`);
        res.json({ message: 'Username sent to email' });
      }
    });
  } else {
    // Invalid email address
    res.status(404).json({ error: 'Email address not found' });
  }

  // Close database connection
  connection.end();
});

// Handle forgot password request
app.post('/api/forgot-password', async (req, res) => {
  const { username, email } = req.body;

  console.log("enter api/forgot-password");

  // Connect to database
  const connection = await connectToDatabase();

  // Check if username and email address are valid
  const [rows] = await connection.execute(
    'SELECT * FROM ? WHERE username = ? AND email = ?',
    [table_name, username, email]
  );

  if (rows.length === 1) {
    // Generate new password
    const newPassword = Math.random().toString(36).slice(-8);

    // Update user's password in database
    await connection.execute(
      'UPDATE ? SET password = ? WHERE username = ?',
      [table_name, newPassword, username]
    );

    // Send email with new password
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'myemail@gmail.com',
        pass: 'mypassword'
      }
    });

    const mailOptions = {
      from: 'myemail@gmail.com',
      to: email,
      subject: 'Forgot password',
      text: `Your new password is: ${newPassword}`
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to send email' });
      } else {
        console.log(`Email sent: ${info.response}`);
        res.json({ message: 'New password sent to email' });
      }
    });
  } else {
    // Invalid username or email address
    res.status(404).json({ error: 'Username or email address not found' });
  }

  // Close database connection
  connection.end();
});        

// Start server
const PORT = process.env.PORT || 3000;
console.log("enable cors");
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
