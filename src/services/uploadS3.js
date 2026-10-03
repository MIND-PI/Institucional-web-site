const { PutObjectCommand } = require("@aws-sdk/client-s3");
const s3 = require("../config/s3");

const crypto = require('crypto')
const sharp = require("sharp")

async function uploadS3(file) {

    const buffer = await sharp(file.buffer).resize({height: 500, width: 500, fit: "cover"}).toBuffer()

    const extensao = file.originalname.split('.').pop();

    const nomeArquivo = crypto
      .randomBytes(64)
      .toString('hex');
    const key = `users/${nomeArquivo}.${extensao}`;

    const params = {
        Bucket: process.env.BUCKET_NAME,
        Key: key,
        Body: buffer,
        ContentType: file.mimetype
    }

    const command = new PutObjectCommand(params)

    await s3.send(command)

    return key
}


module.exports = { uploadS3 };