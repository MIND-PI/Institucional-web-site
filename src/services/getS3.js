const { GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const s3 = require("../config/s3");

async function getUrlS3(key) {

    const command = new GetObjectCommand({
        Bucket: process.env.BUCKET_NAME,
        Key: key
    });

    const url = await getSignedUrl(s3, command, {expiresIn: 3600});

    return url;
}

module.exports = getUrlS3