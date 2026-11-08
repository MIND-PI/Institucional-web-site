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

["btn_cancelar_monitorar", "btn_fechar_monitorar"].forEach(function (id) {
    document.getElementById(id).addEventListener("click", function () {
        clpPendente = null;
    });
});

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


// Adicionar CLP
let clpPendente = null; // dados do CLP esperando os limites

document.getElementById("btn_add_clp").addEventListener("click", function () {
    document.getElementById("form_adicionar_clp").reset();
    limparErros("overlay_add_clp", "erro_adicionar_clp");
    abrirModal("overlay_add_clp");
});

document.getElementById("form_adicionar_clp").addEventListener("submit", async function (evento) {
    evento.preventDefault();

    const obrigatorios = ["select_adicionar_modelo", "input_adicionar_localizacao", "input_adicionar_apelido"];
    if (!validarCampos(obrigatorios, "erro_adicionar_clp")) {
        return;
    }

    // guarda, mas ainda não envia ao banco
    clpPendente = {
        nome: document.getElementById("input_adicionar_apelido").value.trim(),
        localizacao: document.getElementById("input_adicionar_localizacao").value.trim(),
        status: document.getElementById("select_adicionar_status").value,
        modeloId: document.getElementById("select_adicionar_modelo").value
    };

    await abrirModalMonitorarNovo();
});

// MONITORAMENTO

let idClpParaMonitorar = null;
let medicoesDoClp = [];
// CPU (1), RAM(2), SCAN TIME (5)
const MEDICOES_OBRIGATORIAS = [1, 2, 5];

async function abrirModalMonitorarNovo(){
    limparErros("overlay_monitor_clp", "erro_monitorar_clp");

    idClpParaMonitorar = null;
    const tipos = await getTiposMedicao();

    // os tipos de medição obrigatórios já entram como monitoradas
    // mas o cliente tem que definir o limite
    medicoesDoClp = tipos.map(function (t){
        return {
            ...t,
            parametro: null,
            monitorado: MEDICOES_OBRIGATORIAS.includes(t.idTipoMedicao) ? 1 : 0
        };
    });
    renderMonitorar();

    // limites vazios já começam vermelhos pra avisar o cliente que ele 
    // tem que definir o limite
    // se não o clp sequer é criado
    document.querySelectorAll("#lista_monitorar .parametro").forEach(function (campo) {
        campo.classList.add("invalido");
    });

    fecharModal("overlay_add_clp");
    abrirModal("overlay_monitor_clp");
}
async function getTiposMedicao(){
    let response = await fetch("/clp/listarTiposMedicao", { method: "GET" })

    if(!response.ok){
        console.log("Não foi possível encontrar os tipos de medição")
        return []
    }

    return await response.json()
}


async function getMedicoes(idClp){
    let id_empresa = sessionStorage.getItem("ID_EMPRESA")

    let response = await fetch(`/clp/listarMedicoes/${idClp}/${id_empresa}`, { method: "GET" })

    console.log("listarMedicoes ->", response.status, response.url)

    if (!response.ok) {
        console.log("Resposta do servidor:", await response.text())
        return []
    }

    let json = await response.json()
    console.log("medições recebidas:", json)
    return json
}

// Cria a linha com o que já está sendo monitorado
function criarLinhaMonitorar(medicao, marcado) {
    const obrigatoria = MEDICOES_OBRIGATORIAS.includes(medicao.idTipoMedicao);
    const parametro = medicao.parametro ?? "";

    return `<div class="linha-monitorar" data-tipo="${medicao.idTipoMedicao}">
        <label>
            <input type="checkbox" ${marcado ? "checked" : ""} ${obrigatoria ? "disabled" : ""}>
            ${medicao.apelido}${obrigatoria ? '<span class="obrigatorio">*</span>' : ""}
        </label>
        <input type="text" class="parametro" placeholder="Limite (${medicao.unidade_medida})"
               value="${parametro}" ${marcado ? "" : "disabled"}>
    </div>`;
}

// monta a lista e o select a partir de medicoes do Clp
function renderMonitorar(){
    const lista = document.getElementById("lista_monitorar");
    const select = document.getElementById("select_adicionar_recurso");

    lista.innerHTML = "";
    select.innerHTML = `<option value="" selected>Selecione</option>`;

    for(let i = 0; i < medicoesDoClp.length; i++){
        const m = medicoesDoClp[i];

        if(m.monitorado == 1){
            lista.insertAdjacentHTML("beforeend", criarLinhaMonitorar(m, true));
        }
        else{
             select.innerHTML += `<option value="${m.idTipoMedicao}">${m.apelido}</option>`;
        }
    }
}


async function abrirModalMonitorar(linha) {
    clpPendente = null;
    limparErros("overlay_monitor_clp", "erro_monitorar_clp");

    idClpParaMonitorar = linha.dataset.id;
    medicoesDoClp = await getMedicoes(idClpParaMonitorar);
    renderMonitorar();

    abrirModal("overlay_monitor_clp");
}

document.getElementById("lista_monitorar").addEventListener("change", function (evento) {
    if (evento.target.type != "checkbox") return;

    const campo = evento.target.closest(".linha-monitorar").querySelector(".parametro");
    campo.disabled = !evento.target.checked;
    campo.classList.remove("invalido");
});

document.getElementById("lista_monitorar").addEventListener("input", function (evento) {
    if (!evento.target.classList.contains("parametro")) return;

    const limite = evento.target.value.trim().replace(",", ".");
    const ok = limite != "" && !isNaN(limite) && Number(limite) >= 0;
    evento.target.classList.toggle("invalido", !ok);
});

document.getElementById("select_adicionar_recurso").addEventListener("change", function (){
    if(this.value == "") return;

    const medicao = medicoesDoClp.find(function (m){
        return m.idTipoMedicao == this.value;
    }, this);

    document.getElementById("lista_monitorar")
        .insertAdjacentHTML("beforeend", criarLinhaMonitorar(medicao, true));

    this.querySelector(`option[value="${this.value}"]`).remove();
    this.value = "";
})

document.getElementById("form_monitorar_clp").addEventListener("submit", async function (evento) {
    evento.preventDefault();

    let valido = true;
    let marcados = 0;
    let medicoes = [];

    document.querySelectorAll("#lista_monitorar .linha-monitorar").forEach(function (linha) {
        const marcado = linha.querySelector('input[type="checkbox"]').checked;
        const campo = linha.querySelector(".parametro");
        const limite = campo.value.trim().replace(",", ".");

        if (marcado) {
            marcados++;
            const numeroValido = limite != "" && !isNaN(limite) && Number(limite) >= 0;
            campo.classList.toggle("invalido", !numeroValido);
            if (!numeroValido) valido = false;
        }

        medicoes.push({
            tipoMedicaoId: Number(linha.dataset.tipo),
            status: marcado ? 1 : 0,
            parametro: marcado ? Number(limite) : (limite == "" ? 0 : Number(limite))
        });
    });

    if (marcados == 0) {
        document.getElementById("erro_monitorar_clp").innerText = "Selecione ao menos um recurso para monitorar.";
        return;
    }

    if (!valido) {
        document.getElementById("erro_monitorar_clp").innerText = "Informe um limite numérico para cada recurso marcado.";
        return;
    }

    // MODO CRIAÇÃO: veio do "Adicionar CLP"
    if (clpPendente) {
        let response = await fetch("/clp/adicionarClp", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                nomeServer: clpPendente.nome,
                localizacaoServer: clpPendente.localizacao,
                statusServer: clpPendente.status,
                modeloServer: clpPendente.modeloId,
                empresaServer: sessionStorage.getItem("ID_EMPRESA"),
                medicoesServer: medicoes.filter(function (m) { return m.status == 1; })
            })
        });

        if (response.ok) {
            clpPendente = null;
            fecharModal("overlay_monitor_clp");
            loadClps();
        } else {
            document.getElementById("erro_monitorar_clp").innerText = "Não foi possível adicionar o CLP.";
        }
        return;
    }

    // MODO EDIÇÃO: CLP que já existe
    let response = await fetch(`/clp/salvarMedicoes/${idClpParaMonitorar}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            empresaServer: sessionStorage.getItem("ID_EMPRESA"),
            medicoesServer: medicoes
        })
    });

    if (response.ok) {
        fecharModal("overlay_monitor_clp");
    } else {
        document.getElementById("erro_monitorar_clp").innerText = "Não foi possível salvar as medições.";
    }
});

let apelidoParaExcluir = "";
let idClpParaEditar = null;


// EDITAR CLP
function abrirModalEditar(linha){
    limparErros("overlay_edit_clp", "erro_editar_clp");

    // pega o id que o renderClps colocou na primeira linha da tabela
    idClpParaEditar = linha.dataset.id;

    // procura o CLP na lista que veio do banco

    // JSON.parse pega a lista em formato de texto do sessionStorage (que só guarda texto)
    // e retransforma pra uma lista normal (JSON)
    const clps = JSON.parse(sessionStorage.getItem("CLPS_CADASTRADOS"))

    // Se for igual, o clp que está na linha, retorna suas informações
    const clp = clps.find(function (item) {
        return item.idClp == idClpParaEditar;
    })

    // preenche os campos com os dados atuais
    document.getElementById("select_editar_modelo").value = clp.modeloId;
    document.getElementById("select_editar_status").value = clp.status;
    document.getElementById("input_editar_localizacao").value = clp.localizacao;
    document.getElementById("input_editar_apelido").value = clp.nome;

    abrirModal("overlay_edit_clp")
}

document.getElementById("form_editar_clp").addEventListener("submit", async function (evento){
    evento.preventDefault();

    const obrigatorios = ["select_editar_modelo", "input_editar_localizacao", "input_editar_apelido"];
    if (!validarCampos(obrigatorios, "erro_editar_clp")) {
        return;
    }

    let response = await fetch(`/clp/atualizarClp/${idClpParaEditar}`, {
        method: "PUT",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
            nomeServer: document.getElementById("input_editar_apelido").value.trim(),
            localizacaoServer: document.getElementById("input_editar_localizacao").value.trim(),
            statusServer: document.getElementById("select_editar_status").value,
            modeloServer: document.getElementById("select_editar_modelo").value,
            empresaServer: sessionStorage.getItem("ID_EMPRESA")
        })
    });

    if (response.ok) {
        fecharModal("overlay_edit_clp");
        loadClps();
    } else {
        document.getElementById("erro_editar_clp").innerText = "Não foi possível atualizar o CLP.";
    }
});

// REMOVER CLP
let idClpParaExcluir = null;

function abrirModalRemover(linha) {
    idClpParaExcluir = linha.dataset.id;
    apelidoParaExcluir = linha.children[2].innerText.trim();

    document.getElementById("nome_remover_clp").innerText = apelidoParaExcluir;

    const input = document.getElementById("input_remover_clp");
    input.value = "";
    input.placeholder = apelidoParaExcluir;

    limparErros("overlay_remove_clp", "erro_remover_clp");
    abrirModal("overlay_remove_clp");
}

document.getElementById("form_remover_clp").addEventListener("submit", async function (evento) {
    evento.preventDefault();

    const digitado = document.getElementById("input_remover_clp").value.trim();

    if (digitado != apelidoParaExcluir) {
        document.getElementById("erro_remover_clp").innerText = "O texto digitado precisa ser igual ao apelido do CLP.";
        return;
    }

    let id_empresa = sessionStorage.getItem("ID_EMPRESA");

    let response = await fetch(`/clp/deletarClp/${idClpParaExcluir}/${id_empresa}`, {
        method: "DELETE"
    });

    if (response.ok) {
        fecharModal("overlay_remove_clp");
        loadClps();
    } else {
        document.getElementById("erro_remover_clp").innerText = "Não foi possível excluir o CLP.";
    }
});

// Reage a cliques que acontecem dentro da tabela e descobre o que o usuário clicou
document.getElementById("table_clps").addEventListener("click", function (evento) {
    const linha = evento.target.closest("tr");
    if (!linha) return;

    // .target descobre quem foi clicado
    if (evento.target.closest(".management-btn-delete"))  abrirModalRemover(linha);
    if (evento.target.closest(".management-btn-edit"))    abrirModalEditar(linha);
    if (evento.target.closest(".management-btn-monitor")) abrirModalMonitorar(linha);
});



// FETCHES DO BANCO

async function getClps(){
    let id_empresa = sessionStorage.getItem("ID_EMPRESA")

    let response = await fetch(
        `/clp/listarClps/${id_empresa}`, {
            method: "GET"
        }
    )

    if(!response.ok){
        console.log("Não foi possível encontrar os CLPs")
        return[]
    }

    let json = await response.json()
    // Converte o texto em uma lista de objetos

    //JSON.stringfy transforma o objeto em texto, pois o 
    // sessionStorage só guarda texto
    sessionStorage.setItem("CLPS_CADASTRADOS", JSON.stringify(json))
    return json
}

// Se não for admin, não pode editar nem excluir o clp, aparece um cadeado
function loadActions(){
    let actions = `<button type="button" class="management-btn-icon management-btn-monitor" title="Monitorar">
            <i class="bi bi-graph-up-arrow"></i>
        </button>`

    if(sessionStorage.getItem("CARGO_USUARIO") === 'administrador'){
        actions += `<button type="button" class="management-btn-icon management-btn-edit" title="Editar">
                <i class="bi bi-pencil-square"></i></button>
            <button type="button" class="management-btn-icon management-btn-delete" title="Remover">
                <i class="bi bi-trash3"></i></button>`
    }
    return actions
}

// Desenhar a tabela com os CLPs

function renderClps(clps){
    let table = document.getElementById("table_clps")
    table.innerHTML = ""
    let actions = loadActions()

    for (let i = 0; i < clps.length; i++){
        const clp = clps[i]
        
        table.innerHTML += `<tr data-id="${clp.idClp}">
            <td><div class="management-status ${clp.status == 1 ? "active" : "disabled"}">${clp.status == 1 ? "Ativo" : "Inativo"}</div></td>
            <td><div>${clp.modelo ?? "Sem modelo"}</div></td>
            <td><div>${clp.nome}</div></td>
            <td><div>${clp.localizacao}</div></td>
            <td><div>${clp.data_criacao}</div></td>
            <td><div>${clp.data_atualizacao}</div></td>
            <td class="management-col-actions">${actions}</td>
        </tr>`
    }

    const buscando = document.getElementById("input_busca").value.trim() != "";
    total_clps.innerHTML = clps.length == 0
        ? (buscando ? "Nenhum CLP encontrado" : "Sem CLPs cadastrados")
        : `${clps.length} CLPs`;
}

async function loadClps() {
    let clps = await getClps()
    console.log(clps)
    renderClps(clps)
    document.getElementById("input_busca").dispatchEvent(new Event("input"))
}

// Lista os modelos disponíveis para o cliente selecionar qual ele deseja

async function getModelos() {
    let id_empresa = sessionStorage.getItem("ID_EMPRESA")

    let response = await fetch(`/clp/listarModelosDisponiveis/${id_empresa}`, { method: "GET" })

    if (!response.ok) {
        console.log("Não foi possível encontrar os modelos")
        return []
    }

    return await response.json()
}

// Monta as <options> dos select de adicionar e editar
async function loadModelos(){
    let modelos = await getModelos()

    let selectAdd = document.getElementById("select_adicionar_modelo")
    let selectEdit = document.getElementById("select_editar_modelo")

    selectAdd.innerHTML = `<option value="" disabled selected>Selecione</option>`
    selectEdit.innerHTML = ""

    for (let i = 0; i < modelos.length; i++){
        let option = `<option value="${modelos[i].idModelo}">${modelos[i].nome}</option>`
        selectAdd.innerHTML += option
        selectEdit.innerHTML += option
    }
}

// BUSCA POR APELIDO
document.getElementById("input_busca").addEventListener("input", function () {
    const termo = this.value.trim().toLowerCase();

    const clps = JSON.parse(sessionStorage.getItem("CLPS_CADASTRADOS")) || [];

    const filtrados = clps.filter(function (clp) {
        return clp.nome.toLowerCase().includes(termo);
    });

    renderClps(filtrados);
});

loadClps()
loadModelos()
