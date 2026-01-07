const sharp = require('sharp');

// takes a Buffer, returns a Buffer
async function compressImage(buffer, maxSizeInKB) {
    let compressedBuffer = buffer;
    let quality = 80;
    do {
        compressedBuffer = await sharp(compressedBuffer)
            .resize(512, 512, { fit: 'cover' }) // optional: resize
            .jpeg({ quality })              // compress JPEG
            .toBuffer();
        quality -= 10;
    } while (compressedBuffer.length > maxSizeInKB * 1024 && quality > 10);

    return compressedBuffer;
}

module.exports = { compressImage };