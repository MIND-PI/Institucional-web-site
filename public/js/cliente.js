    async function getClient() {
        // Pegando id da empresa do session storage
        let id_empresa = sessionStorage.getItem("ID_EMPRESA")

        // Chamando a api 
        let response = await fetch(`/cliente/${id_empresa}`, {
            method: "GET"
        })

        // Verificando se a resposta da api foi ok
        if (!response.ok) {
            console.log("Não foi possível achar os clientes")
            return[]
        }

        // Transformando a resposta em json
        let json = await response.json()

        sessionStorage.setItem("CLIENTES_CADASTRADOS", JSON.stringify(json))
        console.log(json)
        return json
    }

    function renderClient(clientes) {
        let table = document.getElementById("table_management_client")
        table.innerHTML = ""

        // Validando as ações que o cargo do usuario pode fazer
        let actions = loadActions()
        
        // Criando a tabela 
        for (let i = 0; i < clientes.length; i++) {
            // Variavel que representa cada modelo vindo do json
            const client = clientes[i];

            // Tratando data e hora
            let data_criacao = new Date(client.data_criacao).toLocaleDateString("pt-br")

            // Criando os dados da tabela
            table.innerHTML += `<tr data-id="${client.idCliente}">
                <td><div>${client.nome}</div></td>
                <td><div>${data_criacao}</div></td>
                <td><div>${client.setor}</div></td>
                <td><div class="management-status ${client.status == 1 ? "active" : "disabled"}">${client.status == 1 ? "Ativo" : "Inativo"}</div></td>
                <td class="management-col-actions">${actions}</td>
            </tr>`
        }

        // Colocando total de modelos
        if (clientes.length == 0) {
            total_client.innerHTML = "Sem clientes cadastrados"
            return
        }

        total_client.innerHTML = `${clientes.length} clientes`
    }

    async function registerClient(event) {
        let id_empresa = sessionStorage.getItem("ID_EMPRESA")

        let nome = input_adicionar_nome_client.value
        let setor = input_adicionar_setor_client.value
        let cnpj = input_adicionar_cnpj_client.value
        
        
        if (!nome || nome.trim().length === 0) {
            erro_adicionar_client.innerHTML = "O nome precisa estar preenchido"
            event.preventDefault()
            return
        }

        if (!setor || setor.trim().length === 0) {
            erro_adicionar_client.innerHTML = "O setor precisa estar preenchido"
            event.preventDefault()
            return
        }

        if (!cnpj || cnpj.length !== 14) {
            erro_adicionar_client.innerHTML = "O cnpj precisa estar preenchido"
            event.preventDefault()
            return
        }

        let response = await fetch(`/cliente/cadastrar/${id_empresa}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "nome_fantasia": nome,
                "setor": setor,
                "cnpj": cnpj
            })
        })

        console.log(response)

        if (!response.ok) {
            erro_adicionar_client.innerHTML = "Não conseguiu fazer a conexão com o servidor"
            event.preventDefault()
            return
        }
    }

    async function updateClient(event) {
        let id_empresa = sessionStorage.getItem("ID_EMPRESA")
        let nome = input_editar_nome_client.value
        let status = select_editar_status_client.value

        let response = await fetch(`/cliente/atualizar/${id_empresa}/${id_cliente}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "nome_fantasia": nome,
                "status": status
            })
        })

        if (!response.ok) {
            erro_editar_client.innerHTML = "Não conseguiu fazer a conexão com o servidor"
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

    function openModal(client) {
        document.getElementById(client).classList.add("ativo");
    }

    function closeModal(client) {
        document.getElementById(client).classList.remove("ativo");
    }

    async function inactiveClient(event) {
        let id_empresa = sessionStorage.getItem("ID_EMPRESA")
        let clientes = JSON.parse(sessionStorage.getItem("CLIENTES_CADASTRADOS"))

        let nome = input_inativar_client.value

        if (searchInactiveClient(nome, clientes)) {
            erro_inativar_client.innerHTML = "A confirmação precisa ser o mesmo nome do cliente"
            event.preventDefault()
            return
        }

        let response = await fetch(`/cliente/inativar/${id_empresa}/${id_cliente}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            }
        })

        if (!response.ok) {
            erro_inativar_client.innerHTML = "O cliente tem registros e não é possível inativa-lo"
            event.preventDefault()
            return
        }
    }

    function searchInactiveClient(nome, clientes) {
        for (let i = 0; i < clientes.length; i++) {
            const cliente = clientes[i];
            if (cliente.nome == nome && cliente.idCliente == id_cliente) {
                return false
            }
        }

        return true
    }

    function searchClient() {
        // Validando input e colocando em lower case
        let input_search = input_busca_client.value.toLowerCase()

        // Transformando o session storage em json
        let clients = JSON.parse(sessionStorage.getItem("CLIENTES_CADASTRADOS"))

        // Filtrando modelo pelo nome, verificando se o input_search value está presente em algum dos indices do array
        let client_filter = clients.filter(client => client.nome.toLowerCase().includes(input_search))

        renderClient(client_filter)
    }

    // ======================================
    // Carregando modelos
    // ======================================
    async function loadClients() {
        let clients = await getClient()
        renderClient(clients)
    }

    loadClients()



    // ======================================
    // Criação de variavel universal
    // ======================================

    // Criando variavel modelo para ser usada como id no edit e remove
    let id_cliente


    // ======================================
    // Botões que estão ouvindo os comandos
    // ======================================

    // Evento de click na tabela para verificar somente botão de editar e remover

    document.getElementById("table_management_client").addEventListener("click", (event) => {
        let btnEdit = event.target.closest(".management-btn-edit")
        let btnRemove = event.target.closest(".management-btn-delete")
        id_cliente = event.target.closest("tr").getAttribute("data-id")
        if (btnEdit) {
            openModal("overlay_edit_client")
        }

        if (btnRemove) {
            openModal("overlay_inativar_client")
        }
    })

    // Evento de click no botão de fechar o pop up de editar
    document.getElementById("btn_fechar_editar_client").addEventListener("click", () => {
        closeModal("overlay_edit_client")
        id_cliente = null
    })

    // Evento de click no botão de fechar o pop up de remover
    document.getElementById("btn_fechar_inativar_client").addEventListener("click", () => {
        closeModal("overlay_inativar_client")
        id_cliente = null
    })

    // Evento de click no botão de adicionar mais um modelo
    document.getElementById("btn_management_client").addEventListener("click", () => {
        openModal("overlay_add_client")
    })

    // Evento de click no botão de fechar o pop up de adiconar novo modelo
    document.getElementById("btn_fechar_adicionar_client").addEventListener("click", () => {
        closeModal("overlay_add_client")
    })

    // Adicionando evento no formulario do adicionar modelo quando ele é enviado
    document.getElementById("form_adicionar_client").addEventListener("submit", (event) => {
        registerClient(event)
    });

    // Adicionando evento no formulário de edição de modelo quando ele é enviado
    document.getElementById("form_editar_client").addEventListener("submit", (event) => {
        updateClient(event)
    })

    // Adicionando evento no formulário de remoção de moddelos quado ele é enviado
    document.getElementById("form_inativar_client").addEventListener("submit", (event) => {
        inactiveClient(event)
    })

    // Adicionando evento de input no input de busca para filtrar por nome
    document.getElementById("input_busca_client").addEventListener("input", () => {
        searchClient()
    })