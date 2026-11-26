DROP DATABASE IF EXISTS mind;
CREATE DATABASE IF NOT EXISTS mind;
USE mind;

CREATE TABLE empresa(
	idEmpresa INT PRIMARY KEY AUTO_INCREMENT,
	nome_fantasia VARCHAR(255),
	razao_social VARCHAR(255),
	cnpj VARCHAR(14) UNIQUE,
	data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP,
	data_atualizacao DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	codigo_ativacao VARCHAR(16),
	setor VARCHAR(100) DEFAULT 'fornecedor',
	tipo VARCHAR(100) DEFAULT 'fornecedor' CHECK (tipo IN ('fornecedor', 'cliente fornecedor')) NOT NULL,
	status TINYINT DEFAULT 1
);

CREATE TABLE ativacao(
	idFornecedor INT,
	idCliente INT,
	status TINYINT DEFAULT 1,
	PRIMARY KEY(idFornecedor, idCliente),

	FOREIGN KEY (idFornecedor) REFERENCES empresa(idEmpresa),
	FOREIGN KEY (idCliente) REFERENCES empresa(idEmpresa)
);

CREATE TABLE usuario(
	idUsuario INT PRIMARY KEY AUTO_INCREMENT,
	nome VARCHAR(100),
	email VARCHAR(200) UNIQUE,
	senha VARCHAR(100),
	empresaId INT,
	cargo VARCHAR(20) NOT NULL DEFAULT 'funcionario',
	responsavel INT,
	data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP,
	data_atualizacao DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	url_img VARCHAR(1000),
	status TINYINT DEFAULT 1,

	CONSTRAINT chk_usuario_cargo
		CHECK (cargo IN ('administrador', 'funcionario')),

	CONSTRAINT fk_usuario_empresa
		FOREIGN KEY (empresaId)
		REFERENCES empresa(idEmpresa),

	CONSTRAINT fk_usuario_responsavel
		FOREIGN KEY (responsavel)
		REFERENCES usuario(idUsuario)
);

CREATE TABLE modelo(
	idmodelo INT PRIMARY KEY AUTO_INCREMENT,
	nome VARCHAR(45),
	status TINYINT DEFAULT 1,
	empresaId INT,
	data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP,
	data_atualizacao DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

	CONSTRAINT fk_modelo_empresa
		FOREIGN KEY (empresaId)
		REFERENCES empresa(idEmpresa)
);

CREATE TABLE localizacao(
	idLocalizacao INT PRIMARY KEY AUTO_INCREMENT,
	empresaId INT NOT NULL,
	nome VARCHAR(255) NOT NULL,

	UNIQUE KEY uq_localizacao_empresa_nome (empresaId, nome),
	FOREIGN KEY (empresaId) REFERENCES empresa(idEmpresa)
);

CREATE TABLE clp(
	idClp INT AUTO_INCREMENT PRIMARY KEY,
	nome VARCHAR(100),
	mac_address VARCHAR(17) UNIQUE,
	empresaId INT,
	data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP,
	data_atualizacao DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	status TINYINT,
	modeloId INT,
    localizacaoId INT,

	CONSTRAINT fk_clp_empresa
		FOREIGN KEY (empresaId)
		REFERENCES empresa(idEmpresa),

	CONSTRAINT fk_clp_modelo
		FOREIGN KEY (modeloId)
		REFERENCES modelo(idmodelo),
        
	CONSTRAINT fk_localizacao
		FOREIGN KEY (localizacaoId)
        REFERENCES localizacao(idLocalizacao)
);

CREATE TABLE tipo_medicao(
	idTipoMedicao INT PRIMARY KEY AUTO_INCREMENT,
	nome VARCHAR(100),
	unidade_medida VARCHAR(100),
	apelido VARCHAR(45),
	descricao TEXT
);

CREATE TABLE clp_medicao(
	clpId INT,
	tipoMedicaoId INT,
	status TINYINT,
	parametro INT,

	PRIMARY KEY (clpId, tipoMedicaoId),

	CONSTRAINT fk_clp_medicao_clp
		FOREIGN KEY (clpId)
		REFERENCES clp(idClp),

	CONSTRAINT fk_clp_medicao_tipo
		FOREIGN KEY (tipoMedicaoId)
		REFERENCES tipo_medicao(idTipoMedicao)
);


-- =========================================================
-- EMPRESAS
-- Fornecedores (fabricantes de CLP):
-- 1 = Siemens
-- 2 = Schneider Electric
-- 3 = Rockwell Automation
-- Clientes:
-- 4 = Mitsubishi Electric
-- 5 = Petrobras
-- 6 = Vale
-- 7 = Gerdau
-- 8 = Suzano
-- 9 = Braskem
-- 10 = Ambev
-- =========================================================

-- =========================================================
-- FORNECEDORES (fabricantes de CLP)
-- =========================================================

INSERT INTO empresa
(idEmpresa, nome_fantasia, razao_social, cnpj, codigo_ativacao, setor, tipo)
VALUES
(1,
 'Siemens',
 'Siemens Brasil Ltda.',
 '00000000000101',
 'SIEMENS2026',
 'fornecedor',
 default),

(2,
 'Schneider Electric',
 'Schneider Electric Brasil Ltda.',
 '00000000000202',
 'SCHNEI2026',
 'fornecedor',
 default),

(3,
 'Rockwell Automation',
 'Rockwell Automation do Brasil Ltda.',
 '00000000000303',
 'ROCK2026',
 'fornecedor',
 default),


-- =========================================================
-- CLIENTES
-- =========================================================

(4,
 'Mitsubishi Electric',
 'Mitsubishi Electric do Brasil Comércio e Serviços Ltda.',
 '00000000000404',
 'MITSU2026',
 'Automação Industrial',
 'cliente fornecedor'),

(5,
 'Petrobras',
 'Petróleo Brasileiro S.A. - Petrobras',
 '00000000000505',
 'PETRO2026',
 'Óleo e Gás',
 'cliente fornecedor'),

(6,
 'Vale',
 'Vale S.A.',
 '00000000000606',
 'VALE2026',
 'Mineração',
 'cliente fornecedor'),

(7,
 'Gerdau',
 'Gerdau S.A.',
 '00000000000707',
 'GERDAU2026',
 'Siderurgia',
 'cliente fornecedor'),

(8,
 'Suzano',
 'Suzano S.A.',
 '00000000000808',
 'SUZANO2026',
 'Papel e Celulose',
 'cliente fornecedor'),

(9,
 'Braskem',
 'Braskem S.A.',
 '00000000000909',
 'BRASK2026',
 'Petroquímica',
 'cliente fornecedor'),

(10,
 'Ambev',
 'Ambev S.A.',
 '00000000001010',
 'AMBEV2026',
 'Bebidas',
 'cliente fornecedor');

-- ===============================================
-- ATIVAÇÃO (fornecedor ativou o cliente)
-- ===============================================
INSERT INTO ativacao(idFornecedor, idCliente) VALUES
(1,4),
(1,5),
(2,6),
(2,7),
(3,8),
(1,9),
(3,10);

-- ===============================================
-- USUÁRIOS (inclui as proto-personas)
-- Regra: cada empresa tem 4 usuários.
-- Quando responsavel é NULL, o usuário é o responsável
-- (super administrador) da empresa. Os demais apontam para ele.
-- Cada super administrador é inserido antes dos usuários dele.
-- ===============================================
INSERT INTO usuario
(idUsuario, nome, email, senha, empresaId, cargo, responsavel, url_img)
VALUES

-- Super administradores das proto-personas
-- Siemens | Gerente de Pós Venda e Suporte Técnico
(1, 'Lídia Almeida', 'lidia.almeida@siemens.com', 'urubu100', 1, 'administrador', NULL, NULL),

-- Mitsubishi Electric | Gestor da Operação Industrial
(2, 'Rogério Andrade', 'rogerio.andrade@mitsubishi.com', 'urubu100', 4, 'administrador', NULL, NULL),

-- Petrobras | Analista de Automação
(3, 'Carlos Mendes', 'carlos.mendes@petrobras.com', 'urubu100', 5, 'administrador', NULL, NULL),

-- Gerdau | Coordenadora de Manutenção
(4, 'Fernanda Costa', 'fernanda.costa@gerdau.com', 'urubu100', 7, 'administrador', NULL, NULL),

-- Siemens (responsável = Lídia)
(5, 'Fernanda Lima', 'fernanda.lima@siemens.com', 'urubu100', 1, 'funcionario', 1, NULL),
(6, 'Rafael Souza', 'rafael.souza@siemens.com', 'urubu100', 1, 'funcionario', 1, NULL),

-- Siemens | Analista de Pós Venda (responsável = Lídia)
(7, 'Amanda Moreira', 'amanda.moreira@siemens.com', 'urubu100', 1, 'funcionario', 1, NULL),

-- Siemens (responsável = Lídia)
(8, 'Bruno Teixeira', 'bruno.teixeira@siemens.com', 'urubu100', 1, 'administrador', 1, NULL),

-- Mitsubishi Electric (responsável = Rogério)
(9,  'Patrícia Nakamura', 'patricia.nakamura@mitsubishi.com', 'urubu100', 4, 'administrador', 2, NULL),
(10, 'Henrique Tanaka', 'henrique.tanaka@mitsubishi.com', 'urubu100', 4, 'funcionario', 2, NULL),
(11, 'Juliana Ferreira', 'juliana.ferreira@mitsubishi.com', 'urubu100', 4, 'funcionario', 2, NULL),

-- Petrobras (responsável = Carlos)
(12, 'Marcelo Barros', 'marcelo.barros@petrobras.com', 'urubu100', 5, 'administrador', 3, NULL),
(13, 'Renata Duarte', 'renata.duarte@petrobras.com', 'urubu100', 5, 'funcionario', 3, NULL),
(14, 'Thiago Nogueira', 'thiago.nogueira@petrobras.com', 'urubu100', 5, 'funcionario', 3, NULL),

-- Gerdau (responsável = Fernanda Costa)
(15, 'Eduardo Pires', 'eduardo.pires@gerdau.com', 'urubu100', 7, 'administrador', 4, NULL),
(16, 'Camila Rocha', 'camila.rocha@gerdau.com', 'urubu100', 7, 'funcionario', 4, NULL),

-- Schneider Electric
(17, 'Paulo Vieira', 'paulo.vieira@schneider-electric.com', 'urubu100', 2, 'administrador', NULL, NULL),
(18, 'Larissa Campos', 'larissa.campos@schneider-electric.com', 'urubu100', 2, 'administrador', 17, NULL),
(19, 'Diego Martins', 'diego.martins@schneider-electric.com', 'urubu100', 2, 'funcionario', 17, NULL),
(20, 'Beatriz Freitas', 'beatriz.freitas@schneider-electric.com', 'urubu100', 2, 'funcionario', 17, NULL),

-- Rockwell Automation
(21, 'Sérgio Lopes', 'sergio.lopes@rockwellautomation.com', 'urubu100', 3, 'administrador', NULL, NULL),
(22, 'Aline Cardoso', 'aline.cardoso@rockwellautomation.com', 'urubu100', 3, 'administrador', 21, NULL),
(23, 'Gustavo Ribeiro', 'gustavo.ribeiro@rockwellautomation.com', 'urubu100', 3, 'funcionario', 21, NULL),
(24, 'Mariana Azevedo', 'mariana.azevedo@rockwellautomation.com', 'urubu100', 3, 'funcionario', 21, NULL),

-- Vale
(25, 'Ricardo Monteiro', 'ricardo.monteiro@vale.com', 'urubu100', 6, 'administrador', NULL, NULL),
(26, 'Tatiane Gomes', 'tatiane.gomes@vale.com', 'urubu100', 6, 'administrador', 25, NULL),
(27, 'Leandro Cunha', 'leandro.cunha@vale.com', 'urubu100', 6, 'funcionario', 25, NULL),
(28, 'Vanessa Castro', 'vanessa.castro@vale.com', 'urubu100', 6, 'funcionario', 25, NULL),

-- Suzano
(29, 'André Pacheco', 'andre.pacheco@suzano.com.br', 'urubu100', 8, 'administrador', NULL, NULL),
(30, 'Carolina Dias', 'carolina.dias@suzano.com.br', 'urubu100', 8, 'administrador', 29, NULL),
(31, 'Felipe Araújo', 'felipe.araujo@suzano.com.br', 'urubu100', 8, 'funcionario', 29, NULL),
(32, 'Bianca Moura', 'bianca.moura@suzano.com.br', 'urubu100', 8, 'funcionario', 29, NULL),

-- Braskem
(33, 'Roberto Siqueira', 'roberto.siqueira@braskem.com', 'urubu100', 9, 'administrador', NULL, NULL),
(34, 'Priscila Ramos', 'priscila.ramos@braskem.com', 'urubu100', 9, 'administrador', 33, NULL),
(35, 'Lucas Batista', 'lucas.batista@braskem.com', 'urubu100', 9, 'funcionario', 33, NULL),
(36, 'Daniela Farias', 'daniela.farias@braskem.com', 'urubu100', 9, 'funcionario', 33, NULL),

-- Ambev
(37, 'Marcos Vasconcelos', 'marcos.vasconcelos@ambev.com.br', 'urubu100', 10, 'administrador', NULL, NULL),
(38, 'Gabriela Torres', 'gabriela.torres@ambev.com.br', 'urubu100', 10, 'administrador', 37, NULL),
(39, 'Rodrigo Menezes', 'rodrigo.menezes@ambev.com.br', 'urubu100', 10, 'funcionario', 37, NULL),
(40, 'Isabela Correia', 'isabela.correia@ambev.com.br', 'urubu100', 10, 'funcionario', 37, NULL);

-- ============================================
-- MODELOS DE CLP (status assume o default 1)
-- ============================================

INSERT INTO modelo
(idmodelo, nome, empresaId)
VALUES

-- Modelos Siemens
(1, 'SIMATIC S7-1200', 1),
(2, 'SIMATIC S7-1500', 1),

-- Modelos Schneider
(3, 'Modicon M340', 2),
(4, 'Modicon M580', 2),

-- Modelos Rockwell
(5, 'ControlLogix', 3),
(6, 'CompactLogix', 3);

-- =========================================================
-- TIPOS DE MEDIÇÃO
-- =========================================================

INSERT INTO tipo_medicao
(idTipoMedicao, nome, unidade_medida, apelido, descricao)
VALUES

-- 1
(1,
 'Utilização de CPU',
 '%',
 'CPU',
 'Percentual de utilização do processador do sistema monitorado.'),

-- 2
(2,
 'Utilização de RAM',
 '%',
 'RAM',
 'Percentual de utilização da memória RAM do sistema monitorado.'),

-- 3
(3,
 'Uptime do Sistema',
 '%',
 'UPTIME',
 'Percentual de disponibilidade do sistema durante o período monitorado.'),

-- 4
(4,
 'Utilização de Memória Swap',
 '%',
 'SWAP',
 'Percentual de utilização da memória swap do sistema.'),

-- 5
(5,
 'Scan Time',
 'ms',
 'SCAN',
 'Tempo necessário para a execução de um ciclo do sistema monitorado.'),

-- 6
(6,
 'Latência de Rede',
 'ms',
 'PING',
 'Tempo de resposta da comunicação entre o sistema monitorado e o destino configurado.'),

-- 7
(7,
 'Perda de Pacotes',
 'pacotes',
 'LOSS',
 'Quantidade de pacotes perdidos durante a comunicação de rede do sistema monitorado.'),

-- 8
(8,
 'Dados Enviados',
 'GB',
 'UPLOAD',
 'Quantidade acumulada de dados enviados pela interface de rede.'),

-- 9
(9,
 'Dados Recebidos',
 'GB',
 'DOWNLOAD',
 'Quantidade acumulada de dados recebidos pela interface de rede.'),

-- 10
(10,
 'Processos de Maior Consumo',
 'processos',
 'PROCESSOS',
 'Ranking dos processos que apresentam maior utilização de CPU no sistema monitorado.'),

-- 11
(11,
 'Health Score',
 'pontos',
 'HEALTH',
 'Pontuação de 0 a 100 que resume a saúde geral do sistema monitorado, combinando as demais métricas.');

-- =========================================================
-- LOCALIZAÇÕES
-- =========================================================
INSERT INTO localizacao (empresaId, nome) VALUES
-- Mitsubishi Electric (empresaId = 4)
(4, 'Planta Industrial - Linha de Produção 01'),
(4, 'Planta Industrial - Linha de Produção 02'),
(4, 'Planta Industrial - Área de Envase'),

-- Petrobras (empresaId = 5)
(5, 'Plataforma Offshore - Sala de Controle'),
(5, 'Plataforma Offshore - Sistema de Compressão'),
(5, 'Plataforma Offshore - Sistema de Bombeamento'),

-- Vale (empresaId = 6)
(6, 'Complexo Industrial - Britagem'),
(6, 'Complexo Industrial - Correias Transportadoras'),
(6, 'Complexo Industrial - Beneficiamento'),

-- Gerdau (empresaId = 7)
(7, 'Usina - Linha de Laminação'),
(7, 'Usina - Forno Industrial'),

-- Suzano (empresaId = 8)
(8, 'Unidade Industrial - Linha de Celulose'),
(8, 'Unidade Industrial - Caldeira'),

-- Braskem (empresaId = 9)
(9, 'Polo Petroquímico - Unidade de Produção'),
(9, 'Polo Petroquímico - Sistema de Resfriamento'),

-- Ambev (empresaId = 10)
(10, 'Fábrica - Linha de Envase'),
(10, 'Fábrica - Linha de Produção');

-- =========================================================
-- CLPs DOS CLIENTES
-- =========================================================
INSERT INTO clp
(idClp, nome, mac_address, empresaId, status, modeloId, localizacaoId)
VALUES
(1,  'CLP Linha de Produção 01',     '00:1B:1B:00:00:01', 4,  1, 1, 1),
(2,  'CLP Linha de Produção 02',     '00:1B:1B:00:00:02', 4,  1, 2, 2),
(3,  'CLP Área de Envase',           '00:1B:1B:00:00:03', 4,  0, 1, 3),
(4,  'CLP Sala de Controle',         '00:1B:1B:00:00:04', 5,  1, 2, 4),
(5,  'CLP Sistema de Compressão',    '00:1B:1B:00:00:05', 5,  1, 2, 5),
(6,  'CLP Sistema de Bombeamento',   '00:1B:1B:00:00:06', 5,  0, 1, 6),
(7,  'CLP Britagem',                 '00:80:F4:00:00:07', 6,  1, 4, 7),
(8,  'CLP Correias Transportadoras', '00:80:F4:00:00:08', 6,  1, 3, 8),
(9,  'CLP Beneficiamento',           '00:80:F4:00:00:09', 6,  0, 4, 9),
(10, 'CLP Linha de Laminação',       '00:80:F4:00:00:0A', 7,  1, 3, 10),
(11, 'CLP Forno Industrial',         '00:80:F4:00:00:0B', 7,  1, 4, 11),
(12, 'CLP Linha de Celulose',        '00:00:BC:00:00:0C', 8,  1, 5, 12),
(13, 'CLP Caldeira',                 '00:00:BC:00:00:0D', 8,  0, 6, 13),
(14, 'CLP Unidade de Produção',      '00:1B:1B:00:00:0E', 9,  1, 1, 14),
(15, 'CLP Sistema de Resfriamento',  '00:1B:1B:00:00:0F', 9,  1, 2, 15),
(16, 'CLP Linha de Envase',          '00:00:BC:00:00:10', 10, 1, 5, 16),
(17, 'CLP Linha de Produção',        '00:00:BC:00:00:11', 10, 1, 6, 17);

-- =========================================================
-- MEDIÇÕES DOS CLPs (clp_medicao)
-- Colunas: clpId, tipoMedicaoId, status, parametro
-- =========================================================
INSERT INTO clp_medicao (clpId, tipoMedicaoId, status, parametro) VALUES

-- CLP 1 | Mitsubishi | S7-1200
(1,1,1,80),(1,2,1,80),(1,3,1,95),(1,4,1,50),(1,5,1,20),(1,6,1,100),
(1,7,1,10),(1,8,1,100),(1,9,1,100),(1,10,1,5),(1,11,1,60),

-- CLP 2 | Mitsubishi | S7-1500
(2,1,1,80),(2,2,1,80),(2,3,1,95),(2,4,1,50),(2,5,1,10),(2,6,1,100),
(2,7,1,10),(2,8,1,100),(2,9,1,100),(2,10,1,5),(2,11,1,60),

-- CLP 3 | Mitsubishi | S7-1200 (inativo)
(3,1,0,80),(3,2,0,80),(3,3,0,95),(3,4,0,50),(3,5,0,20),(3,6,0,100),
(3,7,0,10),(3,8,0,100),(3,9,0,100),(3,10,0,5),(3,11,0,60),

-- CLP 4 | Petrobras | S7-1500
(4,1,1,80),(4,2,1,80),(4,3,1,95),(4,4,1,50),(4,5,1,10),(4,6,1,100),
(4,7,1,10),(4,8,1,100),(4,9,1,100),(4,10,1,5),(4,11,1,60),

-- CLP 5 | Petrobras | S7-1500
(5,1,1,80),(5,2,1,80),(5,3,1,95),(5,4,1,50),(5,5,1,10),(5,6,1,100),
(5,7,1,10),(5,8,1,100),(5,9,1,100),(5,10,1,5),(5,11,1,60),

-- CLP 6 | Petrobras | S7-1200 (inativo)
(6,1,0,80),(6,2,0,80),(6,3,0,95),(6,4,0,50),(6,5,0,20),(6,6,0,100),
(6,7,0,10),(6,8,0,100),(6,9,0,100),(6,10,0,5),(6,11,0,60),

-- CLP 7 | Vale | M580
(7,1,1,80),(7,2,1,80),(7,3,1,95),(7,4,1,50),(7,5,1,10),(7,6,1,100),
(7,7,1,10),(7,8,1,100),(7,9,1,100),(7,10,1,5),(7,11,1,60),

-- CLP 8 | Vale | M340
(8,1,1,80),(8,2,1,80),(8,3,1,95),(8,4,1,50),(8,5,1,15),(8,6,1,100),
(8,7,1,10),(8,8,1,100),(8,9,1,100),(8,10,1,5),(8,11,1,60),

-- CLP 9 | Vale | M580 (inativo)
(9,1,0,80),(9,2,0,80),(9,3,0,95),(9,4,0,50),(9,5,0,10),(9,6,0,100),
(9,7,0,10),(9,8,0,100),(9,9,0,100),(9,10,0,5),(9,11,0,60),

-- CLP 10 | Gerdau | M340
(10,1,1,80),(10,2,1,80),(10,3,1,95),(10,4,1,50),(10,5,1,15),(10,6,1,100),
(10,7,1,10),(10,8,1,100),(10,9,1,100),(10,10,1,5),(10,11,1,60),

-- CLP 11 | Gerdau | M580
(11,1,1,80),(11,2,1,80),(11,3,1,95),(11,4,1,50),(11,5,1,10),(11,6,1,100),
(11,7,1,10),(11,8,1,100),(11,9,1,100),(11,10,1,5),(11,11,1,60),

-- CLP 12 | Suzano | ControlLogix
(12,1,1,80),(12,2,1,80),(12,3,1,95),(12,4,1,50),(12,5,1,8),(12,6,1,100),
(12,7,1,10),(12,8,1,100),(12,9,1,100),(12,10,1,5),(12,11,1,60),

-- CLP 13 | Suzano | CompactLogix (inativo)
(13,1,0,80),(13,2,0,80),(13,3,0,95),(13,4,0,50),(13,5,0,12),(13,6,0,100),
(13,7,0,10),(13,8,0,100),(13,9,0,100),(13,10,0,5),(13,11,0,60),

-- CLP 14 | Braskem | S7-1200
(14,1,1,80),(14,2,1,80),(14,3,1,95),(14,4,1,50),(14,5,1,20),(14,6,1,100),
(14,7,1,10),(14,8,1,100),(14,9,1,100),(14,10,1,5),(14,11,1,60),

-- CLP 15 | Braskem | S7-1500
(15,1,1,80),(15,2,1,80),(15,3,1,95),(15,4,1,50),(15,5,1,10),(15,6,1,100),
(15,7,1,10),(15,8,1,100),(15,9,1,100),(15,10,1,5),(15,11,1,60),

-- CLP 16 | Ambev | ControlLogix
(16,1,1,80),(16,2,1,80),(16,3,1,95),(16,4,1,50),(16,5,1,8),(16,6,1,100),
(16,7,1,10),(16,8,1,100),(16,9,1,100),(16,10,1,5),(16,11,1,60),

-- CLP 17 | Ambev | CompactLogix
(17,1,1,80),(17,2,1,80),(17,3,1,95),(17,4,1,50),(17,5,1,12),(17,6,1,100),
(17,7,1,10),(17,8,1,100),(17,9,1,100),(17,10,1,5),(17,11,1,60);
