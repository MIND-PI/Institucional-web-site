async function getModel() {
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

    sessionStorage.setItem("MODELOS_CADASTRADOS", JSON.stringify(json))

    return json
}

function renderModels(modelos) {
    let table = document.getElementById("table_management")
    table.innerHTML = ""

    // Validando as ações que o cargo do usuario pode fazer
    let actions = loadActions()
    
    // Criando a tabela 
    for (let i = 0; i < modelos.length; i++) {
        // Variavel que representa cada modelo vindo do json
        const model = modelos[i];

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
    if (modelos.length == 0) {
        total_models.innerHTML = "Sem modelos cadastrados"
        return
    }

    total_models.innerHTML = `${modelos.length} modelos`
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
    let nome = input_editar_nome.value
    let status = select_editar_cargo.value

    let response = await fetch(`/modelo/atualizar/${id_modelo}`, {
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

async function deleteModel(event) {

    let modelos = JSON.parse(sessionStorage.getItem("MODELOS_CADASTRADOS"))

    let nome = input_remover.value

    if (searchDeleteModel(nome, modelos)) {
        erro_remover_modelo.innerHTML = "A confirmação precisa ser o mesmo nome do modelo"
        event.preventDefault()
        return
    }

    let response = await fetch(`/modelo/deletar/${id_modelo}`, {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json"
        }
    })

    if (!response.ok) {
        erro_remover_modelo.innerHTML = "O modelo tem registros e não é possível deletá-lo"
        event.preventDefault()
        return
    }
}

function searchDeleteModel(nome, modelos) {
    for (let i = 0; i < modelos.length; i++) {
        const modelo = modelos[i];
        if (modelo.nome == nome && modelo.idModelo == id_modelo) {
            return false
        }
    }

    return true
}

function searchModel() {
    // Validando input e colocando em lower case
    let input_search = input_busca.value.toLowerCase()

    // Transformando o session storage em json
    let models = JSON.parse(sessionStorage.getItem("MODELOS_CADASTRADOS"))

    // Filtrando modelo pelo nome, verificando se o input_search value está presente em algum dos indices do array
    let model_filter = models.filter(model => model.nome.toLowerCase().includes(input_search))

    renderModels(model_filter)
}

// ======================================
// Carregando modelos
// ======================================
async function loadModels() {
    let models = await getModel()
    renderModels(models)
}

loadModels()



// ======================================
// Criação de variavel universal
// ======================================

// Criando variavel modelo para ser usada como id no edit e remove
let id_modelo


// ======================================
// Botões que estão ouvindo os comandos
// ======================================

// Evento de click na tabela para verificar somente botão de editar e remover

document.getElementById("table_management").addEventListener("click", (event) => {
    let btnEdit = event.target.closest(".management-btn-edit")
    let btnRemove = event.target.closest(".management-btn-delete")
    id_modelo = event.target.closest("tr").getAttribute("data-id")
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
    id_modelo = null
})

// Evento de click no botão de fechar o pop up de remover
document.getElementById("btn_fechar_remover").addEventListener("click", () => {
    closeModal("overlay_remove_model")
    id_modelo = null
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

// Adicionando evento no formulário de remoção de moddelos quado ele é enviado
document.getElementById("form_remover_modelo").addEventListener("submit", (event) => {
    deleteModel(event)
})

// Adicionando evento de input no input de busca para filtrar por nome
document.getElementById("input_busca").addEventListener("input", () => {
    searchModel()
})