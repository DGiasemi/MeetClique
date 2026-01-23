const express = require('express');
const router = express.Router();
const createUser = require('../../db/User/createUserDb');
const HttpStatusCode = require('http-status-codes');
const { StatusCodes } = HttpStatusCode;
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const { setPrivateKey, decryptPrivateKey } = require('../../cache/authPrivateKeyStorage');

router.post('/', async (req, res) => {
  
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ message: 'Invalid request' });
  }

  const result = await createUser(username, username, email, password, '');

  if (result.code !== StatusCodes.OK) {
    return res.status(result.code).json({
      message: result.result,
    });
  }

  const user = result.result;

  const token = jwt.sign({ user: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

  const privateKeyBuffer = Buffer.from(user.encryptedPrivateKey, 'base64');
  const privateKey = privateKeyBuffer.toString('utf-8');
  const decryptedPrivateKey = decryptPrivateKey(privateKey, password);

  setPrivateKey(user._id, decryptedPrivateKey);

  const userFolder = path.join(process.env.DATA_FOLDER, user._id.toString());
  if (!fs.existsSync(userFolder)) {
    fs.mkdirSync(userFolder, { recursive: true });
  }
  return res.status(201).json({ message: 'User created successfully', token });
});

module.exports = router;