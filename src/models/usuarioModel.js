var database = require("../database/config");

function autenticar(email, senha) {
    var instrucaoSql = `
        SELECT id, nome, email, nivel
        FROM usuario
        WHERE email = '${email}'
        AND senha = '${senha}';
    `;

    return database.executar(instrucaoSql);
}


function cadastrar(nome, email, senha, codigoAtivacao) {

    var instrucaoSql = `
        INSERT INTO usuario (nome, email, senha, empresa_idempresa) 
        VALUES (
            '${nome}', 
            '${email}', 
            '${senha}', 
            (SELECT idempresa FROM empresa WHERE cod_ativacao = '${codigoAtivacao}')
        );
    `;
    
    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}

module.exports = {
    autenticar,
    cadastrar
};