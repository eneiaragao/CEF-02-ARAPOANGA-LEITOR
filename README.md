# CEF-02-ARAPOANGA-LEITOR
# 📚 Arapoanga Leitor

## Sistema de Gestão de Biblioteca Escolar - CEF 02 do Arapoanga

O **Arapoanga Leitor** é um sistema completo de gestão de biblioteca desenvolvido para o CEF 02 do Arapoanga. Ele permite o cadastro e controle do acervo de livros, o registro de empréstimos e devoluções para alunos e professores, e oferece um dashboard de monitoramento com consultas rápidas e alertas de atraso.

---

## ✨ Funcionalidades Principais

| Categoria | Funcionalidade | Descrição |
| :--- | :--- | :--- |
| **Acervo** | Cadastro e CRUD de Livros | Adiciona, lista, edita e remove títulos do acervo, controlando a quantidade total e a disponibilidade. |
| **Locação** | Empréstimo Inteligente | Registra empréstimos com datas previstas e aplica **limites por tipo de usuário** (Aluno: 3 livros; Professor: 5 livros). |
| **Locação** | Devolução Rápida | Registra a devolução, atualizando automaticamente a disponibilidade do livro e limpando o status do usuário. |
| **Usuários** | Gestão de Alunos/Professores | Cadastro de novos usuários e **exclusão condicional** (só permite deletar usuários sem empréstimos ativos pendentes). |
| **Dashboard** | Alerta de Atraso | Lista destacada de empréstimos vencidos, calculando os dias de atraso. |
| **Consultas** | Relatórios Detalhados | Visualização de Empréstimos Ativos (no prazo) e Histórico Completo de Locações. |

---

## 🛠️ Tecnologias Utilizadas

Este projeto é dividido em duas partes principais, comunicadas via API REST:

### Frontend
* **JavaScript (JS Puro):** Lógica de formulários, validações e comunicação assíncrona com o backend (Fetch API).
* **HTML5 & CSS3:** Interface simples, focada em usabilidade e responsividade.

### Backend (API REST)
* **Node.js & Express:** Servidor para roteamento e gestão da API.
* **MySQL2:** Driver para conexão robusta e eficiente com o banco de dados.
* **MySQL:** Armazenamento de dados e lógica complexa de consultas (`JOINs`, `DATEDIFF`, `UNION`).

---

## ⚙️ Configuração do Ambiente e Instalação

### Pré-requisitos
* **Node.js e npm** (ou yarn) instalados.
* Servidor de banco de dados **MySQL** em execução.

### 1. Configuração do Banco de Dados

1.  Crie um banco de dados chamado **`biblioteca_escolar`** no seu servidor MySQL.
2.  **Ajuste as credenciais** no arquivo `server.js`:
    ```javascript
    // No seu server.js, altere:
    const db = mysql.createPool({ 
        host: 'localhost',
        user: 'root',
        password: 'SUA_SENHA_REAL', // <-- Mude isso!
        database: 'biblioteca_escolar' 
    });
    ```
3.  Execute seu DDL (arquivo de criação de tabelas) para estruturar o banco de dados.

### 2. Instalação e Execução do Backend

1.  Navegue até o diretório raiz do projeto no terminal.
2.  Instale as dependências:
    ```bash
    npm install express mysql2 cors
    ```
3.  Inicie o servidor Node.js:
    ```bash
    node server.js
    ```
    O servidor deve iniciar na porta 3000, com a mensagem: `Servidor rodando em http://localhost:3000`.

### 3. Execução do Frontend

1.  Basta abrir o arquivo **`index.html`** diretamente no seu navegador (Chrome, Firefox, etc.).
2.  O `script.js` se conectará automaticamente à API rodando em `http://localhost:3000`.

---

## 🔑 Regras de Negócio e Pontos de Destaque

O sistema possui uma lógica robusta para garantir a integridade dos dados:

| Regra | Implementação no Backend (`server.js`) |
| :--- | :--- |
| **Limite de Empréstimo** | A rota `/emprestimo` executa uma verificação (`COUNT`) no BD. Se o usuário exceder 3 (Aluno) ou 5 (Professor) livros ativos, o empréstimo é negado (HTTP 400). |
| **Consistência** | As operações de Locação e Devolução envolvem a atualização de duas tabelas (`Emprestimos` e `Livros`). É recomendado o uso de **Transações** para garantir que ambas as etapas sejam realizadas com sucesso ou que a operação completa seja desfeita. |
| **Exclusão Segura** | As rotas de `DELETE` para usuários e livros verificam se há empréstimos ativos pendentes de devolução antes de executar a exclusão. |
| **Relatório de Atrasos** | A rota `/emprestimos_atrasados` utiliza a função SQL `DATEDIFF(NOW(), data_devolucao_prevista)` para calcular a precisão dos dias de atraso. |

---

## 💻 Estrutura do Projeto

* **`server.js`:** O coração da API REST (Node.js/Express).
* **`index.html`:** Estrutura da interface do usuário.
* **`script.js`:** Toda a lógica de frontend, manipulação do DOM e comunicação com o backend.
* **`style.css`:** Estilização e layout responsivo.
