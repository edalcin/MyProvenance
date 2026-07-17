-- Espelha docs/especificacao.md §3. IDs sao UUIDv7 gerados em aplicacao.
CREATE TABLE IF NOT EXISTS usuarios (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  pin_hash TEXT NOT NULL,
  pin_salt TEXT NOT NULL,
  criado_em TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessoes (
  token_hash TEXT PRIMARY KEY,
  usuario_id TEXT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  criado_em TEXT NOT NULL,
  expira_em TEXT NOT NULL
);

-- usuario_id nullable: SQLite nao permite ADD COLUMN NOT NULL sem DEFAULT em
-- tabela com linhas existentes. Obrigatoriedade e' garantida na camada de
-- aplicacao (todo INSERT dos repositories exige usuarioId).
CREATE TABLE IF NOT EXISTS agentes (
  id TEXT PRIMARY KEY,
  usuario_id TEXT REFERENCES usuarios(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('pessoa','instituicao','software')),
  afiliacao TEXT,
  identificador_externo TEXT
);

CREATE TABLE IF NOT EXISTS registros (
  id TEXT PRIMARY KEY,
  usuario_id TEXT REFERENCES usuarios(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  descricao TEXT,
  status TEXT NOT NULL CHECK (status IN ('rascunho','finalizado')) DEFAULT 'rascunho',
  criado_em TEXT NOT NULL,
  finalizado_em TEXT,
  -- Orientacao do diagrama Mermaid escolhida pelo usuario — respeitada no relatorio .md exportado.
  direcao_diagrama TEXT NOT NULL CHECK (direcao_diagrama IN ('LR','TD')) DEFAULT 'LR',
  -- Token opaco do link publico de compartilhamento (somente leitura); NULL = nao compartilhado.
  token_compartilhamento TEXT
);

CREATE TABLE IF NOT EXISTS atividades (
  id TEXT PRIMARY KEY,
  registro_id TEXT NOT NULL REFERENCES registros(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('criacao','transformacao','analise')),
  agente_id TEXT NOT NULL REFERENCES agentes(id),
  data_hora TEXT NOT NULL,
  descricao TEXT,
  local TEXT,
  instrumento TEXT,
  processo TEXT,
  parametros TEXT,          -- JSON serializado (ParametroAtividade[])
  ambiente_execucao TEXT    -- JSON serializado (AmbienteExecucao)
);

CREATE TABLE IF NOT EXISTS entidades (
  id TEXT PRIMARY KEY,
  registro_id TEXT NOT NULL REFERENCES registros(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  descricao TEXT,
  formato TEXT,
  localizacao TEXT,
  licenca TEXT,
  gerada_por_atividade_id TEXT NOT NULL REFERENCES atividades(id)
);

-- entidades usadas como entrada de uma atividade (N:N)
CREATE TABLE IF NOT EXISTS atividade_entidades_usadas (
  atividade_id TEXT NOT NULL REFERENCES atividades(id) ON DELETE CASCADE,
  entidade_id TEXT NOT NULL REFERENCES entidades(id),
  PRIMARY KEY (atividade_id, entidade_id)
);

CREATE INDEX IF NOT EXISTS idx_atividades_registro ON atividades(registro_id);
CREATE INDEX IF NOT EXISTS idx_entidades_registro ON entidades(registro_id);
CREATE INDEX IF NOT EXISTS idx_entidades_gerada_por ON entidades(gerada_por_atividade_id);
CREATE INDEX IF NOT EXISTS idx_registros_titulo ON registros(titulo);
CREATE INDEX IF NOT EXISTS idx_agentes_nome ON agentes(nome);
-- idx_registros_usuario/idx_agentes_usuario: criados em client.ts, apos a migracao idempotente de
-- usuario_id (bancos legados nao tem essa coluna no momento em que este arquivo e executado).
CREATE INDEX IF NOT EXISTS idx_sessoes_usuario ON sessoes(usuario_id);
