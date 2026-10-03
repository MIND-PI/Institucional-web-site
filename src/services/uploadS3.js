const { PutObjectCommand } = require("@aws-sdk/client-s3");
const s3 = require("../config/s3");

const crypto = require('crypto')
const sharp = require("sharp")

async function uploadS3(file) {

    // Cria um novo buffer com sharp, para conseguir mudar as dimensões da imagem para padrão de foto de perfil
    // Cover serve para centralizar no meio da foto cortando partes não centrais
    // Por fim, transforma a imagem em um buffer novamente
    const buffer = await sharp(file.buffer).resize({height: 500, width: 500, fit: "cover"}).toBuffer()

    // Remove ultimo . do file, para pegar a extensão exata
    const extensao = file.originalname.split('.').pop();

    // Cria uma criptografia que vai ser o nome do arquivo
    // Utilizado para não sobreescrever imagens no bucket
    const nomeArquivo = crypto
      .randomBytes(64)
      .toString('hex');

    //   Criação da key, vamos estar enviando no prefixo /users do bucket com o nome criptografado e extensão
    const key = `users/${nomeArquivo}.${extensao}`;

    // Parametros para envio da imagem
    const params = {
        Bucket: process.env.BUCKET_NAME,
        Key: key,
        Body: buffer,
        ContentType: file.mimetype
    }

    // Criação do novo objeto no bucket
    const command = new PutObjectCommand(params)

    // Envio para o bucket do novo objeto
    await s3.send(command)

    return key
}


module.exports = uploadS3;