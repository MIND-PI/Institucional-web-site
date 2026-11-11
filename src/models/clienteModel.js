// cadastro de CLIENTE

// Importa o módulo nativo crypto do Node.js,
// utilizado para gerar o código de ativação com 6 bytes aleatórios,
// convertidos para hexadecimal e letras maiúsculas.

var database = require("../database/config");
const crypto = require("crypto");

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

    // Verifica se existem informações da empresa para atualizar.
    if (campos.length > 0) {
         
    var instrucaoSql = `
    UPDATE empresa
    SET 
    ${campos.join(", ")}
    WHERE idEmpresa = ${idCliente} AND idEmpresa IN (SELECT idCliente FROM ativacao WHERE idFornecedor = ${idEmpresa});
    `;
        // Atualiza os dados da empresa.
        // A subconsulta verifica se o cliente pertence ao fornecedor que
        // está realizando a alteração, impedindo que ele modifique
        // informações de empresas vinculadas a outros fornecedores.

        // Aguarda a atualização dos dados da empresa terminar
        // antes de continuar a execução da função.
    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    await database.executar(instrucaoSql);
    }

    // Verifica se o fornecedor também solicitou uma alteração no status.
    // Essa informação fica na tabela ativacao, e não na tabela empresa.

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
    
    // verifica se a empresa existe pelo cnpj
     let existente = await database.executar(`
        SELECT idEmpresa FROM empresa WHERE cnpj = '${cnpj}';
    `);
    
    // se a empresa não estiver cadastrada
    let empresaNova = existente.length === 0;
    
    // Se a empresa ainda não estiver cadastrada,
    // realiza seu cadastro na tabela empresa.
    if (empresaNova) {
        await database.executar(`
            INSERT INTO empresa (nome_fantasia, setor, cnpj, tipo)
            VALUES ('${nome_fantasia}', '${setor}', '${cnpj}', 'cliente fornecedor');
        `)
    }

    // Cria o vínculo entre o fornecedor e o cliente na tabela ativacao.
    // O idEmpresa recebido identifica o fornecedor que está cadastrando
    // o cliente, enquanto o SELECT busca o ID do cliente pelo CNPJ.

    await database.executar(`
        INSERT INTO ativacao (idFornecedor, idCliente)
        SELECT ${idEmpresa}, idEmpresa FROM empresa WHERE cnpj = '${cnpj}';
    `);

     // Se a empresa já existia no banco, encerra o cadastro sem gerar
    // outro código de ativação, retornando que ela não é uma empresa nova.
    if (!empresaNova) {
        return { empresaNova: false, codigo: null }
    }

     // Como a empresa é nova, consulta seu ID e seu código de ativação
    // para utilizar essas informações nas próximas etapas.
    let busca = await database.executar(`
        SELECT idEmpresa, codigo_ativacao FROM empresa WHERE cnpj = '${cnpj}';
    `)

        // valor do código da empresa 
        let codigo = busca[0].codigo_ativacao
        
        // Se a empresa ainda não possuir um código de ativação,
        // gera 6 bytes aleatórios, convertidos em 12 caracteres hexadecimais
        // em letras maiúsculas, e armazena o código no banco.

         if (!codigo) {
        codigo = crypto.randomBytes(6).toString("hex").toUpperCase()

        await database.executar(`
            UPDATE empresa SET codigo_ativacao = '${codigo}'
            WHERE idEmpresa = ${busca[0].idEmpresa}
        `)
        }
        
          return { 
            empresaNova: true,
            codigo,
            idEmpresa: busca[0].idEmpresa };

            // Retorna os dados necessários para as próximas etapas do cadastro,
            // incluindo a informação de que a empresa é nova, seu código de ativação
            // e seu ID no banco de dados.
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