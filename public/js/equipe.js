// ===== PÁGINA EQUIPE =====
var idUsuario = sessionStorage.ID_USUARIO;

// cores usadas nos avatares (escolhida pelo id do usuário)
var CORES_AVATAR = ["#7c3aed", "#0891b2", "#2563eb", "#be185d", "#047857", "#d97706"];

// como cada cargo do banco aparece na tela
var NOMES_CARGO = { administrador: "Administrador", funcionario: "Funcionário" };

if (!idUsuario) {
    window.location.href = "../login.html";
}

// ---------- utilitários ----------

// evita que nome/email com HTML quebrem a tabela
function escapar(texto) {
    var div = document.createElement("div");
    div.innerText = texto == null ? "" : texto;
    return div.innerHTML;
}

function pegarIniciais(nome) {
    var partes = nome.trim().split(" ");
    var primeira = partes[0].charAt(0);
    var ultima = partes.length > 1 ? partes[partes.length - 1].charAt(0) : "";
    return (primeira + ultima).toUpperCase();
}

// troca o conteúdo da página pela mensagem de acesso restrito
function mostrarAcessoRestrito() {
    document.querySelector(".equipe").innerHTML = `
        <h1 class="equipe-title">Equipe</h1>
        <p class="equipe-subtitle">Apenas administradores podem acessar esta página.</p>`;
}

// ---------- lista de membros ----------

function montarLinha(membro) {
    var cor = CORES_AVATAR[membro.idUsuario % CORES_AVATAR.length];
    var classeCargo = membro.cargo == "administrador" ? "equipe-badge-admin" : "equipe-badge-funcionario";
    var nomeCargo = NOMES_CARGO[membro.cargo] || membro.cargo;

    var ehResponsavel = membro.responsavel == null;   // primeiro usuário da empresa
    var ehEu = membro.idUsuario == idUsuario;

    // Esta página só abre para administrador (cargo da sessão), então ele edita/remove
    // os outros, menos o responsável da empresa (conta protegida) e menos ele mesmo.
    var podeGerenciar = !ehResponsavel && !ehEu;

    var acoes = "";

    if (podeGerenciar) {
        acoes = `
            <button type="button" class="equipe-btn-icon equipe-btn-edit" title="Editar">
                <i class="bi bi-pencil-square"></i>
            </button>
            <button type="button" class="equipe-btn-icon equipe-btn-delete" title="Remover">
                <i class="bi bi-trash3"></i>
            </button>`;
    } else if (ehResponsavel) {
        acoes = `<i class="bi bi-lock-fill equipe-lock" title="Conta do responsável da empresa"></i>`;
    }

    // Foto do banco por cima da inicial. Se não tiver foto, ou se a imagem
    // não carregar (onerror remove o <img>), aparece a inicial que está por baixo.
    var foto = membro.imgUrl
        ? `<img class="equipe-avatar-img" src="${escapar(membro.imgUrl)}" alt="" onerror="this.remove()">`
        : "";

    return `
        <tr data-id="${membro.idUsuario}">
            <td class="equipe-col-avatar">
                <span class="equipe-avatar" style="background-color: ${cor};">${escapar(pegarIniciais(membro.nome))}${foto}</span>
            </td>
            <td class="equipe-member-name">${escapar(membro.nome)}</td>
            <td class="equipe-member-email">${escapar(membro.email)}</td>
            <td>
                <span class="equipe-badge ${classeCargo}">${escapar(nomeCargo)}</span>
            </td>
            <td class="equipe-col-actions">${acoes}
            </td>
        </tr>`;
}

function carregarEquipe(busca) {
    fetch(`/equipe/${idUsuario}?busca=${encodeURIComponent(busca || "")}`, {
        method: "GET"
    }).then(function (resposta) {
        // 403 = usuário não é administrador (a API também bloqueia)
        if (resposta.status == 403) {
            mostrarAcessoRestrito();
            throw ("Acesso restrito a administradores.");
        }

        if (!resposta.ok) {
            throw ("Houve um erro ao carregar a equipe!");
        }
        return resposta.json();
    }).then(function (membros) {
        var tabela = document.getElementById("tabela_equipe");

        if (membros.length == 0) {
            tabela.innerHTML = `<tr><td colspan="5" class="equipe-empty">Nenhum membro encontrado.</td></tr>`;
        } else {
            tabela.innerHTML = membros.map(montarLinha).join("");
        }

        document.getElementById("total_membros").innerText =
            `${membros.length} ${membros.length == 1 ? "membro" : "membros"}`;
    }).catch(function (erro) {
        console.log(`#ERRO: ${erro}`);
    });
}

// ---------- remover membro ----------

function removerMembro(idMembro) {
    if (!confirm("Deseja realmente remover este membro?")) {
        return;
    }

    fetch(`/equipe/${idUsuario}/${idMembro}`, {
        method: "DELETE"
    }).then(function (resposta) {
        if (resposta.ok) {
            carregarEquipe(document.getElementById("input_busca").value);
        } else {
            resposta.json().then(function (erro) {
                alert(erro.message);
            });
        }
    }).catch(function (erro) {
        console.log(`#ERRO: ${erro}`);
    });
}

// um único listener para todos os botões de remover da tabela
document.getElementById("tabela_equipe").addEventListener("click", function (evento) {
    var botao = evento.target.closest(".equipe-btn-delete");

    if (botao) {
        removerMembro(botao.closest("tr").dataset.id);
    }
});

// ---------- busca por nome (espera 300ms depois de parar de digitar) ----------

var temporizadorBusca;

document.getElementById("input_busca").addEventListener("input", function () {
    clearTimeout(temporizadorBusca);

    var texto = this.value;
    temporizadorBusca = setTimeout(function () {
        carregarEquipe(texto);
    }, 300);
});

// ---------- código da empresa ----------

function carregarCodigo() {
    fetch(`/equipe/codigo/${idUsuario}`, {
        method: "GET"
    }).then(function (resposta) {
        if (!resposta.ok) {
            throw ("Houve um erro ao carregar o código da empresa!");
        }
        return resposta.json();
    }).then(function (json) {
        document.getElementById("codigo_empresa").innerText = json.codigo;
    }).catch(function (erro) {
        console.log(`#ERRO: ${erro}`);
    });
}

var btnCopiar = document.getElementById("btn_copiar_codigo");

btnCopiar.addEventListener("click", async function () {
    var codigo = document.getElementById("codigo_empresa").innerText;

    try {
        await navigator.clipboard.writeText(codigo);

        // feedback visual: troca o ícone por um check por 1.5s
        var icone = btnCopiar.querySelector("i");
        icone.className = "bi bi-check2";
        btnCopiar.classList.add("copiado");

        setTimeout(function () {
            icone.className = "bi bi-copy";
            btnCopiar.classList.remove("copiado");
        }, 1500);
    } catch (erro) {
        console.error("Não foi possível copiar o código:", erro);
    }
});

// ---------- início ----------
// libera a página só se o cargo da sessão (salvo no login) for administrador
if (sessionStorage.getItem("CARGO_USUARIO") != "administrador") {
    mostrarAcessoRestrito();
} else {
    carregarCodigo();
    carregarEquipe("");
}