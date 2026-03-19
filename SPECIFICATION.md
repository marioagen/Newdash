# Especificação Funcional Detalhada: Dashboard de Indicadores de Serviço

## 1. Visão Geral
O Dashboard de Indicadores de Serviço é uma ferramenta de monitoramento em tempo real projetada para gestores e executivos. O objetivo principal é consolidar métricas de consumo de IA e eficiência operacional em uma interface densa, eliminando a necessidade de rolagem (scroll) e permitindo filtragem dinâmica avançada.

## 2. Interface e Experiência do Usuário (UX/UI)
- **Densidade de Informação**: O layout deve ser otimizado para exibir 9 KPIs de topo e 9 gráficos principais em uma única tela (100vh).
- **Temas**: Suporte total a Light Mode e Dark Mode com paleta de cores adaptativa (Indigo, Emerald, Amber, Blue).
- **Responsividade**: Grid adaptável que prioriza a visualização em tela cheia no desktop.

## 3. Especificações dos Filtros e Controles
Os filtros operam de forma cumulativa (Lógica booleana AND). A interface deve refletir o estado ativo de cada filtro.

### A) Filtro de Período (Temporal)
Define o intervalo de dados processados nos gráficos e KPIs.
1. **Mês Atual**: Do dia 01 até o último dia do mês corrente.
2. **Mês Passado**: Do dia 01 até o último dia do mês anterior ao vigente.
3. **Últimos 7 dias**: Dados dos últimos 7 dias (D-6 até hoje), considerando de 00:00 do primeiro dia até 23:59 de hoje.
4. **Últimos 30 dias**: Período fixo de 30 dias retroativos.
5. **Últimos 60 dias**: Período fixo de 60 dias retroativos.
6. **Personalizado**: Permite a seleção manual de Data Inicial e Data Final via calendário.
   - *Regra*: Deve considerar das 00:00 do primeiro dia até as 23:59 do último dia selecionado.

### B) Filtros de Segmentação (Multi-seleção)
Menus suspensos que permitem a seleção de um ou mais itens.
- **Filtro Solicitante**: Multi-seleção de empresas/clientes solicitantes.
- **Filtro Atribuído**: Lista de usuários responsáveis (antigo "Usuário").
- **Filtro Esteira de Processamento**: Lista de pipelines/fluxos de trabalho de IA.
- **Filtro Time**: Agrupamentos de equipes (ex: Alpha, Beta, Gamma).
- *Regra de UI*: Exibir um contador (badge) no botão do filtro indicando quantos itens estão selecionados.

### C) Timer de Atualização Automática
Permite que o dashboard se auto-atualize sem recarregar a página.
- **Opções**: Desativado, 1 min, 5 min, 10 min, 15 min, 30 min, 60 min (1h), 120 min (2h), 240 min (4h), 360 min (6h), 480 min (8h), 720 min (12h).
- **Regra**: A atualização deve manter todos os filtros de segmentação e período ativos.
- **Feedback**: O horário da última atualização bem-sucedida deve ser exibido no rodapé.

### D) Filtro de Visibilidade e Reordenação
- **Filtro de Gráficos**: Multi-seleção localizado após o Auto-Refresh. Permite ocultar/exibir gráficos individualmente.
- **Animação**: A entrada e saída dos gráficos deve ser animada (fade/scale).
- **Reordenação**: Permite que o usuário arraste e solte os gráficos para reorganizar a visualização.
- **Persistência**: A ordem e visibilidade devem ser mantidas durante a sessão.

## 4. Especificações dos Gráficos e Visualização de Dados
### Regras de Renderização
- **Granularidade Diária**: Para qualquer período selecionado de até 30 dias, o eixo X deve obrigatoriamente exibir os dados **dia a dia**.
- **Interatividade (Hover)**: Ao passar o mouse sobre colunas ou linhas, exibir tooltip com:
  - Valor numérico exato.
  - Descrição da métrica conforme a legenda.
- **Ajuda Contextual**: Cada gráfico deve possuir um ícone de **INFORMAÇÃO** (i) ao lado do título.
  - *Comportamento*: Exibir tooltip explicativo sobre o que o gráfico representa e qual a fonte do dado.

### Gráficos Padrão
1. **Consumo Diário de Tokens**: Gráfico de Barras (Indigo).
2. **Páginas Processadas**: Gráfico de Área (Emerald).
3. **Documentos Processados**: Gráfico de Barras (Rose).
4. **Execuções de Automação**: Gráfico de Barras (Amber).
5. **Notificações Enviadas**: Gráfico de Barras Empilhadas (Violet/Multi).
6. **Agentes IA (Barra Horizontal)**: Ranking de volume por agente de IA.
7. **Top Atribuídos (Barra Horizontal)**: Ranking de utilização por usuário atribuído.
8. **Top Solicitantes (Barra Horizontal)**: Ranking de utilização por solicitante.
9. **Consumo de Recursos (WTC)**: Gráfico de Linha/Step (Blue).

## 5. Regras de Negócio e Cálculos
- **Tokens de IA**: Soma de tokens de entrada e saída processados pelos modelos.
- **Páginas**: Contagem de páginas de documentos enviadas ao agente de digitalização.
- **Execuções**: Contagem de instâncias de esteiras finalizadas com status "Sucesso".
- **WTC (Workload Total Consumption)**: Cálculo ponderado do consumo total de infraestrutura.
- **Docs**: Quantidade total de documentos processados (PDF, Imagens, etc).
- **Notificações**: Total de alertas enviados via WhatsApp, Email e SMS.
- **Agentes**: Volume total de processamento por agentes de IA.
- **Uniq. Atrib.**: Quantidade de usuários únicos atribuídos.
- **Uniq. Solicit.**: Quantidade de solicitantes únicos.
- **Persistência**: Os filtros selecionados devem ser mantidos durante a sessão do usuário, mesmo após atualizações automáticas do timer.

## 6. Requisitos Técnicos e Performance
- **Framework**: React 19 com TypeScript.
- **Biblioteca de Gráficos**: Recharts.
- **Ícones**: Lucide-React.
- **Performance**: Implementar `memoization` nos componentes de gráfico e lógica de filtragem para garantir fluidez em grandes volumes de dados.
- **Latência**: O tempo de resposta visual após alteração de filtro não deve exceder 300ms.

## 7. Critérios de Aceite para QA
- [ ] O dashboard carrega os 9 gráficos na mesma tela sem scroll em 1080p.
- [ ] O timer de atualização reinicia corretamente o ciclo ao ser alterado.
- [ ] O filtro "Personalizado" valida se a data fim é posterior à data início.
- [ ] O Dark Mode é aplicado corretamente a todos os elementos, incluindo tooltips dos gráficos.
- [ ] O botão "Limpar Filtros" restaura o estado inicial (Últimos 7 dias, sem segmentação, timer desativado).
