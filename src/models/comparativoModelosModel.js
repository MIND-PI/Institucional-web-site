var database = require("../database/config");

// Empresa do usuário logado e o tipo dela (fornecedor ou cliente).
// O controller valida que idUsuario é um número inteiro antes de chamar.
function buscarUsuarioEmpresa(idUsuario) {
    var instrucaoSql = `
        SELECT u.idUsuario, u.empresaId, e.tipo
        FROM usuario u
        JOIN empresa e ON e.idEmpresa = u.empresaId
        WHERE u.idUsuario = ${idUsuario};
    `;

    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}

// Modelos do fornecedor: o JSON do ETL só traz o id do modelo, o nome vem daqui.
function listarModelos(idEmpresa) {
    var instrucaoSql = `
        SELECT idmodelo AS idModelo, nome
        FROM modelo
        WHERE empresaId = ${idEmpresa};
    `;

    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}

module.exports = {
    buscarUsuarioEmpresa,
    listarModelos
};
