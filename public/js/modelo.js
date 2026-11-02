async function loadModel() {
    // Pegando id da empresa do session storage
    let id_empresa = sessionStorage.getItem("ID_EMPRESA")

    // Chamando a api 
    let response = await fetch(`/modelo/${id_empresa}`, {
        method: "GET"
    })

    // Verificando se a resposta da api foi ok
    if (!response.ok) {
        console.log("Não foi possível achar os modelos")
        return
    }

    // Transformando a resposta em json
    let json = await response.json()


    let table = document.getElementById("table_management")

    // Validando as ações que o cargo do usuario pode fazer
    let actions = loadActions()

    // Criando a tabela 
    for (let i = 0; i < json.length; i++) {
        // Variavel que representa cada modelo vindo do json
        const model = json[i];

        // Tratando data e hora
        let data_criacao = new Date(model.data_criacao).toLocaleDateString("pt-br")
        let data_atualizacao = new Date(model.data_atualizacao).toLocaleDateString("pt-br")

        // Criando os dados da tabela
        table.innerHTML += `<tr data-id="${model.idModelo}">
            <td><div class="management-status ${model.status == 1 ? "active" : "disabled"}">${model.status == 1 ? "Ativo" : "Inativo"}</div></td>
            <td><div>${model.nome}</div></td>
            <td><div>${data_criacao}</div></td>
            <td><div>${data_atualizacao}</div></td>
            <td class="management-col-actions">${actions}</td>
        </tr>`
    }

    // Colocando total de modelos
    if (json.length == 0) {
        total_models.innerHTML = "Sem modelos cadastrados"
        return
    }

    total_models.innerHTML = `${json.length} modelos`

    sessionStorage.setItem("MODELOS_CADASTRADOS", json)
}

async function registerModel(event) {
    let id_empresa = sessionStorage.getItem("ID_EMPRESA")

    let nome = input_adicionar_nome.value

    if (!nome || nome.trim().length === 0) {
        erro_adicionar_modelo.innerHTML = "O nome precisa estar preenchido"
        event.preventDefault()
        return
    }

    let response = await fetch(`/modelo/cadastrar/${id_empresa}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            "nomeServer": nome
        })
    })

    console.log(response)

    if (!response.ok) {
        erro_adicionar_modelo.innerHTML = "Não conseguiu fazer a conexão com o servidor"
        event.preventDefault()
        return
    }
}

async function updateModel(event) {
    let id_empresa = sessionStorage.getItem("ID_EMPRESA")

    let nome = input_editar_nome.value
    let status = select_editar_cargo.value

    let response = await fetch(`/modelo/atualizar/${id_empresa}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            "nomeServer": nome,
            "statusServer": status
        })
    })

    if (!response.ok) {
        erro_editar_modelo.innerHTML = "Não conseguiu fazer a conexão com o servidor"
        event.preventDefault()
        return
    }
}

function loadActions() {
    let actions = ""
    if (sessionStorage.getItem("CARGO_USUARIO") === 'administrador') {
        actions = `<button type="button" class="management-btn-icon management-btn-edit" title="Editar">
                <i class="bi bi-pencil-square"></i>
            </button>
            <button type="button" class="management-btn-icon management-btn-delete" title="Remover">
                <i class="bi bi-trash3"></i>
            </button>`
    } else {
        actions = `<i class="bi bi-lock-fill management-lock" title="Conta do responsável da empresa"></i>`;
    }

    return actions
}

function openModal(modal) {
    document.getElementById(modal).classList.add("ativo");
}

function closeModal(modal) {
    document.getElementById(modal).classList.remove("ativo");
}



// ======================================
// Carregando modelos
// ======================================
loadModel()


// ======================================
// Botões que estão ouvindo os comandos
// ======================================

// Evento de click na tabela para verificar somente botão de editar e remover
document.getElementById("table_management").addEventListener("click", (event) => {
    let btnEdit = event.target.closest(".management-btn-edit")
    let btnRemove = event.target.closest(".management-btn-delete")

    if (btnEdit) {
        openModal("overlay_edit_model")
    }

    if (btnRemove) {
        openModal("overlay_remove_model")
    }
})

// Evento de click no botão de fechar o pop up de editar
document.getElementById("btn_fechar_editar").addEventListener("click", () => {
    closeModal("overlay_edit_model")
})

// Evento de click no botão de fechar o pop up de remover
document.getElementById("btn_fechar_remover").addEventListener("click", () => {
    closeModal("overlay_remove_model")
})

// Evento de click no botão de adicionar mais um modelo
document.getElementById("btn_management_model").addEventListener("click", () => {
    openModal("overlay_add_model")
})

// Evento de click no botão de fechar o pop up de adiconar novo modelo
document.getElementById("btn_fechar_adicionar").addEventListener("click", () => {
    closeModal("overlay_add_model")
})

// Adicionando evento no formulario do adicionar modelo quando ele é enviado
document.getElementById("form_adicionar_modelo").addEventListener("submit", (event) => {
    registerModel(event)
});

// Adicionando evento no formulário de edição de modelo quando ele é enviado
document.getElementById("form_editar_modelo").addEventListener("submit", (event) => {
    updateModel(event)
})