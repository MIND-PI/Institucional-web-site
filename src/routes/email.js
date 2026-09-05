var express = require("express");
var router = express.Router();

var emailController = require("../controllers/emailController");


router.post("/enviarEmail", function (req, res) {
    emailController.enviarEmail(req, res);
})

module.exports = router;