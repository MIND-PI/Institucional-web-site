var database = require("../database/config");

function listarCliente(idEmpresa) {

    var instrucaoSql = `
    SELECT 
        e.idEmpresa as idCliente,
        e.nome_fantasia as nome,
        e.setor,
        e.cnpj,
        e.data_criacao,
        a.status
    FROM empresa e
    JOIN ativacao a ON a.idCliente = e.idEmpresa
    WHERE a.idFornecedor = ${idEmpresa};
    `;

    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}

async function atualizarCliente(nome_fantasia, setor, status, idCliente, idEmpresa) {

    let campos = []

    if (nome_fantasia != null && nome_fantasia.trim().length !== 0) {
        campos.push(`nome_fantasia = '${nome_fantasia}'`)
    }

    if(setor != null && setor.trim().length !== 0){
        campos.push(`setor = '${setor}'`)
    }
    
    let temStatus = status !== null && status !== undefined && status !== "" && [0, 1].includes(Number(status))

    if (campos.length == 0 && !temStatus){
        console.log("Nenhum campo foi preenchido para atualização.");
        return {};
    }

    if (campos.length > 0) {
    var instrucaoSql = `
    UPDATE empresa
    SET 
    ${campos.join(", ")}
    WHERE idEmpresa = ${idCliente} AND idEmpresa IN (SELECT idCliente FROM ativacao WHERE idFornecedor = ${idEmpresa});
    `;

    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    await database.executar(instrucaoSql);
    }

    if(temStatus){
        var instrucaoSql2 = `
        UPDATE ativacao
        SET status = ${Number(status)} WHERE idFornecedor = ${idEmpresa} AND idCliente = ${idCliente};
        `;

        console.log("Executando a instrução SQL: \n" + instrucaoSql2);
        await database.executar(instrucaoSql2);
    }

    return {};
}


async function cadastrarCliente(nome_fantasia, setor, cnpj, idEmpresa) {

    // cria a empresa, se o CNPJ já existe, não faz nada e não dá erro

     await database.executar(`
        INSERT INTO empresa (nome_fantasia, setor, cnpj, tipo)
        VALUES ('${nome_fantasia}', '${setor}', '${cnpj}', 'cliente fornecedor')
        ON DUPLICATE KEY UPDATE idEmpresa = idEmpresa;
    `);
    
    // faz o insert buscando o id da empresa pelo CNPJ
    return database.executar(`
        INSERT INTO ativacao (idFornecedor, idCliente)
        SELECT ${idEmpresa}, idEmpresa FROM empresa WHERE cnpj = '${cnpj}';
    `);
}

function inativarCliente(idEmpresa, idCliente) {

    var instrucaoSql = `
    UPDATE ativacao 
    SET status = 0
    WHERE idFornecedor = ${idEmpresa}
    AND idCliente = ${idCliente}
    `;

    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}

module.exports = {
    listarCliente,
    atualizarCliente,
    cadastrarCliente,
    inativarCliente
};