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

loadModel()