const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const adminUsername = process.env.ADMIN_USERNAME;
const adminPassword = process.env.ADMIN_PASSWORD;
const jwtSecret = process.env.JWT_SECRET;

const hashPassword = bcrypt.hashSync(adminPassword, 10);

exports.login = (req, res) => {
  const { username, password } = req.body;

  if (username === adminUsername && bcrypt.compareSync(password, hashPassword)) {
    const token = jwt.sign({ username: adminUsername }, jwtSecret, { expiresIn: '1h' });
    return res.json({ token });
  }

  return res.status(401).send('Invalid credentials');
};
