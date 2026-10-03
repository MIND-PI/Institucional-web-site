const { GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const s3 = require("../config/s3");

async function getUrlS3(key) {
    // Criação de comando, pega um novo objeto do bucket s3
    // Na criação do objeto precisa passar o nome do bucket e a key que deseja consultar
    const command = new GetObjectCommand({
        Bucket: process.env.BUCKET_NAME,
        Key: key
    });

    // Cria url pelo cliente s3 e o comando, essa url expira em 3600 segundos, 1 hora
    const url = await getSignedUrl(s3, command, {expiresIn: 3600});

    return url;
}

module.exports = getUrlS3