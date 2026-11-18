
var jiraUrl = process.env.JIRA_URL;
var jiraEmail = process.env.JIRA_EMAIL;
var jiraToken = process.env.JIRA_API_TOKEN;
var projectKey = process.env.JIRA_PROJECT_KEY;

async function consultarJira() {

    if (!jiraUrl || !jiraEmail || !jiraToken || !projectKey) {
        throw new Error("As variáveis de ambiente do Jira não foram configuradas.");
    }

    var autenticacao = Buffer
        .from(`${jiraEmail}:${jiraToken}`)
        .toString("base64");

    var chamados = [];
    var nextPageToken = null;

    do {

        var corpo = {
            jql: `project = ${projectKey} ORDER BY created DESC`,
            maxResults: 100,
            fields: [
                "summary",
                "status",
                "priority",
                "issuetype",
                "created",
                "resolutiondate"
            ]
        };

        if (nextPageToken) {
            corpo.nextPageToken = nextPageToken;
        }

        var resposta = await fetch(
            `${jiraUrl.replace(/\/+$/, "")}/rest/api/3/search/jql`,
            {
                method: "POST",
                headers: {
                    "Authorization": `Basic ${autenticacao}`,
                    "Accept": "application/json",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(corpo)
            }
        );

        if (!resposta.ok) {
            var erro = await resposta.text();
            throw new Error(`Erro Jira (${resposta.status}): ${erro}`);
        }

        var dados = await resposta.json();

        chamados = chamados.concat(dados.issues || []);
        nextPageToken = dados.nextPageToken || null;

    } while (nextPageToken);

    return chamados.map(function (chamado) {
        return {
            chave: chamado.key,
            resumo: chamado.fields.summary,
            status: chamado.fields.status?.name,
            prioridade: chamado.fields.priority?.name,
            tipo: chamado.fields.issuetype?.name,
            criadoEm: chamado.fields.created,
            resolvidoEm: chamado.fields.resolutiondate
        };
    });
}

async function consultarAlertasClp(periodo, clp, mac) {

    if (!jiraUrl || !jiraEmail || !jiraToken || !projectKey) {
        throw new Error("As variáveis de ambiente do Jira não foram configuradas.");
    }

    if (periodo != "24h" && periodo != "7d" && periodo != "30d") {
        throw new Error('Período inválido. Use formatos como "24h", "7d" ou "30d".');
    }

    const autenticacao = Buffer.from(`${jiraEmail}:${jiraToken}`).toString("base64");
    const url = `${jiraUrl.replace(/\/+$/, "")}/rest/api/3/search/jql`;

    const jql = `project = ${projectKey} AND created >= -${periodo} ORDER BY created DESC`;

    let chamados = [];
    let nextPageToken = null;

    do {
        const corpo = {
            jql,
            maxResults: 100,
            fields: ["summary", "status", "priority", "issuetype", "created", "updated", "resolutiondate"]
        };

        if (nextPageToken) {
            corpo.nextPageToken = nextPageToken;
        }

        const resposta = await fetch(url, {
            method: "POST",
            headers: {
                "Authorization": `Basic ${autenticacao}`,
                "Accept": "application/json",
                "Content-Type": "application/json"
            },
            body: JSON.stringify(corpo)
        });

        if (!resposta.ok) {
            const erro = await resposta.text();
            throw new Error(`Erro Jira (${resposta.status}): ${erro}`);
        }

        const dados = await resposta.json();
        chamados = chamados.concat(dados.issues || []);
        nextPageToken = dados.nextPageToken || null;
    } while (nextPageToken);

    // Filtros por nome do CLP e MAC 
    // São opcionais pela validação, caso sejam informados, precisam bater
    const clpBusca = clp ? clp.trim().toLowerCase() : null;
    const macBusca = mac ? mac.trim().toLowerCase() : null;

    const chamadosFiltrados = chamados.filter(function (chamado) {

        // Coloca toLowerCase, coloquei o "?" para tratar, seria por exemplo,
        // Se tiver sumarry faz tolowercase, se não ele vira undefined e não quebra o código por causa do toLowerCae
        const resumo = chamado.fields.summary?.toLowerCase();

        // Se não tiver resumo retorna false, é tipo "Descartar"
        if (!resumo) {
            return false;
        }

        // Se não for igual ao clpBuscar retorna false, é tipo "Descartar"
        if (clpBusca && !resumo.includes(clpBusca)) {
            return false;
        }

        // Se não for igual ao macBusca retorna false, é tipo "Descartar"
        if (macBusca && !resumo.includes(macBusca)) {
            return false;
        }

        return true;
    });

    // Mapeio todas as variaveis pegando apenas partes especificas do chamado
    const resultado = chamadosFiltrados.map(function (chamado) {
        return {
            chave: chamado.key,                          
            resumo: chamado.fields.summary,              
            status: chamado.fields.status?.name,         
            prioridade: chamado.fields.priority?.name,   
            tipo: chamado.fields.issuetype?.name,        
            criadoEm: chamado.fields.created,
            atualizadoEm: chamado.fields.updated,
            resolvidoEm: chamado.fields.resolutiondate
        };
    });

    // Retorno a nova lista com as partes do chamado que quero
    return resultado
}


module.exports = {
    consultarJira,
    consultarAlertasClp
};
