var database = require("../database/config");

function listarClps(idEmpresa) {
  var instrucaoSql = `
    SELECT
    c.idClp,
    c.nome,
    c.localizacao,
    c.status,
    c.modeloId,
    m.nome AS modelo,
    DATE_FORMAT(c.data_criacao, '%d/%m/%Y') AS data_criacao,
    DATE_FORMAT(c.data_atualizacao, '%d/%m/%Y') AS data_atualizacao
    FROM clp c
    LEFT JOIN modelo m ON m.idModelo = c.modeloId
    WHERE c.empresaId = ${idEmpresa};
        `;
    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}

function listarModelosDisponiveis(idEmpresa){
    var instrucaoSql = `
    SELECT
    m.idmodelo AS idModelo,
    m.nome
    FROM modelo m
    JOIN ativacao a ON a.idFornecedor = m.empresaId
    WHERE a.idCliente = ${idEmpresa}
    AND a.status = 1
    AND m.status = 1
    ORDER BY m.nome;
    `;
    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}

function adicionarClp(nome, localizacao, status, modeloId, empresaId, medicoes) {
    var instrucaoSql = `
    INSERT INTO clp (nome, localizacao, status, modeloId, empresaId)
    VALUES ('${nome}', '${localizacao}', ${status}, ${modeloId}, ${empresaId});
    `;
    console.log("Executando a instrução SQL: \n" + instrucaoSql);

    return database.executar(instrucaoSql).then(function (resultado) {
        var idNovo = resultado.insertId;

        // uma linha para cada medição que o cliente escolheu
        var valores = medicoes.map(function (m) {
            return `(${idNovo}, ${m.tipoMedicaoId}, 1, ${m.parametro})`;
        }).join(", ");

        var instrucaoMedicoes = `
        INSERT INTO clp_medicao (clpId, tipoMedicaoId, status, parametro)
        VALUES ${valores};
        `;
        return database.executar(instrucaoMedicoes);
    });
}

function atualizarClp(idClp, nome, localizacao, status, modeloId, empresaId) {
    var instrucaoSql = `
    UPDATE clp
    SET nome = '${nome}',
        localizacao = '${localizacao}',
        status = ${status},
        modeloId = ${modeloId}
    WHERE idClp = ${idClp}
      AND empresaId = ${empresaId};
    `;
    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}

// Traz todas as medições e mostra uma nova coluna monitorado
// retorna 1 pra monitorado e 0 pra não monitorado
function listarMedicoes(idClp) {
    var instrucaoSql = `
    SELECT
        tm.idTipoMedicao,
        tm.nome,
        tm.apelido,
        tm.unidade_medida,
        cm.parametro,
        IF(cm.status = 1, 1, 0) AS monitorado
    FROM tipo_medicao tm
    LEFT JOIN clp_medicao cm
        ON cm.tipoMedicaoId = tm.idTipoMedicao AND cm.clpId = ${idClp}
    ORDER BY tm.idTipoMedicao;
    `;
    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}

function clpPertenceEmpresa(idClp, idEmpresa) {
    var instrucaoSql = `
    SELECT idClp FROM clp
    WHERE idClp = ${idClp} AND empresaId = ${idEmpresa};
    `;
    return database.executar(instrucaoSql);
}

// ON DUPLICATE KEY evita erro de duplicidade 
// (evita que o usuário tente monitorar algo que já está sendo monitorado)
function salvarMedicao(idClp, tipoMedicaoId, status, parametro) {
    var instrucaoSql = `
    INSERT INTO clp_medicao (clpId, tipoMedicaoId, status, parametro)
    VALUES (${idClp}, ${tipoMedicaoId}, ${status}, ${parametro})
    ON DUPLICATE KEY UPDATE status = VALUES(status), parametro = VALUES(parametro);
    `;
    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}

function listarTiposMedicao(){
    var instrucaoSql = `
    SELECT idTipoMedicao, nome, apelido, unidade_medida
    FROM tipo_medicao
    ORDER BY idTipoMedicao;
    `;
    return database.executar(instrucaoSql);
}


module.exports = {
    listarClps,
    listarModelosDisponiveis,
    adicionarClp,
    atualizarClp,
    listarMedicoes,
    clpPertenceEmpresa,
    salvarMedicao,
    listarTiposMedicao
}