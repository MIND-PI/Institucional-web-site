// Cadastro da configuração de integração com o Jira (uma por empresa).

// Importa a conexão com o banco MySQL.
var database = require("../database/config");

function cadastrar(empresaId, urlJira, emailApi, tokenApi, chaveProjeto) {

    var instrucaoSql = `
        INSERT INTO jira_config (empresaId, url_jira, email_api, token_api, chave_projeto)
        VALUES (${empresaId}, '${urlJira}', '${emailApi}', '${tokenApi}', '${chaveProjeto}');
    `;

    // O log omite a instrução completa para não expor o token nem a chave.
    console.log("Executando a instrução SQL: \n INSERT INTO jira_config (...) [token oculto no log]");
    return database.executar(instrucaoSql);
}

function buscarJiras(empresaId) {

    var instrucaoSql = `
            SELECT cli.idEmpresa,
        cli.nome_fantasia   AS cliente,
        a.chave_projeto_cliente,
        jc.url_jira         AS url_jira_cliente,
        jc.email_api        AS email_cliente,
        jc.token_api        AS token_cliente,
        jf.chave_projeto    AS chave_projeto_fornecedor,
        jf.url_jira         AS url_jira_fornecedor,
        jf.email_api        AS email_fornecedor,
        jf.token_api        AS token_fornecedor
    FROM ativacao a
    JOIN empresa cli    ON cli.idEmpresa = a.idCliente
    JOIN jira_config jc ON jc.empresaId  = a.idCliente
    JOIN jira_config jf ON jf.empresaId  = a.idFornecedor
    WHERE a.idFornecedor = ${empresaId}
    AND a.status = 1
    AND jc.status = 1
    AND jf.status = 1;    `;

    // O log omite a instrução completa para não expor o token nem a chave.
    console.log("Executando a instrução SQL: \n SELECT FROM jira_config (...)");
    return database.executar(instrucaoSql);
}

function contarClpsPorEmpresa(idEmpresa) {
    var instrucaoSql = `
    SELECT COUNT(*) AS total
    FROM clp
    WHERE empresaId = ${Number(idEmpresa)} AND status = 1;`;
    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}

module.exports = {
    cadastrar,
    buscarJiras,
    contarClpsPorEmpresa
};
