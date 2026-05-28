# Projeto: Calculadora de Anilhas para Barra

## Requisitos de Negócio

- Aplicativo de tela única que calcula quais anilhas devem ser colocadas **em cada lado da barra** para atingir o peso total informado pelo usuário
- O usuário escolhe entre duas barras: **15 kg** ou **20 kg**
- O usuário informa o **peso total desejado em quilogramas — já incluindo a barra**
- O app calcula e exibe as anilhas a serem colocadas de um lado da barra (a distribuição é sempre simétrica — o outro lado é idêntico)
- O cálculo deve usar o **menor número de anilhas possível** (greedy: maiores anilhas primeiro), respeitando as quantidades disponíveis em estoque
- Se o peso solicitado for impossível de atingir exatamente com as anilhas disponíveis, exibir mensagem clara ao usuário
- Prioridade máxima: UI/UX sofisticada, elegante e de alto nível — funcionalidade direta e sem ruído

## Anilhas Disponíveis

### Em libras

| Anilha | Equivalente em kg | Quantidade total | Pares disponíveis |
|--------|------------------|-----------------|-------------------|
| 45 lb  | 20,412 kg        | 10              | 5                 |
| 35 lb  | 15,876 kg        | 10              | 5                 |
| 25 lb  | 11,340 kg        | 10              | 5                 |
| 15 lb  | 6,804 kg         | 10              | 5                 |
| 10 lb  | 4,536 kg         | 10              | 5                 |

### Em quilogramas

| Anilha   | Quantidade total | Pares disponíveis |
|----------|-----------------|-------------------|
| 10 kg    | 6               | 3                 |
| 5 kg     | 4               | 2                 |
| 2,5 kg   | 2               | 1                 |
| 1,25 kg  | 2               | 1                 |

> "Par" = 2 anilhas iguais (uma por lado). O cálculo de disponibilidade deve considerar pares, nunca unidades avulsas.

## Lógica de Cálculo

1. `peso_por_lado = (peso_total - peso_barra) / 2`
2. Se `peso_por_lado <= 0`, exibir erro: peso informado é menor ou igual ao peso da barra
3. Aplicar algoritmo **greedy decrescente**: tentar encaixar a maior anilha disponível primeiro, subtraindo seu valor de `peso_por_lado`, repetindo até zerar ou esgotar as opções
4. Ordem de prioridade das anilhas (maior para menor, em kg):
   - 45 lb (20,412 kg) → 35 lb (15,876 kg) → 25 lb (11,340 kg) → 10 kg → 15 lb (6,804 kg) → 5 kg → 10 lb (4,536 kg) → 2,5 kg → 1,25 kg
5. Respeitar o limite de pares disponíveis de cada anilha
6. Usar tolerância de `± 0,01 kg` para considerar o peso como atingido (erros de ponto flutuante na conversão lb→kg)
7. Se ao final restar resíduo fora da tolerância, o app **não exibe erro** — exibe a solução mais próxima atingível (a que minimiza o valor absoluto do resíduo) e informa ao usuário, de forma destacada, o quanto **faltou** ou **excedeu** em kg. Exemplos:
   - "Peso atingido: 97,5 kg — faltaram 2,5 kg para os 100 kg solicitados"
   - "Peso atingido: 101,25 kg — excedeu 1,25 kg em relação aos 100 kg solicitados"

> As conversões lb→kg devem usar o fator padrão `1 lb = 0,453592 kg`.

## Tela Única (`/`)

### Elementos da interface

1. **Seletor de barra**: dois botões ou toggle — "Barra 15 kg" / "Barra 20 kg"
2. **Campo de peso total**: entrada numérica em kg — **peso total incluindo a barra** (aceitar decimais; ex: 82,5)
3. **Botão calcular**
4. **Resultado**: lista visual das anilhas a colocar em cada lado, com representação gráfica das anilhas (discos empilhados na barra, com cores distintas por tipo/peso)
5. **Resumo**: peso total calculado confirmado + peso da barra + peso por lado; se houver resíduo, exibir aviso destacado com a diferença em kg (faltou / excedeu)
6. **Mensagem de erro** apenas quando o peso informado for menor ou igual ao peso da barra, ou quando o valor inserido for inválido

### Representação visual da barra

- Exibir um diagrama esquemático da barra com as anilhas empilhadas em ambos os lados, proporcionalmente ao tamanho de cada anilha
- Cores obrigatórias por anilha:

  | Anilha  | Cor do disco | Rótulo |
  |---------|-------------|--------|
  | 45 lb   | Azul (`#209dd7`)   | Branco |
  | 35 lb   | Amarelo (`#ecad0a`) | Dark Navy |
  | 25 lb   | Verde (`#2e9e5b`)  | Branco |
  | 15 lb   | Cinza (`#9e9e9e`)  | **Dark Navy ou branco — nunca cinza** |
  | 10 lb   | Branco (`#f0f0f0`) | Dark Navy |
  | 10 kg   | Preto — ver regra abaixo | Dourado (`#ecad0a`) |
  | 5 kg    | Preto — ver regra abaixo | Dourado (`#ecad0a`) |
  | 2,5 kg  | Preto — ver regra abaixo | Dourado (`#ecad0a`) |
  | 1,25 kg | Preto — ver regra abaixo | Dourado (`#ecad0a`) |

- **Anilhas pretas sobre fundo escuro**: renderizar com gradiente interno `#2a2a2a → #111111` + borda metálica prata (`#b0b8c1`) com espessura visível (mín. 2px), criando separação clara em relação ao fundo navy. O rótulo em dourado (`#ecad0a`) garante leitura imediata
- **Anilha branca (10 lb)**: adicionar borda fina cinza escura (`#555555`) para delimitar o disco contra qualquer fundo claro adjacente

## Detalhes Técnicos

- Implementado como **PWA (Progressive Web App)** com Next.js moderno, renderizado no cliente
- O app Next.js deve ser criado no subdiretório `frontend/`
- **Hospedado no GitHub Pages** — o build estático é publicado via `gh-pages` ou GitHub Actions; configurar `basePath` e `assetPrefix` no `next.config.js` com o nome do repositório
- Usar `output: 'export'` no `next.config.js` para gerar build estático compatível com GitHub Pages (sem servidor Node.js em produção)
- **Uso offline obrigatório**: o Service Worker deve fazer cache de todos os assets estáticos no primeiro acesso, permitindo que o app funcione completamente sem conexão após a instalação
- Estratégia de cache: `CacheFirst` para assets estáticos (JS, CSS, ícones, fontes); o app não faz requisições externas, então não há necessidade de estratégia de rede
- **PWA instalável**: configurar `next-pwa` (ou equivalente atual) com `manifest.json` e Service Worker para permitir instalação na tela inicial do iPhone e Android diretamente pelo browser
- `manifest.json` deve incluir: `name`, `short_name`, `start_url`, `display: standalone`, `background_color`, `theme_color` (usar Dark Navy `#032147`), e ícones nos tamanhos 192×192 e 512×512
- Para iOS: incluir as metatags `apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style` e `apple-touch-icon` no `<head>`
- **Sem persistência** — estado local com `useState`; sem backend, sem banco de dados
- **Sem autenticação**
- Usar bibliotecas populares e bem mantidas
- A lógica de cálculo deve estar isolada em um módulo utilitário puro (`lib/calcularAnilhas.ts`), completamente independente da UI, facilitando testes unitários

## Paleta de Cores

| Token | Hex | Uso |
|-------|-----|-----|
| Accent Gold | `#ecad0a` | destaques, bordas ativas, rótulos das anilhas pretas |
| Blue Primary | `#209dd7` | links, seções principais, disco da anilha 45 lb |
| Purple Secondary | `#753991` | botões de ação principal, badges |
| Dark Navy | `#032147` | fundo principal, cabeçalhos |
| Gray Text | `#888888` | texto de suporte, rótulos secundários |

O tema deve ser **escuro** (fundo navy profundo), com texto claro e acentos metálicos/dourados — remetendo à estética de equipamentos de academia profissional.

## Design e UX

- Tipografia esportiva e técnica — evitar Inter, Roboto e system fonts genéricos
- Visual inspirado em equipamentos de academia de alto nível: aço, borracha, precisão
- O diagrama da barra é o elemento central da tela — deve ser grande, legível e satisfatório de ver
- Feedback imediato ao digitar o peso (calcular em tempo real sem precisar apertar botão, ou com botão proeminente)
- Layout responsivo, mas otimizado para uso em smartphone dentro da academia

## Estratégia de Execução

1. Elaborar plano detalhado com fases e critérios de sucesso verificáveis, incluindo scaffolding do projeto e `.gitignore`
2. Implementar e testar exaustivamente o módulo `lib/calcularAnilhas.ts` com casos de borda: peso exato da barra, peso inatingível (verificar solução mais próxima por déficit e por excesso), uso de todos os pares disponíveis, combinações mistas lb+kg
3. Construir a UI sobre a lógica já validada
4. Realizar testes de integração com Playwright ou equivalente, corrigindo defeitos
5. Só concluir quando o MVP estiver completo, testado e com o servidor em execução

## Padrões de Código

1. Usar as versões mais recentes das bibliotecas e abordagens idiomáticas
2. Manter simplicidade — nunca over-engineer, sempre simplificar, sem programação defensiva desnecessária
3. Sem funcionalidades extras além do especificado — foco total na essência do produto
4. README mínimo e direto; sem emojis em nenhum arquivo do projeto
5. Separação clara entre lógica de negócio (`lib/`) e componentes de UI
