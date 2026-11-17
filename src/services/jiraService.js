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

module.exports = {
    consultarJira
};
  