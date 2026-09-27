var database = require("../database/config");

function autenticar(cnpj, codigo_ativacao) {
    var instrucaoSql = `
        SELECT idEmpresa, nome_fantasia, razao_social, cnpj, codigo_ativacao
        FROM empresa
        WHERE codigo_ativacao = '${codigo_ativacao}' AND cnpj = '${cnpj}';
    `;

    return database.executar(instrucaoSql);
}


function cadastrar(nome_fantasia, razao_social, cnpj, codigo_ativacao) {

    var instrucaoSql = `
        INSERT INTO empresa (nome_fantasia, razao_social, cnpj, codigo_ativacao) 
        VALUES (
            '${nome_fantasia}',
            '${razao_social}',  
            '${cnpj}', 
            '${codigo_ativacao}'
        );
    `;
    
    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}

function buscarEmpresaPeloId(idEmpresa) {
    let instrucaoSql = `select * from empresa where idEmpresa = ${idEmpresa}`
    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}

function atualizarPerfil(idEmpresa, nome_fantasia, razao_social, ) {
    let instrucaoSql = `UPDATE empresa SET `;
    let campos = [];


    if (nome_fantasia !== "" && nome_fantasia !== undefined) {
        campos.push(`nome_fantasia = '${nome_fantasia}'`);
    }
    if (razao_social !== "" && razao_social !== undefined) {
        campos.push(`razao_social = '${razao_social}'`);
    }
    

    if (campos.length == 0) {
        console.log("Nenhum campo foi preenchido para atualização.");
        return Promise.resolve();
    }

    instrucaoSql += campos.join(', ') + ` WHERE idEmpresa = ${idEmpresa};`;

    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}

module.exports = {
    autenticar,
    cadastrar,
    buscarEmpresaPeloId,
    atualizarPerfil
};