//server.js
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// --- Configuração do Banco de Dados ---
const db = mysql.createConnection({
    host: 'localhost', // Mude se necessário
    user: 'root',      // Mude se necessário
    password: 'cia16300', // Mude para sua senha real
    database: 'biblioteca_escolar' // Mude para o nome do seu DB
});

db.connect(err => {
    if (err) {
        console.error('Erro ao conectar ao banco de dados:', err);
        return;
    }
    console.log('Conectado ao banco de dados MySQL.');
});

// ====================================================================
// ROTAS DE USUÁRIOS (Alunos e Professores)
// ====================================================================

// ROTA: Buscar Alunos e Professores (para os selects)
app.get('/usuarios', (req, res) => {
    // Union de alunos e professores para preencher o select
    const query = `
        SELECT id_aluno AS id, nome, 'aluno' AS tipo FROM Alunos
        UNION ALL
        SELECT id_professor AS id, nome, 'professor' AS tipo FROM Professores
        ORDER BY nome;
    `;
    db.query(query, (err, results) => {
        if (err) {
            console.error('Erro ao buscar usuários:', err);
            return res.status(500).send('Erro no servidor ao buscar usuários.');
        }
        res.json(results);
    });
});

// ROTA: Adicionar Novo Aluno 
app.post('/alunos', (req, res) => {
    const { nome, matricula,contato } = req.body;
    
    // O 'contato' do frontend mapeia para 'telefone' no DDL
    const query = 'INSERT INTO Alunos (nome, matricula, telefone) VALUES (?, ?, ?)'; 
    
    db.query(query, [nome,matricula,contato], (err, result) => {
        if (err) {
            console.error('Erro ao adicionar aluno:', err);
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(409).send('Matrícula já cadastrada ou outro campo único duplicado.');
            }
            return res.status(500).send('Erro no servidor ao adicionar aluno.');
        }
        res.status(201).json({ id: result.insertId, message: 'Aluno cadastrado com sucesso!' });
    });
});

// ROTA: Adicionar Novo Professor 
app.post('/professores', (req, res) => {
    const { nome, contato } = req.body;
    
    // O 'contato' do frontend mapeia para 'telefone' no DDL
    const query = 'INSERT INTO Professores (nome, telefone) VALUES (?, ?)';
    
    db.query(query, [nome, contato], (err, result) => {
        if (err) {
            console.error('Erro ao adicionar professor:', err);
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(409).send('Campo único duplicado (ex: CPF/Email).');
            }
            return res.status(500).send('Erro no servidor ao adicionar professor.');
        }
        res.status(201).json({ id: result.insertId, message: 'Professor cadastrado com sucesso!' });
    });
});

// ROTA: Remover Aluno (NOVO)
app.delete('/alunos/:id', (req, res) => {
    const { id } = req.params;

    // 1. Verificar se o aluno tem empréstimos ATIVOS
    const checkQuery = 'SELECT COUNT(*) AS ativos FROM Emprestimos WHERE id_aluno = ? AND data_devolucao_real IS NULL';
    
    db.query(checkQuery, [id], (err, checkResult) => {
        if (err) {
            console.error('Erro na verificação de empréstimos:', err);
            return res.status(500).send('Erro no servidor durante a verificação.');
        }

        if (checkResult[0].ativos > 0) {
            return res.status(400).send('Não é possível remover. O aluno possui empréstimos ativos pendentes de devolução.');
        }

        // 2. Remoção do Aluno
        const deleteQuery = 'DELETE FROM Alunos WHERE id_aluno = ?';
        db.query(deleteQuery, [id], (deleteErr, deleteResult) => {
            if (deleteErr) {
                console.error('Erro ao remover aluno:', deleteErr);
                // Caso o aluno tenha histórico de empréstimos devolvidos
                if (deleteErr.code === 'ER_ROW_IS_REFERENCED_2') {
                    // Esta mensagem deve ser vista apenas se o ON DELETE CASCADE não foi configurado no DB.
                    return res.status(400).send('O aluno possui histórico de empréstimos e não pode ser excluído.');
                }
                return res.status(500).send('Erro no servidor ao remover aluno.');
            }
            if (deleteResult.affectedRows === 0) {
                return res.status(404).send('Aluno não encontrado.');
            }
            res.status(200).send('Aluno removido com sucesso!');
        });
    });
});

// ROTA: Remover Professor (NOVO)
app.delete('/professores/:id', (req, res) => {
    const { id } = req.params;

    // 1. Verificar se o professor tem empréstimos ATIVOS
    const checkQuery = 'SELECT COUNT(*) AS ativos FROM Emprestimos WHERE id_professor = ? AND data_devolucao_real IS NULL';
    
    db.query(checkQuery, [id], (err, checkResult) => {
        if (err) {
            console.error('Erro na verificação de empréstimos:', err);
            return res.status(500).send('Erro no servidor durante a verificação.');
        }

        if (checkResult[0].ativos > 0) {
            return res.status(400).send('Não é possível remover. O professor possui empréstimos ativos pendentes de devolução.');
        }

        // 2. Remoção do Professor
        const deleteQuery = 'DELETE FROM Professores WHERE id_professor = ?';
        db.query(deleteQuery, [id], (deleteErr, deleteResult) => {
            if (deleteErr) {
                console.error('Erro ao remover professor:', deleteErr);
                // Caso o professor tenha histórico de empréstimos devolvidos
                if (deleteErr.code === 'ER_ROW_IS_REFERENCED_2') {
                    // Esta mensagem deve ser vista apenas se o ON DELETE CASCADE não foi configurado no DB.
                    return res.status(400).send('O professor possui histórico de empréstimos e não pode ser excluído.');
                }
                return res.status(500).send('Erro no servidor ao remover professor.');
            }
            if (deleteResult.affectedRows === 0) {
                return res.status(404).send('Professor não encontrado.');
            }
            res.status(200).send('Professor removido com sucesso!');
        });
    });
});


// ====================================================================
// ROTAS DE LIVROS (CRUD)
// ====================================================================

// ROTA: Adicionar Novo Livro (POST)
app.post('/livros', (req, res) => {
    const { titulo, autor, ano_publicacao, isbn, editora, genero, quantidade_total } = req.body;
    
    const query = `
        INSERT INTO Livros 
        (titulo, autor, ano_publicacao, isbn, editora, genero, quantidade_total, quantidade_disponivel) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    db.query(query, [titulo, autor, ano_publicacao, isbn, editora, genero, quantidade_total, quantidade_total], (err, result) => {
        if (err) {
            console.error('Erro ao adicionar livro:', err);
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(409).send('ISBN já cadastrado.');
            }
            return res.status(500).send('Erro no servidor ao adicionar livro.');
        }
        res.status(201).json({ id: result.insertId, message: 'Livro adicionado com sucesso!' });
    });
});

// ROTA: Listar Todos os Livros (GET)
app.get('/livros', (req, res) => {
    const query = 'SELECT * FROM Livros ORDER BY titulo';
    db.query(query, (err, results) => {
        if (err) {
            console.error('Erro ao buscar livros:', err);
            return res.status(500).send('Erro no servidor ao buscar livros.');
        }
        res.json(results);
    });
});

// ROTA: Atualizar Dados de um Livro (PUT)
app.put('/livros/:id', (req, res) => {
    const { id } = req.params;
    const { titulo, autor, ano_publicacao, isbn, editora, genero, quantidade_total, quantidade_disponivel } = req.body;

    const query = `
        UPDATE Livros 
        SET 
            titulo = ?, 
            autor = ?, 
            ano_publicacao = ?, 
            isbn = ?, 
            editora = ?, 
            genero = ?, 
            quantidade_total = ?,
            quantidade_disponivel = ?
        WHERE id_livro = ?
    `;

    db.query(query, [titulo, autor, ano_publicacao, isbn, editora, genero, quantidade_total, quantidade_disponivel, id], (err, result) => {
        if (err) {
            console.error('Erro ao atualizar livro:', err);
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(409).send('ISBN já cadastrado.');
            }
            return res.status(500).send('Erro no servidor ao atualizar livro.');
        }
        if (result.affectedRows === 0) {
            return res.status(404).send('Livro não encontrado.');
        }
        res.status(200).send('Livro atualizado com sucesso!');
    });
});

// ROTA: Remover um Livro (DELETE)
app.delete('/livros/:id', (req, res) => {
    const { id } = req.params;

    // 1. Verificação de Empréstimos Ativos
    const checkQuery = 'SELECT (quantidade_total - quantidade_disponivel) AS total_emprestado FROM Livros WHERE id_livro = ?';
    
    db.query(checkQuery, [id], (err, checkResult) => {
        if (err || checkResult.length === 0) {
            return res.status(404).send('Livro não encontrado ou erro na verificação.');
        }

        if (checkResult[0].total_emprestado > 0) {
            return res.status(400).send('Não é possível remover. Existem exemplares emprestados ou em trânsito.');
        }

        // 2. Remoção 
        const deleteQuery = 'DELETE FROM Livros WHERE id_livro = ?';
        db.query(deleteQuery, [id], (deleteErr, deleteResult) => {
            if (deleteErr) {
                console.error('Erro ao remover livro:', deleteErr);
                if (deleteErr.code === 'ER_ROW_IS_REFERENCED_2') {
                    return res.status(400).send('Este livro possui histórico de empréstimos e não pode ser deletado.');
                }
                return res.status(500).send('Erro no servidor ao remover livro.');
            }
            if (deleteResult.affectedRows === 0) {
                return res.status(404).send('Livro não encontrado.');
            }
            res.status(200).send('Livro removido com sucesso!');
        });
    });
});


// ====================================================================
// ROTAS DE EMPRÉSTIMO E DEVOLUÇÃO
// ====================================================================

// ROTA: Registrar Novo Empréstimo (AGORA COM LIMITE DE LOCAÇÃO)
app.post('/emprestimo', (req, res) => {
    const { id_livro, id_aluno, id_professor, id_bibliotecario } = req.body;

    // --- 1. DEFINIR LIMITES E IDENTIFICAR USUÁRIO ---
    // Limite de livros ativos permitidos (Regra de Negócio)
    const LIMITE_ALUNO = 3;
    const LIMITE_PROFESSOR = 5;
    
    // O sistema deve ter ou id_aluno OU id_professor, mas não ambos
    const tipo = id_aluno ? 'aluno' : (id_professor ? 'professor' : null);
    const id_usuario = id_aluno || id_professor;
    
    if (!id_usuario || !tipo) {
        return res.status(400).send('Dados de usuário inválidos para o empréstimo.');
    }
    
    const limite = (tipo === 'aluno') ? LIMITE_ALUNO : LIMITE_PROFESSOR;

    // --- 2. VERIFICAR QUANTIDADE DE LIVROS ATIVOS ---
    const countQuery = `
        SELECT COUNT(*) AS total_ativos 
        FROM Emprestimos 
        WHERE data_devolucao_real IS NULL 
        AND ${tipo === 'aluno' ? 'id_aluno' : 'id_professor'} = ?;
    `;
    
    db.query(countQuery, [id_usuario], (err, countResult) => {
        if (err) {
            console.error('Erro ao contar empréstimos ativos:', err);
            return res.status(500).send('Erro no servidor ao verificar limites.');
        }

        const totalAtivos = countResult[0].total_ativos;

        if (totalAtivos >= limite) {
            // Retorna 400 se o limite for atingido
            return res.status(400).send(`O ${tipo} ID ${id_usuario} já atingiu o limite máximo de ${limite} livros emprestados.`);
        }

        // --- 3. Continuar com a lógica de empréstimo (Verificar disponibilidade) ---
        db.query('SELECT quantidade_disponivel FROM Livros WHERE id_livro = ?', [id_livro], (err, results) => {
            if (err || results.length === 0 || results[0].quantidade_disponivel <= 0) {
                return res.status(400).send('Livro indisponível ou ID inválido.');
            }

            // 4. Definir datas (Ex: 7 dias para devolução)
            const data_emprestimo = new Date();
            const data_devolucao_prevista = new Date();
            data_devolucao_prevista.setDate(data_devolucao_prevista.getDate() + 7); 

            // 5. Registrar empréstimo
            const insertQuery = `
                INSERT INTO Emprestimos 
                (id_livro, id_aluno, id_professor, id_bibliotecario, data_emprestimo, data_devolucao_prevista) 
                VALUES (?, ?, ?, ?, ?, ?)
            `;
            db.query(insertQuery, [id_livro, id_aluno || null, id_professor || null, id_bibliotecario, data_emprestimo, data_devolucao_prevista], (err, result) => {
                if (err) {
                    console.error('Erro ao registrar empréstimo:', err);
                    return res.status(500).send('Erro no servidor ao registrar empréstimo.');
                }

                // 6. Atualizar contagem de livros
                const updateQuery = 'UPDATE Livros SET quantidade_disponivel = quantidade_disponivel - 1 WHERE id_livro = ?';
                db.query(updateQuery, [id_livro], (updateErr) => {
                    if (updateErr) {
                        console.error('Erro ao atualizar disponibilidade:', updateErr);
                    }
                    res.status(201).json({ 
                        id: result.insertId, 
                        message: 'Empréstimo realizado com sucesso.', 
                        data_devolucao: data_devolucao_prevista 
                    });
                });
            });
        });
    });
});

// ROTA: Registrar Devolução
app.post('/devolucao', (req, res) => {
    const { id_emprestimo } = req.body;
    const data_devolucao_real = new Date();

    // 1. Registrar a devolução
    const updateEmprestimoQuery = 'UPDATE Emprestimos SET data_devolucao_real = ? WHERE id_emprestimo = ? AND data_devolucao_real IS NULL';
    db.query(updateEmprestimoQuery, [data_devolucao_real, id_emprestimo], (err, result) => {
        if (err) {
            console.error('Erro ao registrar devolução:', err);
            return res.status(500).send('Erro no servidor ao registrar devolução.');
        }
        if (result.affectedRows === 0) {
            return res.status(404).send('Empréstimo não encontrado ou já devolvido.');
        }

        // 2. Obter ID do Livro
        db.query('SELECT id_livro FROM Emprestimos WHERE id_emprestimo = ?', [id_emprestimo], (err, livroResult) => {
            if (err || livroResult.length === 0) {
                console.error('Erro ao encontrar ID do livro após devolução, o livro pode não ser contabilizado.');
                return res.status(500).send('Devolução registrada, mas houve falha na contagem do acervo.');
            }
            const id_livro = livroResult[0].id_livro;

            // 3. Atualizar contagem de livros
            const updateLivroQuery = 'UPDATE Livros SET quantidade_disponivel = quantidade_disponivel + 1 WHERE id_livro = ?';
            db.query(updateLivroQuery, [id_livro], (updateErr) => {
                if (updateErr) {
                    console.error('Erro ao atualizar disponibilidade após devolução:', updateErr);
                }
                res.status(200).send('Devolução registrada com sucesso!');
            });
        });
    });
});

// ====================================================================
// ROTAS DE CONSULTAS E DASHBOARD
// ====================================================================

// ROTA: Empréstimos Atrasados
app.get('/emprestimos_atrasados', (req, res) => {
    const query = `
        SELECT 
            e.id_emprestimo,
            l.titulo,
            COALESCE(a.nome, p.nome) AS nome_usuario,
            CASE WHEN e.id_aluno IS NOT NULL THEN 'aluno' ELSE 'professor' END AS tipo_usuario,
            e.data_devolucao_prevista,
            DATEDIFF(NOW(), e.data_devolucao_prevista) AS dias_atraso
        FROM Emprestimos e
        JOIN Livros l ON e.id_livro = l.id_livro
        LEFT JOIN Alunos a ON e.id_aluno = a.id_aluno
        LEFT JOIN Professores p ON e.id_professor = p.id_professor
        WHERE 
            e.data_devolucao_real IS NULL AND 
            e.data_devolucao_prevista < NOW() 
        ORDER BY dias_atraso DESC;
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error('Erro ao buscar empréstimos atrasados:', err);
            return res.status(500).send('Erro no servidor ao buscar atrasados.');
        }
        res.json(results);
    });
});


// ROTA: Empréstimos Ativos (No Prazo e Não Atrasados)
app.get('/emprestimos_ativos', (req, res) => {
    const query = `
        SELECT 
            e.id_emprestimo,
            l.titulo,
            COALESCE(a.nome, p.nome) AS nome_usuario,
            CASE WHEN e.id_aluno IS NOT NULL THEN 'aluno' ELSE 'professor' END AS tipo_usuario,
            e.data_emprestimo,
            e.data_devolucao_prevista
        FROM Emprestimos e
        JOIN Livros l ON e.id_livro = l.id_livro
        LEFT JOIN Alunos a ON e.id_aluno = a.id_aluno
        LEFT JOIN Professores p ON e.id_professor = p.id_professor
        WHERE 
            e.data_devolucao_real IS NULL AND 
            e.data_devolucao_prevista >= NOW() 
        ORDER BY e.data_devolucao_prevista ASC;
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error('Erro ao buscar empréstimos ativos:', err);
            return res.status(500).send('Erro no servidor ao buscar ativos.');
        }
        res.json(results);
    });
});

// ROTA: Histórico Completo de Locações
app.get('/historico-completo', (req, res) => {
    const query = `
        SELECT
            e.id_emprestimo,
            l.titulo AS Titulo_Livro,
            l.autor AS Autor,
            COALESCE(a.nome, p.nome) AS Usuario,
            CASE WHEN e.id_aluno IS NOT NULL THEN 'Aluno' ELSE 'Professor' END AS Tipo_Usuario,
            e.data_emprestimo,
            e.data_devolucao_prevista,
            e.data_devolucao_real,
            CASE
                WHEN e.data_devolucao_real IS NOT NULL THEN 'devolvido'
                WHEN e.data_devolucao_prevista < NOW() THEN 'atrasado'
                ELSE 'ativo'
            END AS status_emprestimo
        FROM Emprestimos e
        JOIN Livros l ON e.id_livro = l.id_livro
        LEFT JOIN Alunos a ON e.id_aluno = a.id_aluno
        LEFT JOIN Professores p ON e.id_professor = p.id_professor
        ORDER BY e.data_emprestimo DESC;
    `;
    db.query(query, (err, results) => {
        if (err) {
            console.error('Erro ao buscar histórico:', err);
            return res.status(500).send('Erro no servidor ao buscar histórico.');
        }
        res.json(results);
    });
});

// --- Iniciar Servidor ---
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
    console.log('Regras de Limite de Locação: Aluno = 3 livros, Professor = 5 livros.');
});