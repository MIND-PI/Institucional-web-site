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
        let data_atualizacao = new Date(model.data_criacao).toLocaleDateString("pt-br")

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

// Carregando modelos
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
document.getElementById("btn_fechar_editar").addEventListener("click", (event) => {
    closeModal("overlay_edit_model")
})

// Evento de click no botão de fechar o pop up de remover
document.getElementById("btn_fechar_remover").addEventListener("click", (event) => {
    closeModal("overlay_remove_model")
})

// Evento de click no botão de salvar alterações do modelo
