DROP DATABASE IF EXISTS mind;
CREATE DATABASE IF NOT EXISTS mind;
USE mind;


CREATE TABLE empresa (
    idempresa INT AUTO_INCREMENT PRIMARY KEY,
    cod_ativacao VARCHAR(45) DEFAULT (HEX(RANDOM_BYTES(4))),
    razao_social VARCHAR(100),
    nome_fantasia VARCHAR(100),
    empresa_fornecedora INT,
    tipoEmpresa VARCHAR(45),
    CONSTRAINT fk_empresa_fornecedora 
        FOREIGN KEY (empresa_fornecedora) 
        REFERENCES empresa(idempresa)
);


CREATE TABLE usuario (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(50),
    email VARCHAR(50),
    senha VARCHAR(50),
    nivel TINYINT,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    desativado_em TIMESTAMP NULL,
    empresa_idempresa INT,
    CONSTRAINT fk_usuario_empresa 
        FOREIGN KEY (empresa_idempresa) 
        REFERENCES empresa(idempresa)
);


CREATE TABLE clp (
    id INT AUTO_INCREMENT PRIMARY KEY,
    modelo VARCHAR(100),
    fonte_alimentacao VARCHAR(10),
    localizacao VARCHAR(100),
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    desativado_em TIMESTAMP NULL,
    empresa_idempresa INT,
    CONSTRAINT fk_clp_empresa 
        FOREIGN KEY (empresa_idempresa) 
        REFERENCES empresa(idempresa)
);


CREATE TABLE recurso (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome_recurso VARCHAR(100),
    unidade_medida VARCHAR(5),
    descricao VARCHAR(100),
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    desativado_em TIMESTAMP NULL
);


CREATE TABLE recurso_monitorado (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_clp INT,
    id_recurso INT,
    status_recurso TINYINT,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    desativado_em TIMESTAMP NULL,
    parametro_alerta VARCHAR(45),
    CONSTRAINT fk_recurso_monitorado_clp 
        FOREIGN KEY (id_clp) 
        REFERENCES clp(id),
    CONSTRAINT fk_recurso_monitorado_recurso 
        FOREIGN KEY (id_recurso) 
        REFERENCES recurso(id)
);


CREATE TABLE alerta (
    id INT AUTO_INCREMENT PRIMARY KEY,
    descricao VARCHAR(255),
    prioridade TINYINT,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    desativado_em TIMESTAMP NULL
);


CREATE TABLE historico_alertas (
    alerta_id INT,
    recurso_monitorado_id INT,
    PRIMARY KEY (alerta_id, recurso_monitorado_id),
    CONSTRAINT fk_historico_alerta 
        FOREIGN KEY (alerta_id) 
        REFERENCES alerta(id),
    CONSTRAINT fk_historico_recurso_monitorado 
        FOREIGN KEY (recurso_monitorado_id) 
        REFERENCES recurso_monitorado(id)
);