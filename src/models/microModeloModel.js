var database = require("../database/config");

// Todos os ids chegam já validados como número no controller.

function buscarModelo(idModelo) {
    var instrucaoSql = `
    SELECT idmodelo AS idModelo, nome
    FROM modelo
    WHERE idmodelo = ${Number(idModelo)};`;
    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}

function contarClps(idModelo) {
    var instrucaoSql = `
    SELECT COUNT(*) AS total
    FROM clp
    WHERE modeloId = ${Number(idModelo)} AND status = 1;`;
    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}

function buscarClps(idsClp, idModelo) {
    if (idsClp.length == 0) {
        return Promise.resolve([]);
    }
    var instrucaoSql = `
    SELECT c.idClp, c.nome, c.empresaId, l.nome AS localizacao
    FROM clp c
    LEFT JOIN localizacao l ON l.idLocalizacao = c.localizacaoId
    WHERE c.modeloId = ${Number(idModelo)}
    AND c.idClp IN (${idsClp.map(Number).join(",")});`;
    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}

function buscarEmpresas(idsEmpresa) {
    if (idsEmpresa.length == 0) {
        return Promise.resolve([]);
    }
    // SELECT * de propósito: o controller escolhe a coluna de nome que existir
    var instrucaoSql = `
    SELECT * FROM empresa
    WHERE idEmpresa IN (${idsEmpresa.map(Number).join(",")});`;
    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}

module.exports = {
    buscarModelo,
    contarClps,
    buscarClps,
    buscarEmpresas
};