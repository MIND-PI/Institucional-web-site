// Abrir  = adicionar a classe "ativo" no overlay (o CSS faz a animação)
// Fechar = remover a classe "ativo"

function abrirModal(idOverlay) {
    document.getElementById(idOverlay).classList.add("ativo");
}

function fecharModal(idOverlay) {
    document.getElementById(idOverlay).classList.remove("ativo");
}

// Liga as formas de fechar um modal:
//   - botões (CANCELAR e/ou X)
//   - clicar no fundo escuro, fora da caixa
function configurarFechamento(idOverlay, idsBotoes) {
    const overlay = document.getElementById(idOverlay);

    idsBotoes.forEach(function (idBotao) {
        document.getElementById(idBotao).addEventListener("click", function () {
            fecharModal(idOverlay);
        });
    });

    overlay.addEventListener("click", function (evento) {
        // target == overlay significa que clicou no fundo, e não dentro da caixa
        if (evento.target == overlay) {
            fecharModal(idOverlay);
        }
    });
}

// Tecla Esc fecha qualquer modal aberto
document.addEventListener("keydown", function (evento) {
    if (evento.key == "Escape") {
        document.querySelectorAll(".overlay_config.ativo").forEach(function (overlay) {
            overlay.classList.remove("ativo");
        });
    }
});

configurarFechamento("overlay_add_clp",     ["btn_cancelar_adicionar"]);
configurarFechamento("overlay_edit_clp",    ["btn_cancelar_editar"]);
configurarFechamento("overlay_remove_clp",  ["btn_cancelar_remover"]);
configurarFechamento("overlay_monitor_clp", ["btn_cancelar_monitorar", "btn_fechar_monitorar"]);

// Marca os campos vazios com borda vermelha (classe .invalido)
// e devolve true se todos estão preenchidos
function validarCampos(ids, idErro) {
    let valido = true;

    ids.forEach(function (id) {
        const campo = document.getElementById(id);
        const vazio = campo.value.trim() == "";
        campo.classList.toggle("invalido", vazio);
        if (vazio) valido = false;
    });

    document.getElementById(idErro).innerText = valido ? "" : "Preencha todos os campos obrigatórios.";
    return valido;
}

// Limpa a mensagem de erro e a borda vermelha de um modal
function limparErros(idOverlay, idErro) {
    document.getElementById(idErro).innerText = "";
    document.querySelectorAll(`#${idOverlay} .invalido`).forEach(function (campo) {
        campo.classList.remove("invalido");
    });
}

// Tira o vermelho do campo assim que o usuário volta a mexer nele
document.querySelectorAll(".modal-clp input, .modal-clp select").forEach(function (campo) {
    campo.addEventListener("input", function () {
        campo.classList.remove("invalido");
    });
});

document.getElementById("btn_add_clp").addEventListener("click", function () {
    document.getElementById("form_adicionar_clp").reset();
    limparErros("overlay_add_clp", "erro_adicionar_clp");
    abrirModal("overlay_add_clp");
});

document.getElementById("form_adicionar_clp").addEventListener("submit", function (evento) {
    // preventDefault impede o navegador de recarregar a página ao enviar o formulário
    evento.preventDefault();

    const obrigatorios = ["select_adicionar_modelo", "input_adicionar_localizacao", "input_adicionar_apelido"];
    if (!validarCampos(obrigatorios, "erro_adicionar_clp")) {
        return;
    }


    fecharModal("overlay_add_clp");
});

function abrirModalEditar() {
    limparErros("overlay_edit_clp", "erro_editar_clp");

    abrirModal("overlay_edit_clp");
}

document.getElementById("form_editar_clp").addEventListener("submit", function (evento) {
    evento.preventDefault();

    const obrigatorios = ["select_editar_modelo", "input_editar_localizacao", "input_editar_apelido"];
    if (!validarCampos(obrigatorios, "erro_editar_clp")) {
        return;
    }

    // (API): fetch(`/clp/atualizar/${id}`, { method: "PUT", ... })

    fecharModal("overlay_edit_clp");
});

let apelidoParaExcluir = "";

function abrirModalRemover(linha) {
    apelidoParaExcluir = linha.children[2].innerText.trim();

    document.getElementById("nome_remover_clp").innerText = apelidoParaExcluir;

    const input = document.getElementById("input_remover_clp");
    input.value = "";
    input.placeholder = apelidoParaExcluir;

    limparErros("overlay_remove_clp", "erro_remover_clp");
    abrirModal("overlay_remove_clp");
}

document.getElementById("form_remover_clp").addEventListener("submit", function (evento) {
    evento.preventDefault();

    const digitado = document.getElementById("input_remover_clp").value.trim();

    if (digitado != apelidoParaExcluir) {
        document.getElementById("erro_remover_clp").innerText = "O texto digitado precisa ser igual ao apelido do CLP.";
        return;
    }

    // (API): fetch(`/clp/deletar/${id}`, { method: "DELETE" })

    fecharModal("overlay_remove_clp");
});


function abrirModalMonitorar() {
    limparErros("overlay_monitor_clp", "erro_monitorar_clp");
    abrirModal("overlay_monitor_clp");
}

document.getElementById("lista_monitorar").addEventListener("change", function (evento) {
    if (evento.target.type != "checkbox") return;

    const campo = evento.target.closest(".linha-monitorar").querySelector(".parametro");
    campo.disabled = !evento.target.checked;
    campo.classList.remove("invalido");
});

document.getElementById("form_monitorar_clp").addEventListener("submit", function (evento) {
    evento.preventDefault();

    let valido = true;
    let marcados = 0;

    document.querySelectorAll("#lista_monitorar .linha-monitorar").forEach(function (linha) {
        if (!linha.querySelector('input[type="checkbox"]').checked) return;
        marcados++;

        const campo = linha.querySelector(".parametro");
        const limite = campo.value.trim().replace(",", ".");
        const numeroValido = limite != "" && !isNaN(limite) && Number(limite) >= 0;

        campo.classList.toggle("invalido", !numeroValido);
        if (!numeroValido) valido = false;
    });

    if (marcados == 0) {
        document.getElementById("erro_monitorar_clp").innerText = "Selecione ao menos um recurso para monitorar.";
        return;
    }

    if (!valido) {
        document.getElementById("erro_monitorar_clp").innerText = "Informe um limite numérico para cada recurso marcado.";
        return;
    }

    // (API): enviar os recursos e limites para o back-end

    fecharModal("overlay_monitor_clp");
});

document.getElementById("table_clps").addEventListener("click", function (evento) {
    const linha = evento.target.closest("tr");
    if (!linha) return;

    if (evento.target.closest(".management-btn-monitor")) abrirModalMonitorar();
    if (evento.target.closest(".management-btn-edit"))    abrirModalEditar();
    if (evento.target.closest(".management-btn-delete"))  abrirModalRemover(linha);
});


// FETCHES DO BANCO

async function getClps(){
    let id_empresa = sessionStorage.getItem("ID_EMPRESA")

    let response = await fetch(
        `/clp/${id_empresa}`, {
            method: "GET"
        }
    )

    if(!response.ok){
        console.log("Não foi possível encontrar os CLPs")
        return[]
    }

    let json = await response.json()
    // Converte o texto em uma lista de objetos
    sessionStorage.setItem("CLPS_CADASTRADOS", JSON.stringify(json))
    return json
}