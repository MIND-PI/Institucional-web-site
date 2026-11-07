var database = require("../database/config");

function listarClps(idEmpresa) {
    var instrucaoSql = `
    SELECT
    c.idClp,
    c.nome,
    c.localizacao,
    c.status,
    c.modeloId,
    m.nome AS modelo,
    DATE_FORMAT(c.data_criacao, '%d/%m/%Y') AS data_criacao,
    DATE_FORMAT(c.data_atualizacao, '%d/%m/%Y') AS data_atualizacao
    FROM clp c
    LEFT JOIN modelo m ON m.idModelo = c.modeloId
    WHERE c.empresaId = ${idEmpresa};
        `;
    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}

function listarClpPorId(idClp) {
    var instrucaoSql = `
    SELECT
        c.nome nome_clp,
        m.nome nome_modelo,
        c.mac_address,
        c.status,
        c.localizacao
    FROM clp c
    JOIN modelo m ON m.idModelo = c.modeloId
    WHERE c.idClp = ${idClp};
        `;
    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}

module.exports = {
    listarClps,
    listarClpPorId
}