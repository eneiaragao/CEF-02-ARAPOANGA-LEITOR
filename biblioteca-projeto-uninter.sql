-- DDL OTIMIZADO PARA COMPATIBILIDADE COM O CÓDIGO DO SERVER.JS
-- O modelo foi ajustado para 1:1 (Um Empréstimo = Um Livro) para simplificar a aplicação Web,
-- que não suporta empréstimo de múltiplos livros de uma só vez.

-- Desativa a verificação de chaves estrangeiras temporariamente
SET FOREIGN_KEY_CHECKS = 0;

-- -----------------------------------------------------
-- Schema biblioteca_escolar
-- -----------------------------------------------------
CREATE SCHEMA IF NOT EXISTS `biblioteca_escolar` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE `biblioteca_escolar`;

-- -----------------------------------------------------
-- Tabela `bibliotecarios`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `bibliotecarios` (
  `id_bibliotecario` INT NOT NULL AUTO_INCREMENT COMMENT 'Chave primária para identificar o bibliotecário.',
  `nome` VARCHAR(255) NOT NULL COMMENT 'Nome completo do bibliotecário.',
  `cpf` VARCHAR(14) UNIQUE NOT NULL COMMENT 'CPF do bibliotecário, deve ser único.',
  `telefone` VARCHAR(20) NULL COMMENT 'Número de telefone do bibliotecário.',
  `email` VARCHAR(255) UNIQUE NULL COMMENT 'Endereço de e-mail do bibliotecário, deve ser único.',
  `login` VARCHAR(50) UNIQUE NOT NULL COMMENT 'Login de acesso do bibliotecário ao sistema, deve ser único.',
  `senha` VARCHAR(255) NOT NULL COMMENT 'Senha de acesso do bibliotecário (idealmente armazenada como hash).',
  PRIMARY KEY (`id_bibliotecario`)
) ENGINE = InnoDB COMMENT = 'Tabela para armazenar informações sobre os bibliotecários.';

-- -----------------------------------------------------
-- Tabela `alunos`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `alunos` (
  `id_aluno` INT NOT NULL AUTO_INCREMENT COMMENT 'Chave primária para identificar o aluno.',
  `nome` VARCHAR(255) NOT NULL COMMENT 'Nome completo do aluno.',
  `matricula` VARCHAR(50) UNIQUE NOT NULL COMMENT 'Número de matrícula do aluno, deve ser único.',
  `cpf` VARCHAR(14) UNIQUE NULL COMMENT 'CPF do aluno, deve ser único.',
  `telefone` VARCHAR(20) NULL COMMENT 'Número de telefone do aluno.',
  `email` VARCHAR(255) UNIQUE NULL COMMENT 'Endereço de e-mail do aluno, deve ser único.',
  PRIMARY KEY (`id_aluno`)
) ENGINE = InnoDB COMMENT = 'Tabela para armazenar informações sobre os alunos.';

-- -----------------------------------------------------
-- Tabela `professores`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `professores` (
  `id_professor` INT NOT NULL AUTO_INCREMENT COMMENT 'Chave primária para identificar o professor.',
  `nome` VARCHAR(255) NOT NULL COMMENT 'Nome completo do professor.',
  `cpf` VARCHAR(14) UNIQUE NULL COMMENT 'CPF do professor, deve ser único.',
  `telefone` VARCHAR(20) NULL COMMENT 'Número de telefone do professor.',
  `email` VARCHAR(255) UNIQUE NULL COMMENT 'Endereço de e-mail do professor, deve ser único.',
  `departamento` VARCHAR(100) NULL COMMENT 'Departamento ao qual o professor pertence.',
  PRIMARY KEY (`id_professor`)
) ENGINE = InnoDB COMMENT = 'Tabela para armazenar informações sobre os professores.';

-- -----------------------------------------------------
-- Tabela `livros`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `livros` (
  `id_livro` INT NOT NULL AUTO_INCREMENT COMMENT 'Chave primária para identificar o livro.',
  `titulo` VARCHAR(255) NOT NULL COMMENT 'Título do livro.',
  `autor` VARCHAR(255) NOT NULL COMMENT 'Nome do autor do livro.',
  `isbn` VARCHAR(17) UNIQUE NOT NULL COMMENT 'ISBN do livro, deve ser único.',
  `ano_publicacao` INT NULL COMMENT 'Ano de publicação do livro.',
  `editora` VARCHAR(100) NULL COMMENT 'Nome da editora do livro.',
  `genero` VARCHAR(100) NULL COMMENT 'Gênero ou categoria do livro.',
  `quantidade_total` INT NOT NULL DEFAULT 0 COMMENT 'Número total de cópias deste livro na biblioteca.',
  `quantidade_disponivel` INT NOT NULL DEFAULT 0 COMMENT 'Número de cópias deste livro que estão disponíveis para empréstimo.',
  PRIMARY KEY (`id_livro`),
  CONSTRAINT `chk_quantidade_disponivel` CHECK (`quantidade_disponivel` <= `quantidade_total`)
) ENGINE = InnoDB COMMENT = 'Tabela para armazenar informações sobre os livros.';

-- -----------------------------------------------------
-- Tabela `emprestimos` (AGORA COM id_livro DIRETO)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `emprestimos` (
  `id_emprestimo` INT NOT NULL AUTO_INCREMENT COMMENT 'Chave primária para identificar o empréstimo.',
  `id_livro` INT NOT NULL COMMENT 'Chave estrangeira referenciando o livro emprestado.',
  `id_bibliotecario` INT NOT NULL COMMENT 'Bibliotecário que realizou o empréstimo.',
  `id_aluno` INT NULL COMMENT 'Aluno que pegou o livro emprestado (nulo se for professor).',
  `id_professor` INT NULL COMMENT 'Professor que pegou o livro emprestado (nulo se for aluno).',
  `data_emprestimo` DATE NOT NULL DEFAULT (CURRENT_DATE) COMMENT 'Data em que o empréstimo foi realizado.',
  `data_devolucao_prevista` DATE NOT NULL COMMENT 'Data prevista para a devolução do livro.',
  `data_devolucao_real` DATE NULL COMMENT 'Data real em que o livro foi devolvido (nulo se ainda não devolvido).',
  PRIMARY KEY (`id_emprestimo`),
  INDEX `fk_emprestimos_bibliotecarios_idx` (`id_bibliotecario` ASC) VISIBLE,
  INDEX `fk_emprestimos_alunos_idx` (`id_aluno` ASC) VISIBLE,
  INDEX `fk_emprestimos_professores_idx` (`id_professor` ASC) VISIBLE,
  INDEX `fk_emprestimos_livros_idx` (`id_livro` ASC) VISIBLE, -- NOVO ÍNDICE
  
  CONSTRAINT `fk_emprestimos_bibliotecarios`
    FOREIGN KEY (`id_bibliotecario`) REFERENCES `bibliotecarios` (`id_bibliotecario`)
    ON DELETE NO ACTION ON UPDATE NO ACTION,
  
  CONSTRAINT `fk_emprestimos_alunos`
    FOREIGN KEY (`id_aluno`) REFERENCES `alunos` (`id_aluno`)
    ON DELETE NO ACTION ON UPDATE NO ACTION,
  
  CONSTRAINT `fk_emprestimos_professores`
    FOREIGN KEY (`id_professor`) REFERENCES `professores` (`id_professor`)
    ON DELETE NO ACTION ON UPDATE NO ACTION,
  
  CONSTRAINT `fk_emprestimos_livros` -- NOVA CHAVE ESTRANGEIRA
    FOREIGN KEY (`id_livro`) REFERENCES `livros` (`id_livro`)
    ON DELETE NO ACTION ON UPDATE NO ACTION,
  
  -- Garante que um empréstimo seja feito por um aluno OU um professor, mas não ambos.
  CONSTRAINT `chk_borrower_type` CHECK (
    (`id_aluno` IS NOT NULL AND `id_professor` IS NULL) OR
    (`id_aluno` IS NULL AND `id_professor` IS NOT NULL)
  )
) ENGINE = InnoDB COMMENT = 'Tabela para registrar os empréstimos de livros.';

-- -----------------------------------------------------
-- Tabela itens_emprestimo e status_emprestimo foram REMOVIDOS/SIMPLIFICADOS
-- O status será calculado pelo código ou pelas consultas (data_devolucao_real vs data_devolucao_prevista).
-- -----------------------------------------------------


-- Reativa a verificação de chaves estrangeiras
SET FOREIGN_KEY_CHECKS = 1;

-- -----------------------------------------------------
-- Consultas SQL para Verificação (Atualizadas)
-- -----------------------------------------------------
-- 1. TODOS OS LIVROS EMPRESTADOS ATUALMENTE (No Prazo + Atrasados)
SELECT
    e.id_emprestimo,
    l.titulo AS Titulo_Livro,
    l.isbn AS ISBN,
    COALESCE(a.nome, p.nome) AS Usuario,
    CASE WHEN e.id_aluno IS NOT NULL THEN 'Aluno' ELSE 'Professor' END AS Tipo_Usuario,
    e.data_emprestimo,
    e.data_devolucao_prevista
FROM emprestimos e
JOIN livros l ON e.id_livro = l.id_livro
LEFT JOIN alunos a ON e.id_aluno = a.id_aluno
LEFT JOIN professores p ON e.id_professor = p.id_professor
WHERE 
    e.data_devolucao_real IS NULL
ORDER BY 
    e.data_devolucao_prevista ASC;

-- 2. TODOS OS LIVROS ATUALMENTE EM ATRASO (Vencidos)
SELECT
    e.id_emprestimo,
    l.titulo AS Titulo_Livro,
    COALESCE(a.nome, p.nome) AS Usuario,
    CASE WHEN e.id_aluno IS NOT NULL THEN 'Aluno' ELSE 'Professor' END AS Tipo_Usuario,
    e.data_devolucao_prevista AS Previsto_Para,
    DATEDIFF(CURDATE(), e.data_devolucao_prevista) AS Dias_Atraso
FROM emprestimos e
JOIN livros l ON e.id_livro = l.id_livro
LEFT JOIN alunos a ON e.id_aluno = a.id_aluno
LEFT JOIN professores p ON e.id_professor = p.id_professor
WHERE 
    e.data_devolucao_real IS NULL 
    AND e.data_devolucao_prevista < CURDATE()
ORDER BY 
    Dias_Atraso DESC;

-- 3. HISTÓRICO COMPLETO DE LOCAÇÕES DE CADA LIVRO
SELECT
    l.titulo AS Titulo_Livro,
    l.autor AS Autor,
    e.id_emprestimo,
    COALESCE(a.nome, p.nome) AS Usuario,
    CASE WHEN e.id_aluno IS NOT NULL THEN 'Aluno' ELSE 'Professor' END AS Tipo_Usuario,
    e.data_emprestimo,
    e.data_devolucao_prevista,
    e.data_devolucao_real,
    CASE
        WHEN e.data_devolucao_real IS NOT NULL AND e.data_devolucao_real > e.data_devolucao_prevista THEN 'DEVOLVIDO COM ATRASO'
        WHEN e.data_devolucao_real IS NOT NULL THEN 'DEVOLVIDO NO PRAZO'
        WHEN e.data_devolucao_prevista < CURDATE() THEN 'ATRASADO'
        ELSE 'ATIVO NO PRAZO'
    END AS Status_Completo
FROM livros l
JOIN emprestimos e ON l.id_livro = e.id_livro
LEFT JOIN alunos a ON e.id_aluno = a.id_aluno
LEFT JOIN professores p ON e.id_professor = p.id_professor
ORDER BY 
    l.titulo, e.data_emprestimo DESC;


-- ALTERAÇÃO PARA BANCO JÁ CRIADO
USE `biblioteca_escolar`;

-- 1. Remover as chaves estrangeiras existentes
ALTER TABLE `emprestimos` 
DROP FOREIGN KEY `fk_emprestimos_alunos`;

ALTER TABLE `emprestimos` 
DROP FOREIGN KEY `fk_emprestimos_professores`;


-- 2. Adicionar as chaves estrangeiras com ON DELETE CASCADE
ALTER TABLE `emprestimos`
ADD CONSTRAINT `fk_emprestimos_alunos`
  FOREIGN KEY (`id_aluno`)
  REFERENCES `alunos` (`id_aluno`)
  -- AQUI ESTÁ A CORREÇÃO:
  ON DELETE CASCADE ON UPDATE NO ACTION; 

ALTER TABLE `emprestimos`
ADD CONSTRAINT `fk_emprestimos_professores`
  FOREIGN KEY (`id_professor`)
  REFERENCES `professores` (`id_professor`)
  -- AQUI ESTÁ A CORREÇÃO:
  ON DELETE CASCADE ON UPDATE NO ACTION;