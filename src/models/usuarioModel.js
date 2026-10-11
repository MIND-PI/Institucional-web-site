var database = require("../database/config");

function autenticar(email, senha) {
    var instrucaoSql = `
        SELECT idUsuario, nome, email, url_img, cargo
        FROM usuario
        WHERE email = '${email}'
        AND senha = '${senha}';
    `;

    return database.executar(instrucaoSql);
}


function cadastrar(nome, email, senha, codigoAtivacao) {

    // Cadastro normal: o usuário SEMPRE entra como funcionário e passa a ter
    // como responsavel o responsável da empresa (usuário com responsavel NULL).
    // O responsável da empresa é cadastrado por outra tela.
    // Não insere nada (affectedRows = 0) se o código de ativação não existir
    // ou se a empresa ainda não tiver um responsável.
    var instrucaoSql = `
        INSERT INTO usuario (nome, email, senha, empresaId, cargo, responsavel)
        SELECT '${nome}', '${email}', '${senha}', e.idEmpresa, 'funcionario', r.idUsuario
        FROM empresa e
        JOIN usuario r ON r.empresaId = e.idEmpresa AND r.responsavel IS NULL
        WHERE e.codigo_ativacao = '${codigoAtivacao}'
        LIMIT 1;
    `;
    
    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}

function buscarUsuarioPeloId(id) {
    let instrucaoSql = `select * from usuario where idUsuario = ${id}`
    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}

function atualizarPerfil(id, nome, senha, imagemPerfil) {
    let instrucaoSql = `UPDATE usuario SET `;
    let campos = [];


    if (nome !== "" && nome !== undefined) {
        campos.push(`nome = '${nome}'`);
    }
    if (senha !== "" && senha !== undefined) {
        campos.push(`senha = '${senha}'`);
    }
    
    if (imagemPerfil !== "" && imagemPerfil !== undefined) {
        campos.push(`url_img = '${imagemPerfil}'`);
    }

    if (campos.length == 0) {
        console.log("Nenhum campo foi preenchido para atualização.");
        return Promise.resolve();
    }

    instrucaoSql += campos.join(', ') + ` WHERE idUsuario = ${id};`;

    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}

module.exports = {
    autenticar,
    cadastrar,
    buscarUsuarioPeloId,
    atualizarPerfil
};