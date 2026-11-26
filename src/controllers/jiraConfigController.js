// Controller da integração Jira: valida a requisição e aciona o model.

var jiraConfigModel = require("../models/jiraConfigModel");

function idEmpresaValido(idEmpresa) {
    var numero = Number(idEmpresa);
    return Number.isInteger(numero) && numero > 0;
}

function urlValida(url) {
    if (typeof url !== "string") {
        return false;
    }

    // A instância do Jira deve ser informada como endereço completo.
    return /^https?:\/\/.+/.test(url) && url.length <= 255;
}

function emailValido(email) {
    if (typeof email !== "string") {
        return false;
    }

    let arroba = email.indexOf("@");
    let ponto = email.lastIndexOf(".");

    if (arroba <= 0 || ponto <= arroba + 1 || ponto === email.length - 1) {
        return false;
    }

    return true;
}

function tokenValido(token) {
    if (typeof token !== "string") {
        return false;
    }

    // O token não pode conter espaços em branco.
    return token.length > 0 && !/\s/.test(token) && token.length <= 512;
}

function chaveProjetoValida(chave) {
    if (typeof chave !== "string") {
        return false;
    }

    // Chave de projeto Jira: apenas letras e números, no máximo 20 caracteres.
    return /^[A-Za-z0-9]{1,20}$/.test(chave);
}

async function cadastrar(req, res) {

    var idEmpresa = req.params.idEmpresa;
    var urlJira = req.body.urlJiraServer;
    var emailApi = req.body.emailApiServer;
    var tokenApi = req.body.tokenApiServer;
    var chaveProjeto = req.body.chaveProjetoServer;

    if (!idEmpresaValido(idEmpresa)) {
        return res.status(400).send("O id da empresa está inválido!");
    }
    if (!urlValida(urlJira)) {
        return res.status(400).send("A URL do Jira é inválida! Informe o endereço completo (começando com http:// ou https://).");
    }
    if (!emailValido(emailApi)) {
        return res.status(400).send("O e-mail da API do Jira é inválido!");
    }
    if (!tokenValido(tokenApi)) {
        return res.status(400).send("O token de API é inválido! Informe o token sem espaços em branco.");
    }
    if (!chaveProjetoValida(chaveProjeto)) {
        return res.status(400).send("A chave do projeto é inválida! Use apenas letras e números (máximo 20 caracteres).");
    }

    try {
        // A chave do projeto é padronizada em maiúsculas, como no Jira.
        await jiraConfigModel.cadastrar(Number(idEmpresa), urlJira, emailApi, tokenApi, chaveProjeto.toUpperCase());

        // A resposta NUNCA inclui o token de API.
        return res.status(201).json({
            mensagem: "Integração Jira cadastrada com sucesso!",
            empresaId: Number(idEmpresa),
            url_jira: urlJira,
            email_api: emailApi,
            chave_projeto: chaveProjeto.toUpperCase()
        });

    } catch (erro) {
        console.log(erro.message || erro);
        return res.status(500).json(erro.sqlMessage || "Erro ao cadastrar a integração Jira.");
    }
}

module.exports = {
    cadastrar
};
