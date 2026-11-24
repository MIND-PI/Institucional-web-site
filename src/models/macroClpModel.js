// ===== MODEL: lê o JSON do Gold no S3 usando o serviço padrão do projeto =====
const getS3 = require("../services/getS3");

// período da tela -> subpasta que o Gold usa ("agora" não tem subpasta)
const SUBPASTA = {
    "agora": "",
    "7-dias": "7-dias",
    "30-dias": "30-dias",
};

const PERIODOS_VALIDOS = Object.keys(SUBPASTA);

async function buscarUltimoResultado(idEmpresa, periodo) {
    // Monta o caminho: gold/id-empresa-4/clp-macro/7-dias/ultimo-resultado.json
    const partes = ["gold", `id-empresa-${idEmpresa}`, "clp-macro", SUBPASTA[periodo], "ultimo-resultado.json"];
    const caminho = partes.filter(Boolean).join("/");

    // getS3.getObject já busca em process.env.BUCKET_NAME_ETL e retorna null se o arquivo não existir
    return await getS3.getObject(caminho);
}

module.exports = { buscarUltimoResultado, PERIODOS_VALIDOS };
