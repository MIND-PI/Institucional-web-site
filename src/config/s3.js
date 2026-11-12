const { S3Client } = require('@aws-sdk/client-s3');

// Criando cliente s3
const client = new S3Client({
    region: process.env.BUCKET_REGION
});

module.exports = client;