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

function buscarUsuarioPeloId(id) {
    let instrucaoSql = `select * from usuario where id = ${id}`
    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}

function atualizarPerfil(idUsuario, nome, senha, imagemPerfil) {
    let instrucaoSql = `UPDATE usuario SET `;
    let campos = [];


    if (nome !== "" && nome !== undefined) {
        campos.push(`nome = '${nickname}'`);
    }
    if (senha !== "" && senha !== undefined) {
        campos.push(`senha = '${senha}'`);
    }
    
    if (imagemPerfil !== "" && imagemPerfil !== undefined) {
        campos.push(`imagemPerfil = '${imagemPerfil}'`);
    }

    if (campos.length == 0) {
        console.log("Nenhum campo foi preenchido para atualização.");
        return Promise.resolve();
    }

    instrucaoSql += campos.join(', ') + ` WHERE id = ${idUsuario};`;

    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}

module.exports = {
    autenticar,
    cadastrar,
    buscarUsuarioPeloId,
    atualizarPerfil
};