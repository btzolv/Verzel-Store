# 🛒 Verzel Store – Suíte de Testes e Garantia de Qualidade (VZS-142)

Este repositório contém a estratégia de Garantia de Qualidade (QA), a automação de testes E2E e de API e o registro de inconformidades da funcionalidade de **Cupons de Desconto e Frete Grátis** da Verzel Store (versão 2.3.0).

**Ambiente testado:** https://verzel-store.qa-test-verzel-store.workers.dev

---

## 📊 Resultado da Execução

| Total | ✅ Passaram | ❌ Falharam |
|:-:|:-:|:-:|
| 20 | 17 (85%) | 3 (15%) |

As 3 falhas são **defeitos reais da aplicação** e foram mantidas de propósito na suíte, para que o problema fique visível até a correção:

| Bug | Descrição | Severidade | Testes que falham |
|---|---|---|---|
| [BUG-001](docs/report-de-bugs.md#bug-001) | Frete de R$ 19,90 é cobrado com subtotal de exatamente R$ 200,00 (deveria ser grátis) | Alta | CT-E2E-07, CT-E2E-08 |
| [BUG-002](docs/report-de-bugs.md#bug-002) | A API aceita mais de 5 unidades do mesmo produto (`200` em `/calcular` e `201` em `/pedidos`) | Alta | CT-API-03 |

---

## 📁 Estrutura do Repositório

```text
verzel-store-qa/
├── docs/
│   ├── cenarios-de-teste.md      # Cenários em BDD / Gherkin (CA01 a CA11)
│   ├── relatorio-de-execucao.md  # Resultados por teste e rastreabilidade por critério
│   ├── report-de-bugs.md         # Bugs encontrados (BUG-001 e BUG-002)
│   ├── evidencias.md             # Evidências da execução (screenshots e respostas da API)
│   └── evidencias/               # Imagens e respostas de API usadas no evidencias.md
├── e2e/
│   ├── tests/
│   │   ├── api-carrinho.spec.ts  # API: POST /api/carrinho/calcular (CT-API-01 a 04)
│   │   ├── api-pedidos.spec.ts   # API: POST /api/pedidos (CT-API-05 e 06)
│   │   └── e2e-carrinho.spec.ts  # E2E: interface do carrinho (CT-E2E-01 a 12)
│   ├── playwright.config.ts              # Configuração padrão
│   ├── playwright.evidencias.config.ts   # Configuração que gera screenshots e trace de todos os testes
│   └── package.json
└── README.md
```

---

## 🚀 Como Executar a Automação (Playwright)

### Pré-requisitos
- Node.js 18 ou superior
- npm

### Passo a passo

```bash
# 1. Entrar na pasta da automação
cd e2e

# 2. Instalar as dependências
npm install

# 3. Instalar os navegadores do Playwright
npx playwright install

# 4. Executar a suíte
npm run test
```

Outras formas de execução:

```bash
# Interface gráfica do Playwright
npm run test:ui

# Gerar evidências (screenshot e trace de todos os testes + relatório HTML)
npx playwright test -c playwright.evidencias.config.ts
npx playwright show-report
```

> ⚠️ **A suíte termina com 3 testes vermelhos.** Isso é esperado: CT-E2E-07, CT-E2E-08 e CT-API-03 verificam o comportamento correto da especificação e falham por causa dos bugs BUG-001 e BUG-002. Quando os bugs forem corrigidos, devem passar sem alteração no código dos testes.

---

## 🗺️ Cobertura por Critério de Aceite

| CA | Regra | Testes |
|---|---|---|
| CA01 | Cupom `BEMVINDO10` aplica 10% sobre o subtotal, sem incidir no frete | CT-E2E-01 |
| CA02 | Cupom ignora caixa e espaços | CT-E2E-02 (3 variações) |
| CA03 / CA03.1 | Cupom inexistente: `200` no cálculo, `422 CUPOM_INVALIDO` no pedido | CT-E2E-03, CT-API-01, CT-API-05 |
| CA04 / CA04.1 | Cupom expirado: `200` no cálculo, `422 CUPOM_EXPIRADO` no pedido | CT-E2E-04, CT-API-02, CT-API-06 |
| CA05 | Troca de cupom | CT-E2E-05, CT-E2E-06 |
| CA06, CA08, CA09 | Frete grátis a partir de R$ 200,00, com base no subtotal antes do desconto | CT-E2E-07 ❌, CT-E2E-08 ❌, CT-E2E-09 |
| CA07 | Frete fixo de R$ 19,90 abaixo de R$ 200,00 | CT-E2E-10 |
| CA10 / CA10.1 | Limite de 5 unidades por produto | CT-E2E-11, CT-API-03 ❌ |
| CA11 | Valores com 2 casas decimais | CT-API-04, CT-E2E-12 |

A matriz completa, com o resultado de cada teste, está em [relatorio-de-execucao.md](docs/relatorio-de-execucao.md).

---

## 📌 Registro de Interpretações e Ambiguidade de Negócio

Durante o mapeamento das regras de cálculo do carrinho, foram adotadas as seguintes premissas:

- **Elegibilidade ao frete grátis:** o limite de R$ 200,00 considera o **subtotal bruto dos produtos**, antes de qualquer cupom.
- **Incidência do desconto:** o desconto percentual incide somente sobre o subtotal dos produtos e nunca reduz o frete.
- **Validação automatizada:** o CT-E2E-08 e o CT-E2E-09 garantem que a aplicação de um cupom não revoga o frete grátis já conquistado. O CT-E2E-09 passa (subtotal R$ 219,80 + cupom). O CT-E2E-08 falha por causa do BUG-001, que ocorre no valor limite exato.
- **Ordem de validação da API de pedidos:** `/api/pedidos` valida os dados do `cliente` (`nome`, `email`, `cep`) antes do cupom. Por isso os testes CT-API-05 e CT-API-06 enviam um cliente válido, para que a resposta reflita o erro de cupom.
- **Formato de erro da API:** os erros chegam encapsulados (`{ "erro": { "codigo", "mensagem", "campo" } }`), e os testes leem `body.erro.codigo`.

### 💡 Análise de Clareza de Requisitos

- **Terminologia do limite de frete grátis:** a especificação diz *"a partir de R$ 200,00, inclusive"*. Embora *"inclusive"* seja redundante em relação a *"a partir de"*, ele deixa explícita a fronteira (análise de valor limite, BVA) e exige o operador `>=` em vez de `>`. É justamente nesse valor limite que o BUG-001 ocorre.

---

## 📚 Documentação

| Documento | Conteúdo |
|---|---|
| [cenarios-de-teste.md](docs/cenarios-de-teste.md) | Cenários BDD dos critérios de aceite |
| [relatorio-de-execucao.md](docs/relatorio-de-execucao.md) | Resultados, rastreabilidade e correções de scripts |
| [report-de-bugs.md](docs/report-de-bugs.md) | BUG-001 e BUG-002 com passos para reproduzir |
| [evidencias.md](docs/evidencias.md) | Screenshots e respostas reais da API |
