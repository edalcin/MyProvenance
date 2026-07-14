# MyProvenance

Ferramenta web para documentar a proveniência (origem, transformação e análise) de conjuntos de dados de pesquisa, sem armazenar os dados em si — apenas os registros descritivos dos eventos, seguindo o modelo W3C PROV (Entidades, Atividades, Agentes).

## Language

**Entidade**:
Registro de metadados que descreve um artefato/versão de um conjunto de dados (ex.: nome, descrição, formato, localização). Nunca contém o dado de pesquisa em si — apenas informações sobre ele, inseridas manualmente pelo usuário. Cada Atividade de Criação ou Transformação gera uma nova Entidade (nova versão).
_Avoid_: Dataset (usar só para o dado real, fora do sistema), Arquivo

**Atividade**:
Registro manual, preenchido pelo usuário via formulário, de um processo que usa e/ou gera Entidades. Três tipos — Criação, Transformação, Análise — cada um com regra própria de cardinalidade de entrada/saída (ver abaixo).
_Avoid_: Evento

**Criação**:
Atividade que gera exatamente 1 Entidade nova, sem usar nenhuma Entidade de entrada. É a origem de uma linhagem.

**Transformação**:
Atividade que usa 1 ou mais Entidades existentes e gera exatamente 1 Entidade nova (a próxima versão).

**Análise**:
Atividade que usa 1 ou mais Entidades existentes e gera 0 ou 1 Entidade nova. A saída (ex.: relatório, figura, resultado estatístico) é opcional.

**Agente**:
Registro cadastrado e reutilizável que identifica quem ou o que é responsável por uma Atividade: Pessoa, Instituição ou Software. Selecionado via autocomplete a partir de um cadastro, nunca redigitado — evita duplicidade e inconsistência de nomes entre Atividades.
_Avoid_: Usuário (não há contas/login nesta ferramenta), Autor

**Registro de Proveniência**:
Container de nível mais alto: um grafo de Entidades e Atividades, com título (obrigatório) e descrição (opcional) próprios. É a unidade persistida no SQLite, exportada como JSON e renderizada como diagrama Mermaid + relatório. Pode ter mais de uma Entidade-raiz (Criação) quando Transformações combinam dados de origens diferentes.
_Avoid_: Projeto (reservado ao projeto de pesquisa externo, maior que a ferramenta), Sessão

**Rascunho / Finalizado**:
Os dois estados de um Registro de Proveniência. Rascunho: edição livre de Entidades e Atividades. Finalizado: atingido na primeira exportação do JSON (ou ação explícita do usuário); a partir daí o histórico existente é imutável, só é possível adicionar novas Entidades/Atividades.
_Avoid_: Publicado, Bloqueado, Travado
