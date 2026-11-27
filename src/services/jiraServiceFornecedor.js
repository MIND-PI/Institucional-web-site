// Serviço que consulta o Jira de TODOS os clientes ativos de um fornecedor.
//
// Fluxo:
//   1. Busca no banco as configurações Jira (do fornecedor e de cada cliente)
//      usando o jiraConfigModel.buscarJiras.
//   2. Para cada cliente (for), consulta o Jira dele com as credenciais
//      cadastradas (paginação inclusa).
//   3. Conta os CLPs ativos de cada cliente (contarClpsPorEmpresa) e consulta
//      também o Jira do PRÓPRIO fornecedor (chamados escalonados para a equipe).
//   4. Devolve { clientes: [...], fornecedor: {...} } com os chamados de cada
//      cliente e do fornecedor. Os tokens de API ficam somente aqui dentro:
//      nunca saem na resposta.

var jiraConfigModel = require("../models/jiraConfigModel");

// Garante que a URL do Jira tenha protocolo e não termine com "/".
// Ex.: "cliente.atlassian.net/" -> "https://cliente.atlassian.net"
function normalizarUrlJira(url) {

    var urlLimpa = String(url).trim().replace(/\/+$/, "");

    if (!/^https?:\/\//.test(urlLimpa)) {
        urlLimpa = "https://" + urlLimpa;
    }

    return urlLimpa;
}

// Monta o header de autenticação Basic (email:token em base64), padrão da API do Jira.
function montarAutenticacao(email, token) {
    return "Basic " + Buffer.from(`${email}:${token}`).toString("base64");
}

// Consulta os chamados de UMA instância/projeto do Jira, com paginação.
// URL, e-mail, token e chave do projeto vêm do banco (tabelas jira_config e ativacao).
// jqlPersonalizado é opcional: quando informado, substitui o filtro padrão
// (usado para buscar TODOS os chamados do Jira do próprio fornecedor).
async function consultarChamadosJira(urlJira, email, token, chaveProjeto, jqlPersonalizado) {

    var autenticacao = montarAutenticacao(email, token);
    var url = `${normalizarUrlJira(urlJira)}/rest/api/3/search/jql`;

    var chamados = [];
    var nextPageToken = null;

    do {

        var corpo = {
            // Chamados em aberto OU movimentados nos últimos 60 dias
            jql: jqlPersonalizado || `project = ${chaveProjeto} AND (statusCategory != Done OR updated >= -60d) ORDER BY created DESC`,
            maxResults: 100,
            fields: [
                "summary",
                "status",
                "priority",
                "issuetype",
                "created",
                "resolutiondate"
            ],
            // Histórico de mudanças de status (usado no gráfico "Chamados por etapa")
            "expand": "changelog"
        };

        if (nextPageToken) {
            corpo.nextPageToken = nextPageToken;
        }

        var resposta = await fetch(url, {
            method: "POST",
            headers: {
                "Authorization": autenticacao,
                "Accept": "application/json",
                "Content-Type": "application/json"
            },
            body: JSON.stringify(corpo)
        });

        if (!resposta.ok) {
            var erro = await resposta.text();
            throw new Error(`Erro Jira (${resposta.status}): ${erro}`);
        }

        var dados = await resposta.json();

        chamados = chamados.concat(dados.issues || []);
        nextPageToken = dados.nextPageToken || null;

    } while (nextPageToken);

    return chamados;
}

// Extrai do chamado bruto apenas os campos que a dashboard usa.
function resumirChamado(chamado) {

    // Histórico de mudanças de status, em ordem cronológica.
    var historicoStatus = (chamado.changelog?.histories || [])
        .flatMap(function (h) {
            return h.items
                .filter(function (item) { return item.field === "status"; })
                .map(function (item) {
                    return {
                        data: h.created,
                        de: item.fromString,
                        para: item.toString
                    };
                });
        })
        .sort(function (a, b) { return new Date(a.data) - new Date(b.data); });

    return {
        chave: chamado.key,
        resumo: chamado.fields.summary,
        status: chamado.fields.status?.name,
        prioridade: chamado.fields.priority?.name,
        tipo: chamado.fields.issuetype?.name,
        criadoEm: chamado.fields.created,
        resolvidoEm: chamado.fields.resolutiondate,
        historico: historicoStatus
    };
}

// Consulta o Jira de todos os clientes ativos do fornecedor.
// idEmpresa é o id do FORNECEDOR logado (vem do sessionStorage na tela).
async function consultarJiraFornecedor(idEmpresa) {

    // 1. Configurações no banco: uma linha por cliente ativo,
    //    com as credenciais do fornecedor (jf) e do cliente (jc).
    var linhas = await jiraConfigModel.buscarJiras(idEmpresa);

    if (!linhas || linhas.length === 0) {
        // Fornecedor sem clientes ativos com Jira configurado
        return [];
    }

    var clientes = [];

    // 2. Um pedido ao Jira de cada cliente.
    //    Se o Jira de um cliente falhar, os demais continuam funcionando.
    for (const linha of linhas) {

        // Quantidade de CLPs ativos do cliente (jiraConfigModel.contarClpsPorEmpresa),
        // usada pela dashboard no cálculo de "alertas por CLP".
        var totalClps = 0;

        try {
            var contagem = await jiraConfigModel.contarClpsPorEmpresa(linha.idEmpresa);
            totalClps = contagem && contagem[0] ? Number(contagem[0].total) : 0;
        } catch (erroClps) {
            console.error(`Erro ao contar os CLPs do cliente ${linha.cliente}:`, erroClps.message);
        }

        try {

            // A chave do projeto do cliente fica na tabela ativacao
            // (no cadastro do cliente o jira_config.chave_projeto fica nulo).
            if (!linha.chave_projeto_cliente) {
                throw new Error("Cliente sem chave de projeto configurada.");
            }

            var chamadosBrutos = await consultarChamadosJira(
                linha.url_jira_cliente,
                linha.email_cliente,
                linha.token_cliente,
                linha.chave_projeto_cliente
            );

            var chamados = chamadosBrutos.map(resumirChamado);

            clientes.push({
                idCliente: linha.idEmpresa,
                cliente: linha.cliente,
                chaveProjeto: linha.chave_projeto_cliente,
                totalClps: totalClps,
                totalChamados: chamados.length,
                chamados: chamados
            });

        } catch (erro) {
            console.error(`Erro ao consultar o Jira do cliente ${linha.cliente}:`, erro.message);

            clientes.push({
                idCliente: linha.idEmpresa,
                cliente: linha.cliente,
                chaveProjeto: linha.chave_projeto_cliente,
                totalClps: totalClps,
                erro: "Não foi possível consultar o Jira deste cliente."
            });
        }
    }

    // 3. Chamados do Jira do PRÓPRIO fornecedor (escalonamentos da equipe).
    //    As credenciais do fornecedor (jf) são as mesmas em todas as linhas.
    var fornecedor = null;

    try {
        var linhaFornecedor = linhas[0];

        if (linhaFornecedor.url_jira_fornecedor && linhaFornecedor.chave_projeto_fornecedor) {

            // Sem filtro de data: a dashboard usa TODOS os chamados do fornecedor
            // para calcular os escalonados abertos e o tempo médio de resposta.
            var jqlFornecedor = `project = ${linhaFornecedor.chave_projeto_fornecedor} ORDER BY created DESC`;

            var chamadosFornecedor = (await consultarChamadosJira(
                linhaFornecedor.url_jira_fornecedor,
                linhaFornecedor.email_fornecedor,
                linhaFornecedor.token_fornecedor,
                linhaFornecedor.chave_projeto_fornecedor,
                jqlFornecedor
            )).map(resumirChamado);

            fornecedor = {
                chaveProjeto: linhaFornecedor.chave_projeto_fornecedor,
                totalChamados: chamadosFornecedor.length,
                chamados: chamadosFornecedor
            };
        }
    } catch (erro) {
        console.error("Erro ao consultar o Jira do fornecedor:", erro.message);
    }

    return { clientes: clientes, fornecedor: fornecedor };
}

module.exports = {
    consultarJiraFornecedor
};
