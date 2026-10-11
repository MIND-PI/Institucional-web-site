var database = require("../database/config");

function listar(idUsuario, busca) {
    // remove aspas e barra invertida do texto da busca
    var buscaLimpa = busca.replace(/['\\]/g, "");

    var instrucaoSql = `
        SELECT idUsuario, nome, email, cargo, responsavel,
            (SELECT cargo FROM usuario WHERE idUsuario = ${idUsuario}) AS cargoLogado
        FROM usuario
        WHERE empresaId = (SELECT empresaId FROM usuario WHERE idUsuario = ${idUsuario})
        AND nome LIKE '%${buscaLimpa}%'
        ORDER BY responsavel IS NOT NULL, cargo, nome;
    `;

    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}

function buscarCodigo(idUsuario) {
    var instrucaoSql = `
        SELECT e.codigo_ativacao
        FROM empresa e
        JOIN usuario u ON u.empresaId = e.idEmpresa
        WHERE u.idUsuario = ${idUsuario};
    `;

    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}

function buscarUsuario(idUsuario) {
    var instrucaoSql = `
        SELECT idUsuario, empresaId, cargo, responsavel
        FROM usuario
        WHERE idUsuario = ${idUsuario};
    `;

    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}

function remover(idMembro) {
    var instrucaoSql = `
        DELETE FROM usuario
        WHERE idUsuario = ${idMembro}
        AND responsavel IS NOT NULL;
    `;

    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}

module.exports = {
    listar,
    buscarCodigo,
    buscarUsuario,
    remover
};