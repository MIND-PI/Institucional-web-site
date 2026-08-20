function showSidebar() {
    const container = document.querySelector('header .container');
    container.classList.add('active');
}

function hideSidebar() {
    const container = document.querySelector('header .container');
    container.classList.remove('active');
}