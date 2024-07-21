const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const streamRoutes = require('./routes/streamRoutes');
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/auth', authRoutes);
app.use('/stream', streamRoutes);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'stream.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});



module.exports = app;
