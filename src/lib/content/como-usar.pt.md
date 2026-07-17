# Como usar

Veja como documentar a proveniência de uma planilha de dados de biodiversidade, do dado bruto ao resultado da análise.

1. Crie um Registro de Proveniência com um título — por exemplo, "Ocorrências de Myrcia na Mata Atlântica".
2. Cadastre os Agentes envolvidos: você (Pessoa), sua instituição (Instituição) e os programas usados (Software), como R ou OpenRefine.
3. Registre a primeira Atividade do tipo Criação, que dá início à linhagem. Ex.: a planilha bruta coletada em campo, "ocorrencias_brutas.csv", gerada por você.
4. Adicione uma Transformação: use "ocorrencias_brutas.csv" e gere "ocorrencias_darwincore.csv", descrevendo a limpeza e a padronização das colunas para o padrão Darwin Core (por exemplo, mapeando "espécie" para scientificName e "lat/long" para decimalLatitude/decimalLongitude).
5. Registre uma Análise: use "ocorrencias_darwincore.csv" para gerar um resultado, como "mapa_de_riqueza.png", informando o Software e os parâmetros usados.
6. Acompanhe o diagrama de proveniência sendo desenhado automaticamente e, ao final, exporte o relatório .md ou o JSON completo para arquivar ou compartilhar.

> Dica: use o botão TD/LR sobre o diagrama para vê-lo na vertical (de cima para baixo) ou na horizontal (da esquerda para a direita).
