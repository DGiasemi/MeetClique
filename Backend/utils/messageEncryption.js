const crypto = require("crypto");

function encryptMessage(content, userKey) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", userKey, iv);

  const encrypted = Buffer.concat([
    cipher.update(content, "utf8"),
    cipher.final()
  ]);

  const tag = cipher.getAuthTag();

  return {
    iv,
    ciphertext: encrypted,
    tag
  };
}

function decryptMessage(encryptedBuffer, userKey) {
const iv = encryptedBuffer.subarray(0, 12);
const ciphertext = encryptedBuffer.subarray(12, encryptedBuffer.length - 16);
const tag = encryptedBuffer.subarray(encryptedBuffer.length - 16);

  const decipher = crypto.createDecipheriv("aes-256-gcm", userKey, iv);
  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final()
  ]);

  return decrypted.toString("utf8");
}

function getHmacIndex(content, key, bytes = 8) {
  const stopwords = new Set([
    "the", "and", "a", "an", "of", "to", "in", "on", "for", "at", "by", "with", "is", "it", "this", "that"
  ]);

  const words = content
    .toLowerCase()
    .replace(/[^\w\s]/g, '')     // Remove punctuation
    .split(/\s+/)                // Split by space
    .filter(word => word.length > 2 && !stopwords.has(word));

  const hmacs = words.map(word => {
    const full = crypto.createHmac("sha256", key).update(word).digest(); // full = 32 bytes
    return full.subarray(0, bytes); // Truncate to first 8 bytes
  });

  return hmacs;
}

function encryptHmac(word, key, bytes = 8) {
  const cleaned = word.toLowerCase().replace(/[^\w]/g, ''); // Optional cleanup
  const fullHmac = crypto.createHmac("sha256", key).update(cleaned).digest();
  return fullHmac.subarray(0, bytes);
}

module.exports = {
  encryptMessage,
  decryptMessage,
  getHmacIndex,
  encryptHmac
};