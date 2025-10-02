// script.js (Versão Final com Exclusão via Formulário)

const API_URL = 'http://localhost:3000';

document.addEventListener('DOMContentLoaded', () => {
    // --- Funções de carregamento inicial ---
    carregarLivros();
    carregarUsuarios(); // Carrega o select de empréstimo
    carregarUsuariosExclusao(); // Carrega o select de exclusão de usuário
    carregarEmprestimosAtivos();
    carregarEmprestimosAtrasados(); 

    // ====================================================================
    // EVENTO: Adicionar Livro
    // ====================================================================
    document.getElementById('form-adicionar-livro').addEventListener('submit', async (e) => {
        e.preventDefault();

        const livroData = {
            titulo: document.getElementById('titulo').value,
            autor: document.getElementById('autor').value,
            ano_publicacao: document.getElementById('ano_publicacao').value,
            isbn: document.getElementById('isbn').value,
            editora: document.getElementById('editora').value,
            genero: document.getElementById('genero').value,
            quantidade_total: document.getElementById('quantidade_total').value
        };

        try {
            const response = await fetch(`${API_URL}/livros`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(livroData)
            });

            if (response.ok) {
                alert('Livro cadastrado com sucesso!');
                document.getElementById('form-adicionar-livro').reset();
                carregarLivros(); 
            } else {
                alert('Erro ao cadastrar livro: ' + await response.text());
            }
        } catch (error) {
            console.error('Erro de rede:', error);
            alert('Erro de conexão. Verifique se o backend está rodando.');
        }
    });

    // ====================================================================
    // EVENTO: Realizar Empréstimo
    // ====================================================================
    document.getElementById('form-emprestimo').addEventListener('submit', async (e) => {
        e.preventDefault();

        const id_livro = document.getElementById('livro').value;
        const id_usuario = document.getElementById('usuario').value;
        const id_bibliotecario = 1; 

        let dadosEmprestimo = {
            id_livro,
            id_bibliotecario
        };

        // O select de usuário tem valor no formato 'tipo-id' (ex: aluno-5)
        if (id_usuario.startsWith('aluno-')) {
            dadosEmprestimo.id_aluno = id_usuario.split('-')[1];
        } else if (id_usuario.startsWith('professor-')) {
            dadosEmprestimo.id_professor = id_usuario.split('-')[1];
        } else {
            alert('Por favor, selecione um usuário válido.');
            return;
        }

        try {
            const response = await fetch(`${API_URL}/emprestimo`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(dadosEmprestimo)
            });

            if (response.ok) {
                const resultado = await response.json();
                const dataFormatada = new Date(resultado.data_devolucao).toLocaleDateString('pt-BR', {timeZone: 'UTC'});
                alert('Empréstimo realizado com sucesso! Devolução prevista: ' + dataFormatada);
                
                document.getElementById('form-emprestimo').reset();
                carregarLivros(); 
                carregarEmprestimosAtivos(); 
                carregarEmprestimosAtrasados(); 
            } else {
                const erro = await response.text();
                alert('Erro ao realizar o empréstimo: ' + erro);
            }
        } catch (error) {
            console.error('Erro de rede:', error);
            alert('Erro de conexão com o servidor. Verifique se o backend está rodando em http://localhost:3000.');
        }
    });
    
    // ====================================================================
    // EVENTO: Registrar Devolução
    // ====================================================================
    document.getElementById('form-devolucao').addEventListener('submit', async (e) => {
        e.preventDefault();

        const id_emprestimo = document.getElementById('id-emprestimo-devolucao').value;

        try {
            const response = await fetch(`${API_URL}/devolucao`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ id_emprestimo })
            });

            if (response.ok) {
                alert('Devolução registrada com sucesso!');
                document.getElementById('form-devolucao').reset();
                carregarLivros();
                carregarEmprestimosAtivos();
                carregarEmprestimosAtrasados(); 
            } else {
                const erro = await response.text();
                alert('Erro ao registrar devolução: ' + erro);
            }
        } catch (error) {
            console.error('Erro de rede:', error);
            alert('Erro de conexão com o servidor.');
        }
    });
    
    // ====================================================================
    // EVENTO: Cadastrar Novo Usuário
    // ====================================================================
    document.getElementById('form-cadastrar-usuario').addEventListener('submit', async (e) => {
        e.preventDefault();

        const tipo = document.getElementById('tipo_usuario_novo').value;
        const nome = document.getElementById('nome_usuario_novo').value;
        const contato = document.getElementById('contato_usuario_novo').value;
        
        let endpoint = '';
        let userData = { nome, contato };

        if (tipo === 'aluno') {
            const matricula = document.getElementById('matricula_aluno').value;
            if (!matricula) {
                alert('A matrícula é obrigatória para Alunos.');
                return;
            }
            userData.matricula = matricula;
            endpoint = `${API_URL}/alunos`;
        } else if (tipo === 'professor') {
            endpoint = `${API_URL}/professores`;
        }

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });

            const responseText = await response.text();
            
            if (response.ok) {
                alert(`${tipo === 'aluno' ? 'Aluno' : 'Professor'} cadastrado com sucesso!`);
                document.getElementById('form-cadastrar-usuario').reset();
                carregarUsuarios(); // Atualiza select de empréstimo
                carregarUsuariosExclusao(); // Atualiza select de exclusão
            } else {
                let errorMessage = responseText;
                try {
                    // Tenta parsear o erro como JSON, caso o backend envie
                    const errorJson = JSON.parse(responseText);
                    errorMessage = errorJson.message || errorMessage;
                } catch (e) {
                    // Caso não seja JSON, usa o texto puro
                }
                alert(`Erro ao cadastrar ${tipo}: ${errorMessage}`);
            }
        } catch (error) {
            console.error('Erro de rede:', error);
            alert('Erro de conexão com o servidor. Verifique se o backend está rodando.');
        }
    });
    
    // ====================================================================
    // EVENTO: Excluir Usuário (Formulário Dedicado) - CORRIGIDO
    // ====================================================================
    document.getElementById('form-excluir-usuario').addEventListener('submit', async (e) => {
        e.preventDefault();

        const select = document.getElementById('usuario_excluir');
        const value = select.value;

        if (!value) {
            alert('Por favor, selecione um usuário para exclusão.');
            return;
        }

        // O valor vem no formato 'tipo-id' (ex: aluno-10)
        const parts = value.split('-');
        if (parts.length !== 2) {
             alert('Formato de usuário inválido.');
             return;
        }
        
        const [tipo_usuario, id_usuario] = parts;
        const nome_usuario = select.options[select.selectedIndex].text;

        let sufixo_plural = '';

        if (tipo_usuario === 'aluno') {
            sufixo_plural = 'alunos';
        } else if (tipo_usuario === 'professor') {
            // CORREÇÃO APLICADA: garante que o endpoint será 'professores'
            sufixo_plural = 'professores'; 
        } else {
            alert('Tipo de usuário inválido na seleção.');
            return;
        }

        if (!confirm(`Confirme a exclusão do(a) ${tipo_usuario.toUpperCase()}: ${nome_usuario}? Esta ação é IRREVERSÍVEL e só funciona se o usuário não tiver empréstimos ativos.`)) {
            return;
        }

        // Monta o endpoint no formato /alunos/1 ou /professores/1
        const endpoint = `${API_URL}/${sufixo_plural}/${id_usuario}`; 
        
        console.log(`[DEBUG - EXCLUSÃO] Tentando DELETE em: ${endpoint}`); 

        try {
            const response = await fetch(endpoint, {
                method: 'DELETE'
            });
            
            const responseText = await response.text();

            if (response.ok) {
                alert(`${tipo_usuario.toUpperCase()} ID ${id_usuario} excluído com sucesso!`);
                document.getElementById('form-excluir-usuario').reset();
                carregarUsuarios(); // Atualiza select de empréstimo
                carregarUsuariosExclusao(); // Atualiza select de exclusão
                // Se um usuário foi excluído, é bom atualizar as listas de empréstimos caso ele estivesse em uma delas
                carregarEmprestimosAtivos();
                carregarEmprestimosAtrasados();
            } else {
                alert(`Erro ao excluir ${tipo_usuario}: ${responseText}`);
            }

        } catch (error) {
            console.error('Erro de rede ao deletar usuário:', error);
            alert('Erro de conexão ao tentar deletar o usuário.');
        }
    });

    // ====================================================================
    // LÓGICA DE EXIBIÇÃO: Matrícula (Toggle)
    // ====================================================================
    const tipoUsuarioSelect = document.getElementById('tipo_usuario_novo');
    const matriculaGroup = document.getElementById('matricula-group');

    const toggleMatriculaField = () => {
        if (tipoUsuarioSelect.value === 'aluno') {
            matriculaGroup.style.display = 'block';
            document.getElementById('matricula_aluno').setAttribute('required', 'required');
        } else {
            matriculaGroup.style.display = 'none';
            document.getElementById('matricula_aluno').removeAttribute('required');
        }
    };

    tipoUsuarioSelect.addEventListener('change', toggleMatriculaField);
    toggleMatriculaField();

    // ====================================================================
    // ROTINAS DE CONSULTA RÁPIDA (Listeners)
    // ====================================================================
    
    // Event listeners para consultas rápidas (seus botões no index.html)
    document.getElementById('btn-historico-locacoes').addEventListener('click', () => exibirDadosConsulta('historico-completo', 'Histórico Completo de Locações'));
    document.getElementById('btn-emprestimos-ativos-consulta').addEventListener('click', () => exibirDadosConsulta('emprestimos_ativos', 'Empréstimos Ativos (No Prazo)'));
    document.getElementById('btn-emprestimos-atrasados-consulta').addEventListener('click', () => exibirDadosConsulta('emprestimos_atrasados', 'Empréstimos Vencidos (Atrasados)'));
    document.getElementById('btn-acervo-completo').addEventListener('click', () => exibirDadosConsulta('livros', 'Acervo Completo da Biblioteca'));
    document.getElementById('btn-livros-disponiveis').addEventListener('click', () => exibirDadosConsulta('livros', 'Livros Disponíveis para Empréstimo', true)); // O 'true' indica filtrar por disponível > 0

}); // Fim do DOMContentLoaded


// ====================================================================
// FUNÇÕES AUXILIARES (Global)
// ====================================================================

// Função genérica para exibir dados em uma nova janela (para consultas)
function exibirConsultaEmNovaJanela(titulo, dados) {
    const novaJanela = window.open('', '_blank', 'width=1000,height=600,scrollbars=yes');
    
    // Conteúdo da janela
    const htmlContent = `
        <!DOCTYPE html>
        <html lang="pt-br">
        <head>
            <title>${titulo}</title>
            <style>
                body { font-family: sans-serif; padding: 20px; }
                h1 { color: #333; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; }
            </style>
        </head>
        <body>
            <h1>${titulo}</h1>
            <table>
                ${dados}
            </table>
        </body>
        </html>
    `;
    
    novaJanela.document.write(htmlContent);
    novaJanela.document.close();
    
    return novaJanela; 
}


// Função auxiliar para processar e exibir dados de consulta
async function exibirDadosConsulta(endpoint, titulo, filtrarDisponivel = false) {
    try {
        const response = await fetch(`${API_URL}/${endpoint}`);
        if (!response.ok) {
             throw new Error(`Erro ${response.status}: Falha ao acessar a rota /${endpoint}.`);
        }
        const data = await response.json();

        let tableContent = '';

        if (endpoint === 'historico-completo') {
            tableContent = formatarHistorico(data);
        } else if (endpoint.startsWith('emprestimos')) {
            tableContent = formatarEmprestimos(data, endpoint === 'emprestimos_atrasados');
        } else if (endpoint === 'livros') {
            tableContent = formatarLivros(data, filtrarDisponivel);
        }
        
        exibirConsultaEmNovaJanela(titulo, tableContent);
    } catch (error) {
        console.error(`Erro ao buscar ${titulo}:`, error);
        alert(`Erro ao carregar dados. Verifique o servidor Node.js. (Detalhe: ${error.message})`);
    }
}

// Funções de formatação de tabelas (simplificadas)
function formatarHistorico(historico) {
    let content = `<thead><tr><th>ID</th><th>Livro</th><th>Usuário</th><th>Empréstimo</th><th>Previsto</th><th>Devolução</th><th>Status</th></tr></thead><tbody>`;
    historico.forEach(item => {
        const dataEmprestimo = new Date(item.data_emprestimo).toLocaleDateString('pt-BR', {timeZone: 'UTC'});
        const dataPrevista = item.data_devolucao_prevista ? new Date(item.data_devolucao_prevista).toLocaleDateString('pt-BR', {timeZone: 'UTC'}) : '-';
        const dataReal = item.data_devolucao_real ? new Date(item.data_devolucao_real).toLocaleDateString('pt-BR', {timeZone: 'UTC'}) : '-';
        const statusColor = item.status_emprestimo === 'atrasado' ? 'red' : item.status_emprestimo === 'devolvido' ? 'green' : 'blue';
        content += `<tr><td>${item.id_emprestimo}</td><td>${item.Titulo_Livro}</td><td>${item.Usuario} (${item.Tipo_Usuario})</td><td>${dataEmprestimo}</td><td>${dataPrevista}</td><td>${dataReal}</td><td><span style="color: ${statusColor}; font-weight: bold;">${item.status_emprestimo.toUpperCase()}</span></td></tr>`;
    });
    content += '</tbody>';
    return content;
}

function formatarEmprestimos(emprestimos, isAtrasado) {
    let content = `<thead><tr><th>ID</th><th>Livro</th><th>Usuário</th><th>Empréstimo</th><th>Previsto</th>${isAtrasado ? '<th>Dias Atraso</th>' : ''}</tr></thead><tbody>`;
    if (emprestimos.length === 0) {
        content += `<tr><td colspan="${isAtrasado ? 6 : 5}" style="text-align: center;">Nenhum registro.</td></tr>`;
    } else {
        emprestimos.forEach(e => {
            const dataEmprestimo = new Date(e.data_emprestimo).toLocaleDateString('pt-BR', {timeZone: 'UTC'});
            const dataPrevista = new Date(e.data_devolucao_prevista).toLocaleDateString('pt-BR', {timeZone: 'UTC'});
            content += `<tr><td>${e.id_emprestimo}</td><td>${e.titulo}</td><td>${e.nome_usuario} (${e.tipo_usuario})</td><td>${dataEmprestimo}</td><td>${dataPrevista}</td>`;
            if (isAtrasado) {
                content += `<td><span style="color: red; font-weight: bold;">${e.dias_atraso}</span></td>`;
            }
            content += `</tr>`;
        });
    }
    content += '</tbody>';
    return content;
}

function formatarLivros(livros, filtrarDisponivel) {
    let content = `<thead><tr><th>ID</th><th>Título</th><th>Autor</th><th>ISBN</th><th>Total</th><th>Disponível</th></tr></thead><tbody>`;
    livros.forEach(livro => {
        if (!filtrarDisponivel || livro.quantidade_disponivel > 0) {
            content += `<tr><td>${livro.id_livro}</td><td>${livro.titulo}</td><td>${livro.autor}</td><td>${livro.isbn}</td><td>${livro.quantidade_total}</td><td>${livro.quantidade_disponivel}</td></tr>`;
        }
    });
    content += '</tbody>';
    return content;
}

// Função para carregar livros disponíveis no select de empréstimo
async function carregarLivros() {
    try {
        const response = await fetch(`${API_URL}/livros`);
        const livros = await response.json(); 
        const selectLivro = document.getElementById('livro');
        selectLivro.innerHTML = '<option value="">Selecione um livro</option>';
        livros.forEach(livro => {
            const option = document.createElement('option');
            option.value = livro.id_livro;
            option.textContent = `${livro.titulo} por ${livro.autor} (Disponível: ${livro.quantidade_disponivel})`;
            if (livro.quantidade_disponivel < 1) {
                option.disabled = true;
            }
            selectLivro.appendChild(option);
        });
    } catch (error) {
        console.error('Erro ao carregar livros (Verifique a rota /livros):', error);
    }
}

// Função para carregar usuários no select de empréstimo
async function carregarUsuarios() {
    try {
        const response = await fetch(`${API_URL}/usuarios`);
        const usuarios = await response.json();
        const selectUsuario = document.getElementById('usuario');
        selectUsuario.innerHTML = '<option value="">Selecione um usuário</option>';
        usuarios.forEach(usuario => {
            const option = document.createElement('option');
            // Formato 'aluno-1' ou 'professor-5'
            option.value = `${usuario.tipo}-${usuario.id}`;
            option.textContent = `${usuario.nome} (${usuario.tipo})`;
            selectUsuario.appendChild(option);
        });
    } catch (error) {
        console.error('Erro ao carregar usuários:', error);
    }
}

// NOVO: Função para carregar usuários no select de exclusão
async function carregarUsuariosExclusao() {
    try {
        const response = await fetch(`${API_URL}/usuarios`);
        const usuarios = await response.json();
        const selectUsuario = document.getElementById('usuario_excluir');
        selectUsuario.innerHTML = '<option value="">Selecione um usuário para excluir</option>';
        usuarios.forEach(usuario => {
            const option = document.createElement('option');
            // Formato 'aluno-1' ou 'professor-5'
            option.value = `${usuario.tipo}-${usuario.id}`; 
            option.textContent = `${usuario.nome} (${usuario.tipo} - ID: ${usuario.id})`;
            selectUsuario.appendChild(option);
        });
    } catch (error) {
        console.error('Erro ao carregar usuários para exclusão:', error);
    }
}

// Função para carregar empréstimos ativos (no prazo)
async function carregarEmprestimosAtivos() {
    try {
        const response = await fetch(`${API_URL}/emprestimos_ativos`);
        const emprestimos = await response.json();

        const lista = document.getElementById('lista-emprestimos-ativos');
        lista.innerHTML = ''; 

        if (emprestimos.length === 0) {
            lista.innerHTML = '<li><p>Nenhum empréstimo ativo (no prazo) no momento.</p></li>';
            return;
        }

        emprestimos.forEach(emprestimo => {
            const li = document.createElement('li');
            li.className = 'emprestimo-card';

            const dataDevolucaoPrevistaFormatada = new Date(emprestimo.data_devolucao_prevista).toLocaleDateString('pt-BR', {timeZone: 'UTC'});

            li.innerHTML = `
                <h4>${emprestimo.titulo} (ID: ${emprestimo.id_emprestimo})</h4>
                <p><strong>Usuário:</strong> ${emprestimo.nome_usuario} (${emprestimo.tipo_usuario})</p>
                <p><strong>Devolução Prevista:</strong> ${dataDevolucaoPrevistaFormatada}</p>
            `;
            lista.appendChild(li);
        });
    } catch (error) {
        console.error('Erro ao carregar empréstimos ativos:', error);
        const lista = document.getElementById('lista-emprestimos-ativos');
        lista.innerHTML = '<li><p style="color: red;">Erro ao carregar. Verifique o servidor.</p></li>';
    }
}

// Função para carregar empréstimos atrasados (vencidos)
async function carregarEmprestimosAtrasados() {
    try {
        const response = await fetch(`${API_URL}/emprestimos_atrasados`);
        
        if (!response.ok) {
            throw new Error(`Erro ${response.status}: Falha ao acessar a rota de atrasados.`);
        }

        const atrasados = await response.json();

        const lista = document.getElementById('lista-emprestimos-atrasados');
        lista.innerHTML = ''; 

        if (atrasados.length === 0) {
            lista.innerHTML = '<li><p>Nenhum empréstimo em atraso no momento. 🎉</p></li>';
            return;
        }

        atrasados.forEach(emprestimo => {
            const li = document.createElement('li');
            li.className = 'emprestimo-card atraso-card'; 

            const dataDevolucaoPrevistaFormatada = new Date(emprestimo.data_devolucao_prevista).toLocaleDateString('pt-BR', {timeZone: 'UTC'});

            li.innerHTML = `
                <h4 style="color: darkred;">ATRASADO (ID: ${emprestimo.id_emprestimo})</h4>
                <p><strong>Livro:</strong> ${emprestimo.titulo}</p>
                <p><strong>Usuário:</strong> ${emprestimo.nome_usuario} (${emprestimo.tipo_usuario})</p>
                <p><strong>Devolução Prevista:</strong> <span style="font-weight: bold; color: darkred;">${dataDevolucaoPrevistaFormatada}</span></p>
                <p><strong>Dias de Atraso:</strong> <span style="font-size: 1.1em; font-weight: bold; color: red;">${emprestimo.dias_atraso}</span></p>
            `;
            lista.appendChild(li);
        });
    } catch (error) {
        console.error('Erro ao carregar empréstimos atrasados:', error);
        const lista = document.getElementById('lista-emprestimos-atrasados');
        lista.innerHTML = '<li><p style="color: red;">Erro ao carregar. Verifique o servidor. (Detalhe: ' + error.message + ')</p></li>';
    }
}