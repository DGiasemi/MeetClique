const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { getUserByUsername } = require('../../db/User/getUserDb');
const { setPrivateKey, decryptPrivateKey } = require('../../cache/authPrivateKeyStorage');

router.post('/', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Invalid request' });
  }

  const result = await getUserByUsername(username);
  if (result.code !== 200) {
    return res.status(result.code).json({ message: result.result });
  }
  const user = result.result;

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  const privateKeyBuffer = Buffer.from(user.encryptedPrivateKey, 'base64');
  const privateKey = privateKeyBuffer.toString('utf-8');
  const decryptedPrivateKey = decryptPrivateKey(privateKey, password);

  setPrivateKey(user._id, decryptedPrivateKey);

  const token = jwt.sign({ user: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
  res.status(200).json({ token });
});

module.exports = router;