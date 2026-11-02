var database = require("../database/config");

function listarModelos(idEmpresa) {

    var instrucaoSql = `
    SELECT 
        mo.nome,
        mo.status,
        mo.idModelo,
        mo.data_criacao,
        mo.data_atualizacao
    FROM empresa em
    JOIN modelo mo ON mo.empresaId = em.idEmpresa
    WHERE em.idEmpresa = ${idEmpresa};
    `;

    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}

function atualizarModelo(nome, idModelo, status) {

    let campos = []

    if (nome != null && nome.trim().length !== 0) {
        campos.push(`nome = '${nome}'`)
    }

    if (status != null) {
        campos.push(`status = ${status}`)
    }

    if (campos.length == 0) {
        console.log("Nenhum campo foi preenchido para atualização.");
        return Promise.resolve({});
    }

    var instrucaoSql = `
    UPDATE modelo
    SET 
        ${campos.join(", ")}
    WHERE idModelo = ${idModelo};
    `;

    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}


function cadastrarModelo(nome, idEmpresa) {

    var instrucaoSql = `
    INSERT INTO modelo (nome, empresaId)
    VALUE ('${nome}', ${idEmpresa})
    `;

    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}

function deletarModelo(idModelo) {

    var instrucaoSql = `
    DELETE FROM modelo 
    WHERE idModelo = ${idModelo}
    `;

    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}

module.exports = {
    listarModelos,
    atualizarModelo,
    cadastrarModelo,
    deletarModelo
};