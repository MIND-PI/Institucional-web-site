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