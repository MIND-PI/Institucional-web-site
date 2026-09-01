var database = require("../database/config");

function autenticar(email, senha) {
    var instrucaoSql = `
        SELECT id, nome, email, nivel, id_superior
        FROM usuario
        WHERE email = '${email}'
        AND senha = '${senha}';
    `;

    return database.executar(instrucaoSql);
}

function cadastrar(nome, email, senha, nivel, idSuperior) {

    var idSuperiorSql;

    if (idSuperior == null) {
        idSuperiorSql = "NULL";
    } else {
        idSuperiorSql = idSuperior;
    }

    var instrucaoSql = `
        INSERT INTO usuario (
            nome,
            email,
            senha,
            nivel,
            id_superior
        )
        VALUES (
            '${nome}',
            '${email}',
            '${senha}',
            ${nivel},
            ${idSuperiorSql}
        );
    `;

    console.log(instrucaoSql);

    return database.executar(instrucaoSql);
}

module.exports = {
    autenticar,
    cadastrar
};