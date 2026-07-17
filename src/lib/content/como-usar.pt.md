# Como usar

Veja como documentar a proveniência de uma planilha de dados de biodiversidade, do dado bruto ao resultado da análise.

1. Crie um Registro de Proveniência com um título — por exemplo, "Ocorrências de Myrcia na Mata Atlântica".
2. Cadastre os Agentes envolvidos: você (Pessoa), sua instituição (Instituição) e os programas usados (Software), como R ou OpenRefine.
3. Registre a primeira Atividade do tipo Criação, que dá início à linhagem. Ex.: a planilha bruta coletada em campo, "ocorrencias_brutas.csv", gerada por você.
4. Adicione uma Transformação: use "ocorrencias_brutas.csv" e gere "ocorrencias_darwincore.csv", descrevendo a limpeza e a padronização das colunas para o padrão Darwin Core (por exemplo, mapeando "espécie" para scientificName e "lat/long" para decimalLatitude/decimalLongitude).
5. Registre uma Análise: use "ocorrencias_darwincore.csv" para gerar um resultado, como "mapa_de_riqueza.png", informando o Software e os parâmetros usados.
6. Precisou corrigir algo depois? Registre uma nova Transformação usando "ocorrencias_darwincore.csv" e, na Entidade gerada, escolha a relação com a origem: "Revisão" quando o resultado é uma nova versão da mesma Entidade (ex.: "ocorrencias_darwincore_v2.csv" corrigindo coordenadas trocadas) — selecione qual Entidade de entrada está sendo revisada; ou "Derivação" quando a nova Entidade nasce do conjunto de entradas usadas na Atividade, sem ser uma correção direta de uma única fonte (ex.: um subconjunto filtrado por família taxonômica). No diagrama, revisão aparece como seta pontilhada e derivação como seta rotulada "(derivação)".
7. Acompanhe o diagrama de proveniência sendo desenhado automaticamente e, ao final, exporte o relatório .md ou o JSON completo para arquivar ou compartilhar.

> Dica: use o botão TD/LR sobre o diagrama para vê-lo na vertical (de cima para baixo) ou na horizontal (da esquerda para a direita).

## "Finalizar" e "Exportar JSON" são coisas diferentes

- **Exportar JSON** baixa uma cópia completa do Registro a qualquer momento, em qualquer status (Rascunho ou Finalizado) — serve de backup ou arquivo temporário. Não muda nada no Registro. Sem Conta, é a sua única forma de continuar o trabalho depois: como nada é salvo no servidor, exporte o JSON antes de sair e faça upload dele na próxima visita para retomar de onde parou.
- **Finalizar** é uma decisão deliberada e sem volta: trava as Entidades e Atividades já registradas — nenhuma delas pode mais ser editada ou excluída, mas você ainda pode adicionar novas. Use quando o Registro estiver pronto para ser tratado como documento oficial e auditável. Título e descrição continuam editáveis mesmo depois de finalizado.
