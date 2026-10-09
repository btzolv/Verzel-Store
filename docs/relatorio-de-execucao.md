# 🧪 Relatório de Execução dos Testes (API e E2E)

**Projeto:** Verzel Store – Entrega VZS-142
**Versão testada:** 2.3.0
**Ambiente:** https://verzel-store.qa-test-verzel-store.workers.dev
**Data da execução:** 09/10/2026
**Ferramenta:** Playwright (Chromium, desktop)
**Responsável:** Beatriz de Oliveira – QA

**Documentos relacionados:** [Cenários de teste](cenarios-de-teste.md) · [Relatório de bugs](report-de-bugs.md)

---

## Resumo da Execução

| Suíte | Arquivo | Testes | Passaram | Falharam |
|---|---|:-:|:-:|:-:|
| API – Carrinho | `api-carrinho.spec.ts` | 4 | 3 | 1 |
| API – Pedidos | `api-pedidos.spec.ts` | 2 | 2 | 0 |
| E2E – Interface do carrinho | `e2e-carrinho.spec.ts` | 14 ¹ | 12 | 2 |
| **Total** | | **20** | **17 (85%)** | **3 (15%)** |

¹ O CT-E2E-02 é parametrizado e roda 3 vezes (`bemvindo10`, `  BEMVINDO10  `, `BemVindo10`).

**Bloqueados:** 0

### Origem das 3 falhas

| Causa | Testes | Registro |
|---|---|---|
|  Frete cobrado com subtotal exato de R$ 200,00 | CT-E2E-07, CT-E2E-08 | [BUG-001](report-de-bugs.md) |
|  API aceita 6 unidades de um produto | CT-API-03 | [BUG-002](report-de-bugs.md) |

> Na primeira execução houve 5 falhas. CT-API-05 e CT-API-06 falhavam por erro nos scripts (ver [Correções nos scripts](#-correções-nos-scripts-de-teste)); após o ajuste, passam.

---|---|---|
|  **Defeito da aplicação** – frete cobrado com subtotal exato de R$ 200,00 | CT-E2E-07, CT-E2E-08 | [BUG-001](report-de-bugs.md) |
|  **Defeito da aplicação** – API aceita 6 unidades de um produto | CT-API-03 ² | [BUG-002](report-de-bugs.md) |
|  **Defeito do script de teste** – payload e leitura do erro incorretos | CT-API-05, CT-API-06 | Seção [Falhas nos scripts](#-falhas-causadas-pelos-scripts-de-teste) |

² O CT-API-03 também tem um problema no script (lê `body.codigo`, mas o erro vem em `body.erro.codigo`). Ver BUG-002.

---

##  Detalhamento dos Testes Executados

###  1. Cupons de desconto

| ID | CA | Cenário / Entrada | Resultado esperado | Status | Observações |
|---|---|---|---|:-:|---|
| **CT-E2E-01** | CA01, CA09 | Camiseta Essencial (R$ 59,90) + `BEMVINDO10` | Exibe "Desconto (BEMVINDO10)"; desconto de R$ 5,99 (10% do subtotal); frete intacto (R$ 19,90); total R$ 73,81 | ✅ PASS | |
| **CT-E2E-02** | CA02 | `bemvindo10`, `  BEMVINDO10  `, `BemVindo10` | Cupom reconhecido sem diferenciar caixa e espaços; desconto de R$ 5,99 | ✅ PASS (3/3) | |
| **CT-E2E-03** | CA03 | Cupom inexistente `CUPOM10` no carrinho | Mensagem "Cupom inválido."; desconto R$ 0,00; total R$ 79,80 | ✅ PASS | |
| **CT-API-01** | CA03 | `POST /api/carrinho/calcular` com `CUPOMINEXISTENTE` | `200 OK`; `desconto = 0`; `cupom.aplicado = false`; mensagem "Cupom inválido." | ✅ PASS | |
| **CT-API-05** | CA03.1 | `POST /api/pedidos` com `CUPOMINEXISTENTE` | `422` com código `CUPOM_INVALIDO` | ✅ PASS | Script corrigido (ver abaixo) |
| **CT-E2E-04** | CA04 | Cupom expirado `VERAO2026` no carrinho | Mensagem "Cupom expirado."; desconto R$ 0,00; total R$ 79,80 | ✅ PASS | |
| **CT-API-02** | CA04 | `POST /api/carrinho/calcular` com `VERAO2026` | `200 OK`; `desconto = 0`; `cupom.aplicado = false`; mensagem "Cupom expirado." | ✅ PASS | |
| **CT-API-06** | CA04.1 | `POST /api/pedidos` com `VERAO2026` | `422` com código `CUPOM_EXPIRADO` | ✅ PASS | Script corrigido (ver abaixo) |
| **CT-E2E-05** | CA05 | Aplica `BEMVINDO10`, remove, aplica `VERAO2026` | Com cupom ativo não há campo para um segundo cupom; após remover, só o novo é considerado | ✅ PASS | |
| **CT-E2E-06** | CA05 | Aplica `BEMVINDO10`, remove e reaplica | Desconto não acumula (R$ 5,99); total R$ 73,81 | ✅ PASS | |

###  2. Frete e valor limite (BVA)

| ID | CA | Cenário / Entrada | Resultado esperado | Status | Observações |
|---|---|---|---|:-:|---|
| **CT-E2E-10** | CA07 | Subtotal R$ 59,90 (< R$ 200) | Frete fixo R$ 19,90; "Faltam R$ 140,10 para o frete grátis." | ✅ PASS | |
| **CT-E2E-07** | CA06 | 2x Mochila Urbana 20L = **R$ 200,00 exatos** | Frete "Grátis"; total R$ 200,00 | ❌ FAIL | Frete exibido: **R$ 19,90**. Ver [BUG-001](report-de-bugs.md) |
| **CT-E2E-08** | CA06, CA08, CA09 | Subtotal R$ 200,00 + `BEMVINDO10` | Desconto R$ 20,00; frete "Grátis" (regra usa subtotal antes do desconto); total R$ 180,00 | ❌ FAIL | Desconto correto (R$ 20,00), mas frete **R$ 19,90**. Mesma causa do BUG-001 |
| **CT-E2E-09** | CA08 | Tênis + Kit de Meias = R$ 219,80 + `BEMVINDO10` | Desconto R$ 21,98; frete "Grátis" mesmo com total (R$ 197,82) abaixo de R$ 200; total R$ 197,82 | ✅ PASS | Confirma que o defeito está só no valor limite exato |

###  3. Quantidade e arredondamento

| ID | CA | Cenário / Entrada | Resultado esperado | Status | Observações |
|---|---|---|---|:-:|---|
| **CT-E2E-11** | CA10 | 5 unidades de Camiseta Essencial; tentar a 6ª | Botão "Adicionar" desabilitado com "Limite de 5 unidades atingido."; no carrinho, "Aumentar" desabilitado; subtotal R$ 299,50 | ✅ PASS | Limite respeitado **na interface** |
| **CT-API-03** | CA10.1 | `POST /api/carrinho/calcular` com `quantidade: 6` | `422` com código `QUANTIDADE_MAXIMA_EXCEDIDA` | ❌ FAIL | API retorna **`200 OK`** e calcula R$ 359,40. Ver [BUG-002](report-de-bugs.md) |
| **CT-API-04** | CA11 | P002 x1 + P004 x2 + `BEMVINDO10` | subtotal 239,70 · desconto 23,97 · frete 0,00 · total 215,73 | ✅ PASS | |
| **CT-E2E-12** | CA11 | Jaqueta + Kit de Meias (R$ 259,80) + `BEMVINDO10` | subtotal 259,80 · desconto 25,98 · frete Grátis · total 233,82; todos com 2 casas decimais | ✅ PASS | |

---

##  Correções nos scripts de teste

CT-API-05 e CT-API-06 falharam na primeira execução por erro nos scripts, não por defeito da aplicação:

1. O payload de `POST /api/pedidos` não enviava `cliente`; a API valida o cliente antes do cupom e respondia `422 DADOS_INVALIDOS`.
2. O código do erro era lido em `body.codigo`, mas a API devolve `body.erro.codigo`.

**Correção aplicada:** inclusão de `cliente: { nome, email, cep }` no payload e asserts em `body.erro.codigo` (também no CT-API-03).

---

##  Verificações exploratórias (fora da suíte automatizada)

| CA | Entrada | Resultado | Status |
|---|---|---|:-:|
| CA10.1 | `POST /api/carrinho/calcular` com `quantidade: 0` | `422` · `QUANTIDADE_INVALIDA` | ✅ PASS |
| CA10.1 | `POST /api/carrinho/calcular` com `quantidade: 1.5` | `422` · `QUANTIDADE_INVALIDA` | ✅ PASS |
| CA10.1 | `POST /api/carrinho/calcular` com `quantidade: 6` | `200 OK` (esperado `422`) | ❌ FAIL → BUG-002 |
| CA10.1 | `POST /api/pedidos` com `quantidade: 6` | `201 Created`, pedido `VZ-369815` criado (esperado `422`) | ❌ FAIL → BUG-002 |

---

##  Rastreabilidade (critério → testes)

| CA | Testes | Resultado |
|---|---|:-:|
| CA01 | CT-E2E-01 | ✅ |
| CA02 | CT-E2E-02 | ✅ |
| CA03 | CT-E2E-03, CT-API-01 | ✅ |
| CA03.1 | CT-API-05 | ✅ |
| CA04 | CT-E2E-04, CT-API-02 | ✅ |
| CA04.1 | CT-API-06 | ✅ |
| CA05 | CT-E2E-05, CT-E2E-06 | ✅ |
| CA06 | CT-E2E-07, CT-E2E-08 | ❌ BUG-001 |
| CA07 | CT-E2E-10 | ✅ |
| CA08 | CT-E2E-09 (✅), CT-E2E-08 (❌) | ❌ BUG-001 |
| CA09 | CT-E2E-01 (✅), CT-E2E-08 (❌) | ❌ BUG-001 |
| CA10 | CT-E2E-11 | ✅ (interface) |
| CA10.1 | CT-API-03 | ❌ BUG-002 |
| CA11 | CT-API-04, CT-E2E-12 | ✅ |

---

##  Evidências

Screenshots de todos os testes, respostas da API e relatório HTML: veja [evidencias.md](evidencias.md).

##  Como reproduzir

```bash
cd e2e
npx playwright test                                       # execução padrão
npx playwright test -c playwright.evidencias.config.ts    # com screenshots e trace de todos os testes
```

##  Conclusão

A entrega **não está apta para liberação**: há 2 defeitos abertos de regra de negócio (BUG-001, BUG-002). Os demais critérios (cupons, troca de cupom, frete abaixo e acima de R$ 200,00, limite na interface e arredondamento) estão conformes. 
