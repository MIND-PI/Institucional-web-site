function renderAside() {
    const nav_flow = document.getElementById("nav_flow")

    const paginaAtual = window.location.pathname.split("/").pop();
    let pags = {
        "fornecedor": {
            "pages": [
                { nome: "Dashboard", icone: "bi-bar-chart-fill", link: "./dashboard-fornecedor.html" },
                { nome: "Gerenciamento modelo", icone: "bi-cpu", link: "./gerenciamento-modelo.html" },
                { nome: "Gerenciamento cliente", icone: "bi-person-video2", link: "./gerenciamento-cliente.html" }
            ]
        },
        "cliente": {
            "pages": [
                { nome: "Dashboard", icone: "bi-bar-chart-fill", link: "./dashboard-cliente.html" },
                { nome: "Gerenciamento clps", icone: "bi-cpu", link: "./gerenciamento-clp.html" }
            ]
        }
    }

    let type = sessionStorage.getItem("TIPO_EMPRESA").toLocaleLowerCase() == "fornecedor" ? pags["fornecedor"] : pags["cliente"]

    type.pages.forEach(pag => {
        const paginaAtiva = pag.link.split("/").pop();
        
        nav_flow.insertAdjacentHTML("beforeend", `
        <li class="nav-item">
            <a href="${pag.link}" class="nav-link ${paginaAtual == paginaAtiva ? "active" : ""}">
                <i class="bi ${pag.icone}"></i>
                ${pag.nome}
            </a>
        </li>
    `);
    })

    if (sessionStorage.getItem("CARGO_USUARIO").toLocaleLowerCase() === "administrador") {
        nav_flow.insertAdjacentHTML("beforeend", `
        <li class="nav-item">
            <a href="./equipe.html" class="nav-link ${paginaAtual == "equipe.html" ? "active" : ""}">
                <i class="bi bi-people-fill"></i>
                Equipe
            </a>
        </li>`)
    }

    nav_title.innerHTML = `FLUXO DO ${ sessionStorage.getItem("TIPO_EMPRESA").toLocaleLowerCase() == "fornecedor" ? "FORNECEDOR" : "CLIENTE" }`
    tipoUsuario.innerHTML = sessionStorage.getItem("TIPO_EMPRESA").toLocaleLowerCase() == "fornecedor" ? "FORNECEDOR" : "CLIENTE" 
}


const menuMobile = document.getElementById("menuMobile");
const sidebar = document.getElementById("sidebar");
const iconMenu = menuMobile.querySelector("i");

menuMobile.addEventListener("click", () => {
    const aberto = sidebar.classList.toggle("menu-open");

    menuMobile.dataset.open = aberto;

    iconMenu.classList.remove(
        menuMobile.dataset.close,
        menuMobile.dataset.iconOpen
    );

    iconMenu.classList.add(
        aberto
            ? menuMobile.dataset.iconOpen
            : menuMobile.dataset.close
    );
});

renderAside()