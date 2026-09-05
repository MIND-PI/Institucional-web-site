var express = require("express");
var router = express.Router();
var usuarioController = require("../controllers/usuarioController");
const upload = require("../config/configUpload");

//Recebendo os dados do html e direcionando para a função cadastrar de usuarioController.js
router.post("/cadastrar", function (req, res) {
    usuarioController.cadastrar(req, res);
})

router.post("/autenticar", function (req, res) {
    usuarioController.autenticar(req, res);
});

router.get('/:id', (req, res) => {
    usuarioController.buscarUsuarioPeloId(req, res);
});

router.put("/atualizar/:id", upload.single('imagemPerfil'), function (req, res) {
    usuarioController.atualizarPerfil(req, res);
});

module.exports = router;