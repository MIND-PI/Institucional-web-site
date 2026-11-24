# AGENTS.md — MIND (Monitoramento de CLPs industriais)

> Contexto para agentes de IA que trabalham **somente no projeto Node.js** (`site/`).
> O restante da plataforma (Python, Java, ETL, R) existe, mas fica fora deste repositório: trate-o como
> sistema externo e **não invente código para ele**. Escreva sempre em **português (pt-BR)** nos textos de
> interface, mensagens de erro, comentários e commits, e mantenha os identificadores no padrão já existente.

---

## 1. O que é o MIND

Plataforma de **observabilidade e telemetria de CLPs** (Controladores Lógicos Programáveis) vendida ao
**fornecedor/fabricante de CLPs**, que a estende aos **clientes industriais que compram os CLPs dele**.
Objetivo de negócio: reduzir **microparadas** e **downtime**, apoiar a **manutenção preditiva** e dar ao
fornecedor dados de confiabilidade do produto.

Duas camadas de visibilidade (conceito central — quase toda tela e rota depende dela):

| Visão | Quem | O que vê |
|---|---|---|
| **Macro / Fornecedor** | Empresa `tipo = 'fornecedor'` (Siemens, Schneider, Rockwell) | Frota instalada em **todos os clientes**, agrupada por **modelo**; ranking de modelos, mapa modelo × componente, tendência de Health Score, chamados de pós-venda |
| **Micro / Cliente** | Empresa `tipo = 'cliente fornecedor'` (Petrobras, Vale, Gerdau…) | Só os **próprios CLPs**: saúde em tempo quase real, alertas, previsão, suporte por IA |

Fluxo de negócio: o fornecedor é cadastrado → o cliente é **ativado** pelo fornecedor (tabela `ativacao`) →
o cliente cadastra seus CLPs escolhendo entre os **modelos do fornecedor que o ativou** → baixa o **script de
captura** (zip com `.env`) e instala na máquina do CLP → os dados fluem para o S3 → dashboards.

### Proto-personas (use para decidir prioridade, texto e UX)

| Persona | Cargo / empresa-exemplo | Dor principal | Tela alvo |
|---|---|---|---|
| **Rogério Andrade** | Gestor da Operação Industrial (cliente — Mitsubishi) | Não registra microparadas manualmente; OEE afetado; precisa justificar decisões à diretoria. Quer gráficos em tempo real, KPIs e histórico | Dashboard Macro CLP, Micro CLP, Análise Jira |
| **Amanda Moreira** | Técnica/Gerente de Qualidade (fornecedor — Siemens) | Depende de feedback do cliente; quer tendências por **modelo** de CLP para melhorar produtos | Macro Modelo, Micro Modelo |
| **Lídia Almeida** | Gerente de Pós-Venda e Suporte Técnico (fornecedor — Siemens) | Só sabe do problema quando o cliente reclama; não sabe quais clientes priorizar; sem histórico | Análise de Clientes (pós-venda), chamados Jira |

Usuários de seed ligados às personas: Lídia (id 1, Siemens), Rogério (id 2, Mitsubishi), Carlos Mendes
(Petrobras, analista de automação), Fernanda Costa (Gerdau, coordenadora de manutenção). Senha de todos os seeds: `urubu100`.

### Fora do escopo (não proponha)
Monitorar hardware que não seja CLP/computador industrial; manutenção física; app mobile nativo (é **somente web**,
mas responsivo); outros canais de alerta além de **Slack/Jira/e-mail (Nodemailer)**.

---

## 2. Arquitetura (visão do sistema todo)

```
[CLP + script Python (psutil)] ──CSV──▶ S3 /bronze ──Lambda(Python) ETL──▶ /silver ──ETL──▶ /gold
                                                                              ▲ (analista usa R)
[Java: motor de alertas] ◀─ busca dados (silver) ; grava logs ─▶ bronze ; grava no MySQL
        └─▶ Jira (chamado) ─▶ Slack
[Node.js/Express + front estático] ─ lê JSON do /gold e imagens de perfil (S3) ; lê/escreve MySQL ; link p/ Jira Help Desk
```

- **AWS (us-east-1)**: EC2 (Ubuntu) para o Node, EC2 para o Java, MySQL em **container Docker** em outra EC2, S3 e Lambda.
- **S3 — arquitetura medalhão** (bucket de dados `s3-mind-26`, nome vem de `SCRIPT_BUCKET_NAME`):
  - `bronze/` CSV bruto enviado pelo script: `bronze/{ano}-{mes}-{dia}_{h}-{min}_{idEmpresa}-{idClp}.csv`
  - `silver/` dados tratados · `gold/` **JSONs prontos para dashboard** (é o que o Node consome)
  - **Gold usado pelo código hoje** (fonte da verdade, mais recente):
    `gold/id-empresa-{idFornecedor}/id-modelo-{idModelo}/dashboard-modelo/{24h|7d|30d}/ultimo-resultado.json`
  - Gold descrito na documentação (pode estar parcialmente desatualizado): cliente →
    `gold/id-empresa-{id}/id-clp-{id}/{clp-ultimos-processos,clp-micro,clp-ranking-processos,clp-ping}`;
    fornecedor → `gold/id-empresa-{id}/{modelo-health-score-historico,modelo-health-score-status,modelo-resumo}`
  - **Bucket separado de imagens** (`BUCKET_NAME`): fotos de perfil em `users/{hash}.{ext}`.
- **O Node NÃO calcula Health Score nem métricas**: ele apenas lê o gold já pronto e enriquece com dados do MySQL
  (nome do CLP, cliente, setor, localização). Se o JSON do gold mudar, o contrato muda — pergunte antes de assumir formato.
- A ETL roda de forma **pontual** (não é streaming): dashboards mostram o “último resultado”, não dado ao vivo.

---

## 3. Stack e estrutura do projeto Node

**Stack**: Node.js + Express (arquitetura **MVC em camadas**), `mysql2`, `multer` (memória), `sharp`,
`@aws-sdk/client-s3` + `s3-request-presigner`, `archiver`, `nodemailer`. Front **estático** (HTML + CSS + JS puro,
sem framework/bundler), Chart.js e Bootstrap Icons via CDN.

```
site/
├─ app.js / package.json / .env        # (não enviados ao assistente — ver §10)
├─ src/
│  ├─ routes/        # só mapeia verbo+path → controller (index, usuarios, clp, modelo, microModelo, equipe, email)
│  ├─ controllers/   # validação de entrada, regras de permissão, status HTTP, orquestração
│  ├─ models/        # SQL (única camada que fala com o banco)
│  ├─ services/      # integrações: getS3.js (URL assinada / JSON gold), uploadS3.js (foto de perfil)
│  ├─ config/        # s3.js (cliente S3), configUpload.js (multer memoryStorage)
│  ├─ database/      # config.js (função executar), script-tabelas.sql (DDL + seeds)
│  └─ templates/captura/   # script Python entregue ao cliente (rodar.py, script_escrita_mind.py, requirements.txt)
└─ public/
   ├─ *.html (index, login, cadastro, cadastro_empresa)   # site institucional + auth
   ├─ dashboard/     # telas autenticadas (dashboard-cliente/fornecedor/micro-modelo, gerenciamento-clp/modelo, equipe)
   ├─ js/            # um arquivo por tela + sessao.js (sessão/menu) + sidebar.js (menu por tipo de empresa)
   ├─ css/           # reset, aside, estilo, popups, gerenciamento-padrao, dashboard-*.css
   └─ assets/
```

### Rotas existentes (prefixo → arquivo)
`/usuarios` (cadastrar, autenticar, `/:id`, atualizar com upload) · `/clp` (CRUD de CLP, medições, localizações,
`baixarScript`) · `/modelo` (CRUD de modelos do fornecedor) · `/microModelo/:idFornecedor/:idModelo/:periodo` ·
`/equipe` (listar, código de ativação, editar/remover membro) · `/email/enviarEmail` · `/` (index).

---

## 4. Modelo de dados (MySQL, banco `mind`)

DDL e seeds: `src/database/script-tabelas.sql` (recria o banco: começa com `DROP DATABASE IF EXISTS mind` — **nunca execute em produção**).

| Tabela | Papel | Pontos de atenção |
|---|---|---|
| `empresa` | Fornecedores **e** clientes | `tipo` ∈ {`'fornecedor'`,`'cliente fornecedor'`} (CHECK); `codigo_ativacao` é o código que o funcionário usa no cadastro; `cnpj` UNIQUE (14 dígitos, sem máscara); `status` TINYINT |
| `ativacao` | Fornecedor ↔ cliente (PK composta `idFornecedor, idCliente`) | Define **quais modelos** o cliente enxerga ao cadastrar CLP; `status = 1` ativo |
| `usuario` | Usuários por empresa | `cargo` ∈ {`administrador`,`funcionario`}; `responsavel` auto-FK: **`NULL` = responsável/super-administrador da empresa** (protegido: não edita/remove); e-mail UNIQUE; `url_img` guarda a **key do S3**, não URL |
| `modelo` | Modelo de CLP **cadastrado pelo fornecedor** | `empresaId` = fornecedor dono; `status` 1/0 |
| `localizacao` | Setor/área dentro da planta do cliente | UNIQUE (`empresaId`,`nome`) → duplicata gera errno **1062** (tratado como 409) |
| `clp` | Equipamento monitorado | `empresaId` = **cliente** dono; `modeloId`, `localizacaoId`; `mac_address` UNIQUE; `status` 1 ativo / 0 inativo |
| `tipo_medicao` | Catálogo de métricas (11) | 1 CPU · 2 RAM · 3 Uptime · 4 Swap · 5 Scan Time · 6 Latência · 7 Perda de pacotes · 8 Upload · 9 Download · 10 Top processos · 11 Health Score |
| `clp_medicao` | Quais métricas cada CLP monitora (PK `clpId, tipoMedicaoId`) | `parametro` = **limite de alerta** (ex.: CPU 80 %, Scan 20 ms); `status` 1/0. **CPU (1), RAM (2) e Scan Time (5) são obrigatórias** ao cadastrar CLP |

Regras de multi-tenant (críticas):
- **Todo acesso a dado de cliente deve ser filtrado por `empresaId`** do usuário logado (padrão já usado em `clpPertenceEmpresa`,
  `deletarClp`, `atualizarClp`, `buscarDadosScript`). O fornecedor **nunca** vê dados de clientes que não o ativaram.
- Quem pode listar modelos no cadastro de CLP: `modelo` ⨝ `ativacao` com `a.idCliente = :empresa AND a.status = 1 AND m.status = 1`.
- Cadastro de funcionário: entra **sempre** como `funcionario`, com `responsavel` = usuário `responsavel IS NULL` da empresa dona do `codigo_ativacao`.
- Gestão de equipe (ver `equipeController.validarGerenciamento`): só `administrador`; mesmo `empresaId`; responsável da empresa é intocável;
  administrador comum só mexe em `funcionario`; só o responsável mexe em outro administrador.
- Ao alterar o schema, **atualize `script-tabelas.sql`, os seeds e este arquivo**, e avise que o Python/Java/ETL podem depender da mudança.

---

## 5. Domínio: Health Score e métricas

- **Health Score** (0–100) resume a saúde do CLP combinando as demais métricas; é calculado fora do Node (ETL).
- **Status do CLP** (Macro/Micro CLP): `Crítico < 40` · `Atenção 40–59` · `Estável ≥ 60` · `Offline` (sem comunicação, **sem** health).
- **Status do modelo** (Macro/Micro Modelo): `Crítico < 50` · `Atenção 50–74` · `Estável ≥ 75` (meta de qualidade = 75).
  ⚠️ As faixas de CLP e de modelo **são diferentes de propósito**. O gold já traz `limites_status`; **use-o** em vez de fixar números no front.
- Cores: Estável `#22C55E`, Atenção `#F59E0B`, Crítico `#EF4444`; tema escuro com ciano de destaque.
- Períodos de consulta: `24h`, `7d`, `30d` (valide contra essa lista, como em `microModeloController`).
- Regras de negócio da documentação úteis para texto/validação: alerta típico CPU > 90 % ou Scan Time > 2 s;
  polling **mínimo 500 ms** para variáveis críticas e 2–5 s para informativas (o script padrão usa `INTERVALO_MIN=15`).
- “CLP fora da curva”: CLP **Crítico** num setor cujos demais CLPs estão Atenção/Estável (só sinaliza quem está **abaixo** do setor).

---

## 6. Convenções de código (siga o que já existe)

**Backend**
- Módulos **CommonJS** (`require` / `module.exports`). Estilo atual: `var`/`function` em controllers e models; `async/await` em código novo é aceito.
- **Fluxo obrigatório**: `routes` → `controllers` → `models` → `database.executar`. Rota sem regra; controller sem SQL; model sem `req/res`.
- Nomes de campos do corpo: sufixo **`Server`** (`nomeServer`, `emailServer`, `empresaServer`, `medicoesServer`). Mantenha.
- Nomes em **português**; tabelas/colunas em `snake_case` (com exceções legadas como `idEmpresa`, `empresaId`, `idmodelo` — não renomeie).
- Validar entrada **no controller antes** de chamar o model: `isNaN` para ids, `Array.isArray` para listas, listas fechadas para enums.
- Códigos HTTP: `400` entrada inválida · `403` sem permissão · `404` não encontrado · `409` conflito (ex.: errno 1062/1451) · `500` erro inesperado · `201` criação.
- Respostas de erro novas devem ser **JSON** `{ message }` (padrão de `equipeController`/`usuarioController`). Rotas antigas ainda usam `.send(texto)`; não misture no mesmo arquivo.
- Imagens: `multer.memoryStorage` → `sharp` (500×500, `cover`) → S3 com nome aleatório; banco guarda a **key**; ao responder, gere **URL assinada** (1 h) via `getS3`.
- Integração com S3 fica em `services/`; nunca chame o SDK direto de controller.

**Frontend**
- Sem framework: HTML + JS puro, `fetch` com **caminho relativo** (`/clp/...`), IDs de elementos em `snake_case` (`btn_cancelar_editar`), um `.js` por tela.
- Sessão em **`sessionStorage`** (`ID_USUARIO`, `NOME_USUARIO`, `EMAIL_USUARIO`, `CARGO_USUARIO`, `ID_EMPRESA`, `TIPO_EMPRESA`, `IMG_URL`).
  O menu é montado por `sidebar.js` conforme `TIPO_EMPRESA` e `CARGO_USUARIO` (item **Equipe** só para `administrador`; use `data-cargo`).
- Modais: overlay `.overlay_config` + classe `ativo` (`abrirModal/fecharModal/configurarFechamento`); campos inválidos recebem `.invalido`.
- Layout responsivo obrigatório (desktop, notebook, tablet, celular). Interface em pt-BR, tema escuro consistente com `aside.css` / `estilo.css`.
- Gráficos com **Chart.js**; formate números/datas no padrão brasileiro (`dd/MM/yyyy`, vírgula decimal).
- Antes de criar componente/estilo, procure reaproveitar classes de `gerenciamento-padrao.css` e `popups.css`.

---

## 7. ⚠️ Dívidas técnicas e riscos conhecidos (leia antes de mexer)

Estas falhas existem **hoje** no código. **Não as replique em código novo** e, ao tocar numa função afetada,
corrija o trecho que você alterar (sem refatorar o projeto inteiro sem pedir).

1. **SQL por concatenação de strings** (`${variavel}` dentro do SQL) em praticamente todos os models → risco de **SQL Injection**
   (ex.: `autenticar`, `cadastrar`, `atualizarPerfil`). `database.executar(instrucao)` só aceita string.
   → **Código novo deve usar consultas parametrizadas** (`?` + array de valores com `mysql2`). Proposta: estender
   `executar(instrucao, valores = [])` de forma retrocompatível, usando `conexao.query(instrucao, valores, cb)`.
2. **Senhas em texto puro** na coluna `senha` (e seeds com `urubu100`). A documentação diz “hash”. → usar `bcrypt`/`argon2`
   em cadastro/login/troca de senha ao tocar nesses fluxos; nunca logar senha.
3. **Sem autenticação/autorização no servidor**: rotas confiam em `idEmpresa`/`idUsuario` vindos da URL/body e no `sessionStorage`
   do navegador (possível **IDOR**). `/modelo/atualizar|deletar/:idModelo` nem verificam o dono. → ao criar/alterar rotas,
   valide que o recurso pertence à empresa do usuário; ideal é migrar para sessão/JWT + middleware.
4. **Logs sensíveis**: `executar` faz `console.log(resultados)` e vários models logam o SQL completo; `emailController` loga `SMTP_USER`/`SMTP_PASS`.
   → não adicionar logs com credenciais, tokens ou dados pessoais; remova ao encontrar.
5. **Conexão nova por query** em `database/config.js` (sem pool). → preferir `mysql.createPool` ao evoluir.
6. **`baixarScript` escreve credenciais AWS no `.env` do zip** entregue ao cliente (`SCRIPT_AWS_*`). Mantenha **mínimo privilégio**
   (apenas `PutObject` no prefixo `bronze/`), credenciais temporárias e nunca expanda essas permissões.
7. **`emailController.js` usa ESM** (`import`/`export`) enquanto o resto é CommonJS e `routes/email.js` faz `require`. Confirme o `package.json`
   (`"type"`) / versão do Node antes de mexer; se for converter, converta de forma consistente.
8. **Divergências conhecidas**: o script Python legado (`obter_id_clp`) insere em `clp` uma coluna `localizacao` que **não existe mais**
   (hoje é `localizacaoId`); `sidebar.js` aponta para `gerenciamento-cliente.html`, que ainda não existe; no `listarModelos` há checagem
   de `affectedRows` que não se aplica a `SELECT`; `script.js`/`login.html` ainda guardam estado só no navegador.
9. Documentação cita **EC2 t3.small**; o diagrama de arquitetura mostra **t3.micro**. Não assuma capacidade — pergunte.

---

## 8. Segurança e limites (regras para o agente)

### ✅ Sempre
- Parametrizar SQL em código novo/alterado; validar e **sanitizar** toda entrada (params, query, body, arquivos).
- Filtrar por `empresaId` do solicitante; checar `cargo` quando a ação for administrativa.
- Segredos **somente** via variáveis de ambiente; manter `.env` fora do Git.
- Tratar `NoSuchKey` do S3 como “ainda sem dados” (404 com `semDados: true`), não como erro 500.
- Escrever mensagens de erro úteis ao usuário em pt-BR, sem vazar `sqlMessage`/stack para o cliente final em código novo.

### ⚠️ Pergunte antes
- Alterar schema do banco, nomes de tabelas/colunas ou o formato dos JSONs do gold (outros componentes dependem deles).
- Adicionar dependência npm nova, framework de front, ou mudar o padrão MVC.
- Mudar fluxo de autenticação/permissões, política de IAM ou estrutura de pastas do S3.
- Remover ou renomear rotas/IDs de elementos usados pelo front.

### 🚫 Nunca
- Commitar ou imprimir credenciais (AWS, SMTP, banco) ou o conteúdo de `.env`.
- Executar `script-tabelas.sql` (faz `DROP DATABASE`) contra banco que não seja local de desenvolvimento.
- Gravar senha ou token em log, resposta de API ou `sessionStorage`.
- Inventar endpoints, colunas ou campos do gold que não existam; se não souber, **leia o código/pergunte**.
- Escrever código de Java, ETL/Lambda ou do coletor Python como se fizesse parte deste repositório.

---

## 9. Variáveis de ambiente usadas pelo código

| Variável | Uso |
|---|---|
| `AMBIENTE_PROCESSO` | `producao` ou `desenvolvimento` — **obrigatória**; sem ela `executar` rejeita toda query |
| `DB_HOST` `DB_PORT` `DB_DATABASE` `DB_USER` `DB_PASSWORD` | Conexão MySQL |
| `BUCKET_REGION` | Região do cliente S3 |
| `BUCKET_NAME` | Bucket das **imagens de perfil** (`users/`) |
| `SCRIPT_BUCKET_NAME` | Bucket dos **dados** (bronze/silver/gold) |
| `SCRIPT_AWS_ACCESS_KEY_ID` `SCRIPT_AWS_SECRET_ACCESS_KEY` `SCRIPT_AWS_SESSION_TOKEN` | Credenciais embutidas no `.env` do script de captura |
| `SMTP_USER` `SMTP_PASS` | Nodemailer (Gmail SMTP, porta 587) — formulário “Fale conosco” |

Ao introduzir uma variável nova, documente-a aqui e em um `.env.example` (sem valores reais).

---

## 10. Comandos e fluxo de trabalho

> O `package.json` e o `app.js` **não foram enviados** ao gerar este arquivo. **Preencha/confirme** os comandos abaixo.

```bash
# TODO: confirmar com o time
npm install            # dependências
npm start              # ou: node app.js   (porta: <PREENCHER>)
npm test               # <ainda não existe? — ver §11>
npm run lint           # <ainda não existe?>
mysql -u <user> -p < src/database/script-tabelas.sql   # SOMENTE banco local de desenvolvimento
```

- Git: branch por tarefa (`feature/…`, `fix/…`), commits pequenos no padrão **Conventional Commits** em pt-BR
  (`feat(clp): validar parametro minimo`, `fix(equipe): bloquear remocao do responsavel`).
- Método da equipe: **Scrum**, sprints de 35 dias, backlog no Planner; PRs devem ser curtos e revisáveis por outro integrante.
- Definição de pronto: roda local sem erro no console, trata entradas inválidas, respeita multi-tenant, responsivo, sem segredo no diff.

---

## 11. Como trabalhar neste repositório (instruções ao agente)

1. **Leia antes de escrever**: abra o controller/model/rota/tela vizinhos e **copie o padrão existente**. Não “modernize” arquivos que você não precisa tocar.
2. **Mudanças mínimas e cirúrgicas**: resolva o pedido; sugira refatorações à parte em vez de misturá-las no mesmo diff.
3. **Nova funcionalidade típica** → 1) SQL em `models/` (parametrizado) 2) controller com validação e permissões 3) rota em `routes/` e registro no `app.js`
   4) `public/js/<tela>.js` + HTML/CSS 5) atualizar `script-tabelas.sql` se houver schema 6) atualizar este arquivo se mudar arquitetura/regra.
4. **Pense na persona**: pergunte “isso ajuda o Rogério a evitar uma parada? a Amanda a achar um modelo ruim? a Lídia a priorizar um cliente?”.
   Prefira KPI claro, comparação com período anterior e ação sugerida a telas só informativas.
5. **Ao responder**, diga o que mudou, em quais arquivos, e como testar manualmente (passo a passo curto). Se algo depender de Java/ETL/Python, **avise** em vez de supor.
6. **Testes**: o projeto ainda não tem suíte. Para lógica nova de regra de negócio (permissões, validações), proponha/crie testes
   (ex.: `node:test` ou Jest + Supertest) e informe como rodar.
7. **Incerteza**: se faltar contexto (formato do gold, regra de alerta, tela não enviada), **pergunte** — não preencha com suposição.

---

## 12. Glossário rápido

**CLP/PLC** controlador lógico programável · **Scan Time** duração de um ciclo de execução do CLP (se passa do watchdog o CLP entra em STOP) ·
**Microparada** interrupção curta (< 5 min) · **Downtime** parada não planejada · **MTTR** tempo médio de reparo · **OEE** eficácia global do equipamento ·
**Health Score** nota 0–100 de saúde · **Fora da curva** CLP pior que o comportamento do seu setor · **Medalhão** bronze → silver → gold ·
**Fornecedor** fabricante/vendedor dos CLPs (macro) · **Cliente** indústria compradora (micro) · **Responsável** administrador raiz da empresa (`responsavel IS NULL`).