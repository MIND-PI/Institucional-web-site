// cadastro do FORNECEDOR


// Importa o módulo nativo crypto do Node.js,
// utilizado para gerar o código de ativação com 6 bytes aleatórios,
// convertidos para hexadecimal e letras maiúsculas.

var database = require("../database/config");
const crypto = require("crypto");

function autenticar(email, senha) {
    //  verifica se os dados de usuário estão cadastrados
    var instrucaoSql = `
        SELECT idUsuario, nome, email, url_img, cargo, empresaId, tipo
        FROM usuario u
        JOIN empresa em ON em.idEmpresa = u.empresaId
        WHERE email = '${email}'
        AND senha = '${senha}';
    `;

    return database.executar(instrucaoSql);
}

function cadastrar(nome, email, senha, codigoAtivacao, idFornecedor) {

    // Verifica se o cadastro está sendo realizado por meio de um link enviado por um fornecedor.
    // Caso exista um idFornecedor, adiciona uma condição SQL para permitir que o código
    // de ativação seja utilizado somente por uma empresa cliente vinculada a esse fornecedor
    // na tabela ativacao. Caso contrário, não aplica esse filtro.
    
    var filtroVinculoFornecedor = idFornecedor
        ? `AND e.idEmpresa IN (SELECT idCliente FROM ativacao WHERE idFornecedor = ${Number(idFornecedor)})`
        : "";

    var instrucaoSql = `
        INSERT INTO usuario (nome, email, senha, empresaId, cargo, responsavel)
        SELECT '${nome}', '${email}', '${senha}', e.idEmpresa,
               IF(r.idUsuario IS NULL, 'administrador', 'funcionario'),
               r.idUsuario
        FROM empresa e
        LEFT JOIN usuario r ON r.empresaId = e.idEmpresa AND r.responsavel IS NULL
        WHERE e.codigo_ativacao = '${codigoAtivacao}' ${filtroVinculoFornecedor}
        LIMIT 1;
    `;

    // Cadastra um novo usuário na empresa que possui o código de ativação informado.
    // Verifica se já existe um usuário principal na empresa (responsavel IS NULL).
    // Se não existir, o novo usuário recebe o cargo de administrador.
    // Caso exista, recebe o cargo de funcionário e é vinculado ao usuário principal
    // como seu responsável.
    
    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}

async function cadastrarEmpresa(nomeFantasia, razaoSocial, cnpj, nome, email, senha) {
    // gera o código aleatório onde cada byte é dois caracteres hexadecimais 
    var codigo = crypto.randomBytes(6).toString("hex").toUpperCase();

    var empresa = await database.executar(`
        INSERT INTO empresa (nome_fantasia, razao_social, cnpj, tipo, codigo_ativacao)
        VALUES ('${nomeFantasia}', '${razaoSocial}', '${cnpj}', '${"fornecedor"}', '${codigo}');
    `);

    try {
        // Só chega aqui depois que a consulta anterior retorna seu resultado.

        // Primeiro usuário da empresa: administrador e responsável (responsavel NULL)
        return await database.executar(`
            INSERT INTO usuario (nome, email, senha, empresaId, cargo, responsavel)
            VALUES ('${nome}', '${email}', '${senha}', ${empresa.insertId}, 'administrador', NULL);
        `);
    } catch (erro) {
        // Se o usuário falhar (email repetido, por exemplo), não deixa a empresa órfã
        await database.executar(`DELETE FROM empresa WHERE idEmpresa = ${empresa.insertId};`);
        throw erro;
    }
}

function buscarUsuarioPeloId(id) {
    let instrucaoSql = `select * from usuario where idUsuario = ${id}`
    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);

}

function atualizarPerfil(id, nome, senha, imagemPerfil) {
    // atualiza o perfil com base nos parametros
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
    cadastrarEmpresa,
    buscarUsuarioPeloId,
    atualizarPerfil
};