// Importa a função responsável por enviar o código de ativação
// para o email do cliente cadastrado pelo fornecedor.

var clienteModel = require("../models/clienteModel");
var { enviarEmailAtivacao } = require("../services/emailService");

function listarCliente(req, res) {

    var idEmpresa = req.params.idEmpresa;

    if (idEmpresa == undefined) {
        res.status(400).send("O id da empresa está indefinido!");
    } else {

        clienteModel.listarCliente(idEmpresa)
            .then(function (resultado) {
                res.json(resultado);
            })
            .catch(function (erro) {
                console.log(erro);
                res.status(500).json(erro.sqlMessage);
            });
    }
}

function atualizarCliente(req, res) {

    var idEmpresa = req.params.idEmpresa;
    var idCliente = req.params.idCliente;
    var nome_fantasia = req.body.nome_fantasia;
    var status = req.body.status;
    var setor = req.body.setor;

    /*
    Verifica se pelo menos um campo válido foi informado para atualização.
    O nome e o setor precisam conter algum caractere além de espaços,
    enquanto o status deve ser 0 ou 1.
    */

    var temNome = nome_fantasia != undefined && nome_fantasia.trim().length > 0;
    var temSetor = setor != undefined && setor.trim().length > 0;
    var temStatus = status !== undefined && status !== "" && [0, 1].includes(Number(status));

    if (idEmpresa == undefined || idCliente == undefined) {
        res.status(400).send("O id está indefinido!");
    } 
    else if(!temNome && !temSetor && !temStatus){
        res.status(400).send("Nenhum campo foi passado para atualização");
    }
    else {
        clienteModel.atualizarCliente(nome_fantasia, setor , status, idCliente, idEmpresa )
            .then(function (resultado) {
                res.json(resultado);
            })
            .catch(function (erro) {
                console.log(erro);
                res.status(500).json(erro.sqlMessage);
            });
    }
}

function cnpjValido(cnpj) {
    if (typeof cnpj !== "string" || cnpj.length !== 14) {
        return false;
    }

    for (let i = 0; i < cnpj.length; i++) {
        if (cnpj[i] < "0" || cnpj[i] > "9") {
            return false;
        }
    }

    return true;
}

function emailValido(email) {
    if (typeof email !== "string") {
        return false;
    }

    let arroba = email.indexOf("@")
    let ponto = email.lastIndexOf(".")


    if (arroba <= 0 || ponto <= arroba + 1 || ponto === email.length - 1) {
        return false
    }

    return true
}

async function cadastrarCliente(req, res) {

    var nome_fantasia = req.body.nome_fantasia;
    var idEmpresa = req.params.idEmpresa;
    var setor = req.body.setor;
    var cnpj = req.body.cnpj;
    var email = req.body.email;

    if (idEmpresa == undefined) {
        return res.status(400).send("O id da empresa está indefinido!");
    }
    if (nome_fantasia == undefined || nome_fantasia.trim().length <= 0) {
        return res.status(400).send("O nome está indefinido");
    }
    if (setor == undefined || setor.trim().length <= 0) {
        return res.status(400).send("O setor está indefinido");
    }
    if (!cnpjValido(cnpj)) {
        return res.status(400).send("O CNPJ precisa ter 14 números");
    }
    if (!emailValido(email)) {
        return res.status(400).send("O email é inválido");
    }


    /*o banco tenta enviar os dados para o cliente model para cadastrar*/
    try {

        // Solicita ao model o cadastro da empresa e a criação do vínculo
        // entre o fornecedor atual e o cliente.
        let resultado = await clienteModel.cadastrarCliente(nome_fantasia, setor, cnpj, idEmpresa);
        
        /*
        Se a empresa já existia na plataforma, o model apenas realiza
        o vínculo com o fornecedor atual. Nesse caso, não é necessário
        enviar um novo código de ativação.
        */

         if (!resultado.empresaNova) {
            return res.status(201).json({
                aviso: "Esse cliente já existia na plataforma e foi vinculado. Nenhum código foi enviado."
            });
        }

        // Se a empresa for nova, envia o código de ativação para o email informado,
        // permitindo que o cliente realize seu primeiro cadastro de usuário.

        try {
            await enviarEmailAtivacao(email, nome_fantasia, resultado.codigo, idEmpresa);

        } catch (erroEmail) {
            console.log("Falha ao enviar email:", erroEmail);
            return res.status(201).json({
                aviso: "Cliente cadastrado, mas o email não foi enviado."
            });
        }

        return res.status(201).json({ mensagem: "Cliente cadastrado e email enviado." });
    
    // Trata erros ocorridos durante o processo de cadastro no banco de dados.
    } catch (erro) {
        console.log(erro);

        // ER_DUP_ENTRY identifica uma tentativa de inserir um valor duplicado
        // em uma coluna ou combinação de colunas que possui restrição UNIQUE

        if (erro.code == "ER_DUP_ENTRY") {
            return res.status(409).json("Esse cliente já está cadastrado");
        }

        return res.status(500).json(erro.sqlMessage);
    }
}

function inativarCliente(req, res) {

    var idEmpresa = req.params.idEmpresa;
    var idCliente = req.params.idCliente;
    
    if (idEmpresa == undefined || idCliente == undefined) {
        res.status(400).send("O id do cliente está indefinido!");
    } 
    
    else {
        clienteModel.inativarCliente(idEmpresa, idCliente)
            .then(function (resultado) {
                // Verifica se algum registro foi atualizado.
                // Se nenhuma linha foi afetada, significa que o vínculo entre
                // o fornecedor e o cliente não foi encontrado.
                
                if (resultado.affectedRows == 0) {
                return res.status(404).json("Cliente não encontrado para este fornecedor");
                }
                res.json(resultado);
            })
            .catch(function (erro) {
                console.log(erro);
                res.status(500).json(erro.sqlMessage);
            });
    }
}

module.exports = {
    listarCliente,
    atualizarCliente,
    cadastrarCliente,
    inativarCliente
}