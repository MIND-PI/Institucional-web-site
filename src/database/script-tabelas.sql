DROP DATABASE IF EXISTS mind;
CREATE DATABASE IF NOT EXISTS mind;
USE mind;

CREATE TABLE empresa(
    idEmpresa INT PRIMARY KEY AUTO_INCREMENT,
    nome_fantasia VARCHAR(255),
    razao_social VARCHAR(255),
    cnpj VARCHAR(14),
    data_criacao DATETIME,
    data_atualizacao DATETIME,
    codigo_ativacao VARCHAR(16),
    fornecedorId INT,

    CONSTRAINT fk_empresa_fornecedor
        FOREIGN KEY (fornecedorId)
        REFERENCES empresa(idEmpresa)
);

CREATE TABLE usuario(
    idUsuario INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(100),
    email VARCHAR(200),
    senha VARCHAR(100),
    empresaId INT,
    cargo VARCHAR(100),
    responsavel INT,
    data_criacao DATETIME,
    data_atualizacao DATETIME,

    CONSTRAINT fk_usuario_empresa
        FOREIGN KEY (empresaId)
        REFERENCES empresa(idEmpresa),

    CONSTRAINT fk_usuario_responsavel
        FOREIGN KEY (responsavel)
        REFERENCES usuario(idUsuario)
);

CREATE TABLE modelo(
    idmodelo INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(45)
);

CREATE TABLE clp(
    idClp INT PRIMARY KEY AUTO_INCREMENT,
    empresaId INT,
    data_criacao DATETIME,
    data_atualizacao DATETIME,
    status TINYINT,
    modeloId INT,

    CONSTRAINT fk_clp_empresa
        FOREIGN KEY (empresaId)
        REFERENCES empresa(idEmpresa),

    CONSTRAINT fk_clp_modelo
        FOREIGN KEY (modeloId)
        REFERENCES modelo(idmodelo)
);

CREATE TABLE tipo_medicao(
    idTipoMedicao INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(45),
    unidade_medida VARCHAR(45),
    apelido VARCHAR(45),
    descricao TEXT
);

CREATE TABLE clp_medicao(
    servidorId INT,
    medicaoId INT,
    ativo TINYINT,
    parametro INT,

    PRIMARY KEY (servidorId, medicaoId),

    CONSTRAINT fk_clp_medicao_clp
        FOREIGN KEY (servidorId)
        REFERENCES clp(idClp),

    CONSTRAINT fk_clp_medicao_tipo
        FOREIGN KEY (medicaoId)
        REFERENCES tipo_medicao(idTipoMedicao)
);