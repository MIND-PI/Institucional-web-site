const { GetObjectCommand, S3Client, NoSuchKey, S3ServiceException, paginateListObjectsV2, ListObjectsV2Command } = require("@aws-sdk/client-s3");
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
    const url = await getSignedUrl(s3, command, { expiresIn: 3600 });

    return url;
}

// Utilizar para pegar o json em especifico
async function getObject(key) {
    const client = new S3Client({});

    try {

        // Esse é a respose, ela envia um new getOjectCommand, ele precisa da key(Chave exata do json) e do bucket
        // https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/javascript_s3_code_examples.html procurar pelo GetObject
        const response = await client.send(
            new GetObjectCommand({
                Bucket: process.env.BUCKET_NAME_ETL,
                Key: key,
            }),
        );

        // Pegamos a resposta no body, ela vem em sting
        const str = await response.Body.transformToString();

        // Retornarmos essa resposta em json
        return JSON.parse(str)
    } catch (caught) {
        // Validações da documentação da aws sdk
        if (caught instanceof NoSuchKey) {
            console.error(
                `Error from S3 while getting object "${key}" from "${process.env.BUCKET_NAME_ETL}". No such key exists.`,
            );
        } else if (caught instanceof S3ServiceException) {
            console.error(
                `Error from S3 while getting object from ${bucketName}.  ${caught.name}: ${caught.message}`,
            );
        } else {
            throw caught;
        }
        return null
    }
}

// Pegar a key do objeto mais recente
async function getMostRecentObject(key) {
    const client = new S3Client({});

    // Esse é o comando utilizado para pegar todos os objetos com o prefixo colocado
    // https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/client/s3/command/ListObjectsV2Command/
    const command = new ListObjectsV2Command({
        Bucket: process.env.BUCKET_NAME_ETL,
        Prefix: key
    });

    // Resposta desse comando
    const response = await client.send(command);

    // Do comando ele dá um array de json de respostas, nessas respostas tem os "Contents", dentro dele tem o conteúdo que vamos precisar
    // como o lastmodified ou a key em si, utilizamos na função getObject para pegar o json. Porém, esse contents está em um array
    // precisamos iterar sobre ele para validar a ultima requisição
    let content = response["Contents"]

    // Se não tiver resposta no contents encerra função e retorna null (Tratar no controller)
    if (!content) {
        return null
    }

    // Pega o primeiro json do content
    let last = content[0]

    // Nesse loop validamos a ultima data
    content.forEach((i) => {
        let actualDate = new Date(i["LastModified"])
        if (actualDate > new Date(last["LastModified"])) {
            last = i
        }
    })

    return last
};

module.exports = {
    getUrlS3,
    getObject,
    getMostRecentObject
}