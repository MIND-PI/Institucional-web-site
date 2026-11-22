// ===== MODEL: sabe ONDE estão os dados (aqui, o JSON do Gold no S3) =====
const { GetObjectCommand } = require("@aws-sdk/client-s3");

// Cliente do S3 que o projeto JÁ usa (o mesmo do upload e das URLs de foto de perfil):
// região e credenciais ficam configuradas só em config/s3.js
const s3 = require("../config/s3");

// período da tela -> subpasta que o Gold usa ("agora" não tem subpasta)
const SUBPASTA = {
    "agora": "",
    "7-dias": "7-dias",
    "30-dias": "30-dias",
};

const PERIODOS_VALIDOS = Object.keys(SUBPASTA);

async function buscarUltimoResultado(idEmpresa, periodo) {
    // monta o caminho: gold/id-empresa-4/clp-macro/7-dias/ultimo-resultado.json
    const partes = ["gold", `id-empresa-${idEmpresa}`, "clp-macro", SUBPASTA[periodo], "ultimo-resultado.json"];
    const caminho = partes.filter(Boolean).join("/");    // filter(Boolean) remove a subpasta vazia do "agora"

    try {
        const resposta = await s3.send(
            new GetObjectCommand({ Bucket: process.env.BUCKET_NAME, Key: caminho })
        );
        const texto = await resposta.Body.transformToString();   // conteúdo do arquivo como texto
        return JSON.parse(texto);                                // texto -> objeto JavaScript
    } catch (erro) {
        if (erro.name === "NoSuchKey") {
            // Obs.: sem a permissão s3:ListBucket, o S3 devolve "AccessDenied" (e não NoSuchKey) para arquivo inexistente
            return null;      // o Gold ainda não gerou esse arquivo
        }
        throw erro;           // outro erro (permissão, rede...): deixa o controller tratar
    }
}

module.exports = { buscarUltimoResultado, PERIODOS_VALIDOS };
