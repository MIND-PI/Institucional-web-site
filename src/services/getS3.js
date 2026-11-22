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

// Lê um JSON da camada gold, que fica no bucket dos DADOS (SCRIPT_BUCKET_NAME),
// diferente do bucket das imagens (BUCKET_NAME).
// Devolve null quando o arquivo ainda não existe.
async function getJsonS3(key) {
    try {
        const resposta = await s3.send(new GetObjectCommand({
            Bucket: process.env.SCRIPT_BUCKET_NAME,
            Key: key
        }));
        const texto = await resposta.Body.transformToString();
        return JSON.parse(texto);
    } catch (erro) {
        if (erro.name === "NoSuchKey") {
            return null;
        }
        throw erro;
    }
}

module.exports = getUrlS3
module.exports.getJsonS3 = getJsonS3;