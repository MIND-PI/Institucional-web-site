// Cadastro da configuração de integração com o Jira (uma por empresa).

// Importa a conexão com o banco MySQL.
var database = require("../database/config");

function cadastrar(empresaId, urlJira, emailApi, tokenApi, chaveProjeto) {

    var instrucaoSql = `
        INSERT INTO jira_config (empresaId, url_jira, email_api, token_api, chave_projeto)
        VALUES (${empresaId}, '${urlJira}', '${emailApi}', SHA2('${tokenApi}', 256), '${chaveProjeto}');
    `;

    // O log omite a instrução completa para não expor o token nem a chave.
    console.log("Executando a instrução SQL: \n INSERT INTO jira_config (...) [token oculto no log]");
    return database.executar(instrucaoSql);
}

module.exports = {
    cadastrar
};
