var database = require("../database/config");

function listar(idUsuario, busca) {
    // remove aspas e barra invertida do texto da busca
    var buscaLimpa = busca.replace(/['\\]/g, "");

    // responsavel NULL = responsável da empresa (primeiro usuário), aparece primeiro.
    // souResponsavel = 1 quando quem está vendo a tela é o responsável (o front usa para
    // decidir se mostra editar/remover nos outros administradores).
    var instrucaoSql = `
        SELECT idUsuario, nome, email, cargo, responsavel, url_img,
            (SELECT responsavel IS NULL FROM usuario WHERE idUsuario = ${idUsuario}) AS souResponsavel
        FROM usuario
        WHERE empresaId = (SELECT empresaId FROM usuario WHERE idUsuario = ${idUsuario})
        AND nome LIKE '%${buscaLimpa}%'
        ORDER BY responsavel IS NOT NULL, cargo, nome;
    `;

    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}

function buscarCodigo(idUsuario) {
    var instrucaoSql = `
        SELECT e.codigo_ativacao
        FROM empresa e
        JOIN usuario u ON u.empresaId = e.idEmpresa
        WHERE u.idUsuario = ${idUsuario};
    `;

    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}

// dados que o controller precisa para validar as permissões
function buscarUsuario(idUsuario) {
    var instrucaoSql = `
        SELECT idUsuario, empresaId, cargo, responsavel
        FROM usuario
        WHERE idUsuario = ${idUsuario};
    `;

    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}

function editar(idMembro, nome, cargo) {
    // escapa barra invertida e aspas do nome (o cargo já foi validado no controller)
    var nomeLimpo = nome.trim().replace(/\\/g, "\\\\").replace(/'/g, "''");

    // responsavel IS NOT NULL: segurança extra, a conta do responsável nunca é editada
    var instrucaoSql = `
        UPDATE usuario
        SET nome = '${nomeLimpo}', cargo = '${cargo}'
        WHERE idUsuario = ${idMembro}
        AND responsavel IS NOT NULL;
    `;

    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}

function remover(idMembro) {
    // responsavel IS NOT NULL: segurança extra, o responsável nunca é removido
    var instrucaoSql = `
        DELETE FROM usuario
        WHERE idUsuario = ${idMembro}
        AND responsavel IS NOT NULL;
    `;

    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}

module.exports = {
    listar,
    buscarCodigo,
    buscarUsuario,
    editar,
    remover
};