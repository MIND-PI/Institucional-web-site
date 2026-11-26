// Cadastro da configuração de integração com o Jira (uma por empresa).

// Importa a conexão com o banco MySQL.
var database = require("../database/config");

/*
O token de API é uma credencial sensível e é cifrado pelo próprio MySQL
com AES_ENCRYPT. A chave vem da variável de ambiente JIRA_TOKEN_SECRET.
O valor é armazenado em HEX(AES_ENCRYPT(token, segredo)) na coluna token_api,
e poderá ser recuperado no futuro com AES_DECRYPT(UNHEX(token_api), segredo).
*/
function cadastrar(empresaId, urlJira, emailApi, tokenApi, chaveProjeto) {
    var segredo = process.env.JIRA_TOKEN_SECRET;

    if (!segredo) {
        return Promise.reject(
            new Error("A variável de ambiente JIRA_TOKEN_SECRET não foi configurada.")
        );
    }

    var instrucaoSql = `
        INSERT INTO jira_config (empresaId, url_jira, email_api, token_api, chave_projeto)
        VALUES (${empresaId}, '${urlJira}', '${emailApi}', HEX(AES_ENCRYPT('${tokenApi}', '${segredo}')), '${chaveProjeto}');
    `;

    // O log omite a instrução completa para não expor o token nem a chave.
    console.log("Executando a instrução SQL: \n INSERT INTO jira_config (...) [token oculto no log]");
    return database.executar(instrucaoSql);
}

module.exports = {
    cadastrar
};
