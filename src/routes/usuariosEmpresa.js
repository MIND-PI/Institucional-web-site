var express = require("express");
var router = express.Router();
var usuarioEmpresaController = require("../controllers/usuarioEmpresaController");
const upload = require("../config/configUpload");

//Recebendo os dados do html e direcionando para a função cadastrar de usuarioEmpresaController.js
router.post("/cadastrar", function (req, res) {
    usuarioEmpresaController.cadastrar(req, res);
})

router.post("/autenticar", function (req, res) {
    usuarioEmpresaController.autenticar(req, res);
});

router.get('/:idEmpresa', (req, res) => {
    usuarioEmpresaController.buscarEmpresaPeloId(req, res);
});

router.put("/atualizar/:idEmpresa", upload.single('imagemPerfil'), function (req, res) {
    usuarioEmpresaController.atualizarPerfil(req, res);
});

module.exports = router;