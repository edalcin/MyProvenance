-- Espelha docs/especificacao.md §3. IDs sao UUIDv7 gerados em aplicacao.
CREATE TABLE IF NOT EXISTS agentes (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('pessoa','instituicao','software')),
  afiliacao TEXT,
  identificador_externo TEXT
);

CREATE TABLE IF NOT EXISTS registros (
  id TEXT PRIMARY KEY,
  titulo TEXT NOT NULL,
  descricao TEXT,
  status TEXT NOT NULL CHECK (status IN ('rascunho','finalizado')) DEFAULT 'rascunho',
  criado_em TEXT NOT NULL,
  finalizado_em TEXT
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
