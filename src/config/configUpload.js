const multer = require('multer');

// Diretório onde os arquivos serão salvos
// ATENÇÃO: É necessário manter o diretório 'public' para poder utilizar no front-end

// Armazena um arquivo como buffer na memória ram do servidor
const storage = multer.memoryStorage()

module.exports = multer({ storage });