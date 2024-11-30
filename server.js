const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const mysql = require('mysql2');

const app = express();
const PORT = 3000;
const SECRET_KEY = 'your_jwt_secret';

// MySQL Database Connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root', // Your MySQL username
    password: 'prateek261103', // Your MySQL password
    database: 'ProjectPrajay'
});

db.connect(err => {
    if (err) {
        console.error('Error connecting to the database:', err);
        process.exit(1);
    }
    console.log('Connected to the MySQL database');
});

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Middleware to authenticate token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Get token from the 'Authorization' header

    if (!token) return res.status(401).json({ success: false, message: 'Token missing' });

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.status(403).json({ success: false, message: 'Invalid token' });

        req.userId = user.id; // Attach user ID to request object
        console.log(`Authenticated user ID: ${req.userId}`);  // Debug log
        next();
    });
};

// Sign-Up Route
app.post('/signup', (req, res) => {
    const { username, password } = req.body;
    const hashedPassword = bcrypt.hashSync(password, 10);

    const query = 'INSERT INTO userAccount (username, password) VALUES (?, ?)';
    db.query(query, [username, hashedPassword], (err, results) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ success: false, message: 'Username already exists' });
            }
            console.error('Database error:', err);
            return res.status(500).json({ success: false, message: 'Database error' });
        }
        res.json({ success: true });
    });
});

// Login Route

app.post('/login', (req, res) => {
    const { username, password } = req.body;

    const query = 'SELECT * FROM userAccount WHERE username = ?';
    db.query(query, [username], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ success: false, message: 'Database error' });
        }

        if (results.length === 0) {
            return res.status(400).json({ success: false, message: 'Invalid username or password' });
        }

        const user = results[0];
        const passwordMatch = bcrypt.compareSync(password, user.password);

        if (passwordMatch) {
            const token = jwt.sign({ id: user.id, username: user.username }, SECRET_KEY, { expiresIn: '1h' });
            res.json({ success: true, token, userId: user.id });  // Return userId (primary key id)
        } else {
            res.status(400).json({ success: false, message: 'Invalid username or password' });
        }
    });
});


// Bill Calculation Route
app.post('/calculate-bill', authenticateToken, (req, res) => {
    const { name, units, rate } = req.body;
    const total = units * rate;

    const query = 'INSERT INTO bills (user_id, name, units, rate, total) VALUES (?, ?, ?, ?, ?)';
    db.query(query, [req.userId, name, units, rate, total], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ success: false, message: 'Database error' });
        }
        res.json({ success: true, billId: results.insertId, total });
    });
});

// Payment Route (Update bill status to "Paid")
app.post('/pay-bill', authenticateToken, (req, res) => {
    const { billId } = req.body;

    const query = 'UPDATE bills SET status = "Paid" WHERE id = ?';
    db.query(query, [billId], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ success: false, message: 'Database error' });
        }
        if (results.affectedRows === 0) {
            return res.status(400).json({ success: false, message: 'Bill not found' });
        }
        res.json({ success: true, message: 'Payment successful' });
    });
});

// Fetch User Bills Route
app.get('/bills/:userId', authenticateToken, (req, res) => {
    const userId = req.params.userId;
    console.log(`Requested User ID: ${userId}`);
    console.log(`Authenticated User ID: ${req.userId}`);

    if (req.userId != userId) {
        return res.status(403).json({ success: false, message: 'Access forbidden' });
    }

    //const query = 'SELECT * FROM bills WHERE user_id = ?';
    const query = 'SELECT * FROM bills WHERE user_id = ? AND status = "Pending"';

    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ success: false, message: 'Database error' });
        }
        res.json({ success: true, bills: results });
    });
});

// Fetch User Bills Route
app.get('/allbills/:userId', authenticateToken, (req, res) => {
    const userId = req.params.userId;
    console.log(`Requested User ID: ${userId}`);
    console.log(`Authenticated User ID: ${req.userId}`);

    if (req.userId != userId) {
        return res.status(403).json({ success: false, message: 'Access forbidden' });
    }

    //const query = 'SELECT * FROM bills WHERE user_id = ?';
    const query = 'SELECT * FROM bills WHERE user_id = ?';

    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ success: false, message: 'Database error' });
        }
        res.json({ success: true, bills: results });
    });
});
// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
