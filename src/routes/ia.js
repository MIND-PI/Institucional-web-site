var express = require("express");
var router = express.Router();
var iaController = require("../controllers/iaController");

// Pegar resposta da ia
router.post("/response-micro/", function (req, res) {
    iaController.responseDashMicro(req, res)
});
router.post('/jira', iaController.responseDashJira);

module.exports = router;