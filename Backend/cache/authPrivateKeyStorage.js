const crypto = require('crypto');

const privateKeyMap = new Map();

function encryptContent(content, publicKey) {
    const bufferContent = Buffer.from(content, 'utf8');
    const encryptedContent = crypto.publicEncrypt(publicKey, bufferContent);
    return encryptedContent.toString('base64');
}

function decryptContent(encryptedContent, privateKey) {
    const bufferContent = Buffer.from(encryptedContent, 'base64');
    const decryptedContent = crypto.privateDecrypt(privateKey, bufferContent);
    return decryptedContent.toString('base64');
}

function setPrivateKey(userid, privateKey) {
    privateKeyMap.set(String(userid), privateKey);
}

function getPrivateKey(userid) {
    return privateKeyMap.get(String(userid));
}

function removePrivateKey(userid) {
    privateKeyMap.delete(userid);
}

function decryptPrivateKey(encryptedPrivateKey, password) {
  const privateKeyObject = crypto.createPrivateKey({
    key: encryptedPrivateKey,
    format: 'pem',
    passphrase: password,
  });

  return privateKeyObject.export({
    format: 'pem',
    type: 'pkcs8',
  });
}

module.exports = {
    setPrivateKey,
    getPrivateKey,
    removePrivateKey,
    decryptPrivateKey,
    encryptContent,
    decryptContent
};