var client = require("../config/iaConfig");

async function responseDashMicro(req, res) {
    let nome_usuario = req.body.nomeUsuario
    let pergunta = req.body.pergunta
    let dados = req.body.dados

    if (!nome_usuario || nome_usuario.trim() == "") {
        res.status(400).json({
            erro: "Todos os dados precisam estar preenchidos"
        });
    }

    if (!pergunta || pergunta.trim() == "") {
        res.status(400).json({
            erro: "Todos os dados precisam estar preenchidos"
        });
    }

    if (!dados || dados.trim() == "") {
        res.status(400).json({
            erro: "Todos os dados precisam estar preenchidos"
        });
    }

    let input = `
    # Informações importantes para experiência do usuario

    ## Dados coletados pelo nosso sistema
    dados coletados = ${dados}
    ## Nome do usuario
    nome do usuario = ${nome_usuario}
    ## Pergunta do usuario
    pergunta do usuario = ${pergunta}

    No momento esponda com "oi" e meu nome, estou testando
    `
    try {
        let response = await client.responses.create({
            model: "openai/gpt-oss-20b",
            input: input,
            temperature: 0.1
        });

        console.log(response)


    } catch (erro) {
        console.error("Erro ao enviar resposta para a ia:", erro.message);
        res.status(500).json({
            erro: "Não foi possível fazer a requisição na api"
        });
    }
}


module.exports = {
    responseDashMicro
}