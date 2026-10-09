# 🐛 Relatório de Inconformidades (Bugs)

**Projeto:** Verzel Store – Entrega VZS-142 · **Versão:** 2.3.0 · **Data:** 09/10/2026
**Ambiente:** https://verzel-store.qa-test-verzel-store.workers.dev

| ID | Título | Severidade | CA | Testes que falham | Status |
|---|---|---|---|---|---|
| [BUG-001](#bug-001) | Frete cobrado com subtotal de exatamente R$ 200,00 | Alta | CA06, CA08, CA09 | CT-E2E-07, CT-E2E-08 | Aberto |
| [BUG-002](#bug-002) | API aceita mais de 5 unidades do mesmo produto | Alta | CA10, CA10.1 | CT-API-03 | Aberto |

---

## BUG-001
### Cobrança indevida de frete para subtotal de exatamente R$ 200,00

- **Severidade:** Alta · **Tipo:** Regra de negócio (valor limite)
- **Componente:** Frontend e API (`POST /api/carrinho/calcular`)
- **Critérios violados:** CA06 (frete grátis a partir de R$ 200,00, inclusive), CA08/CA09 (regra usa o subtotal antes do desconto)
- **Testes:** CT-E2E-07, CT-E2E-08

**Descrição:** com subtotal igual a R$ 200,00, a aplicação cobra o frete fixo de R$ 19,90. O valor faltante é calculado como R$ 0,00 ("Faltam R$ 0,00 para o frete grátis."), então a interface se contradiz. Com subtotal acima de R$ 200,00 (ex.: R$ 219,80) o frete é grátis corretamente, o que indica uso de `>` no lugar de `>=` na comparação.

**Passos para reproduzir**
1. Acessar a Verzel Store e adicionar 2 unidades da "Mochila Urbana 20L" (2 × R$ 100,00).
2. Abrir o carrinho e observar o resumo do pedido.
3. (Variação) Aplicar o cupom `BEMVINDO10`.

**Resultado obtido**

| Cenário | Subtotal | Desconto | Frete | Total |
|---|---|---|---|---|
| Sem cupom | R$ 200,00 | R$ 0,00 | **R$ 19,90** | **R$ 219,90** |
| Com `BEMVINDO10` | R$ 200,00 | - R$ 20,00 | **R$ 19,90** | **R$ 199,90** |

**Resultado esperado**

| Cenário | Subtotal | Desconto | Frete | Total |
|---|---|---|---|---|
| Sem cupom | R$ 200,00 | R$ 0,00 | **Grátis** | **R$ 200,00** |
| Com `BEMVINDO10` | R$ 200,00 | - R$ 20,00 | **Grátis** | **R$ 180,00** |

**Impacto:** o cliente é cobrado R$ 19,90 a mais do que o devido exatamente no valor limite da promoção.
**Evidência:** [evidencias.md](evidencias.md) (screenshots de CT-E2E-07 e CT-E2E-08).

---

## BUG-002
### API aceita mais de 5 unidades do mesmo produto (limite só é aplicado na interface)

- **Severidade:** Alta · **Tipo:** Validação / regra de negócio
- **Componente:** API (`POST /api/carrinho/calcular` e `POST /api/pedidos`)
- **Critérios violados:** CA10 e CA10.1 (quantidade acima de 5 deve retornar `422 QUANTIDADE_MAXIMA_EXCEDIDA`)
- **Teste:** CT-API-03

**Descrição:** o limite de 5 unidades é respeitado na interface (CT-E2E-11 passa), mas a API não o valida. Quantidades inválidas como `0` e `1.5` são rejeitadas corretamente com `QUANTIDADE_INVALIDA`; apenas o teto de 5 não é verificado. Como o pedido é criado normalmente, o limite pode ser contornado chamando a API diretamente.

**Passos para reproduzir**
1. Enviar `POST /api/carrinho/calcular`:
   ```json
   { "itens": [{ "produtoId": "P001", "quantidade": 6 }] }
   ```
2. Enviar `POST /api/pedidos` com a mesma lista de itens e um `cliente` válido (`nome`, `email`, `cep`).

**Resultado obtido**
- `/api/carrinho/calcular` → `200 OK`, com `quantidade: 6`, `subtotal: 359.4`, `frete: 0`.
- `/api/pedidos` → `201 Created`, pedido `VZ-369815` criado com 6 unidades.

**Resultado esperado:** `422 Unprocessable Entity` com `erro.codigo = "QUANTIDADE_MAXIMA_EXCEDIDA"` em ambos os endpoints.

**Impacto:** é possível fechar pedidos fora da regra de negócio, ignorando o limite por produto.

**Evidência:** [evidencias.md](evidencias.md) e `evidencias/api-respostas.txt`. O assert do CT-API-03 já foi corrigido para `body.erro.codigo`; o teste falha apenas por causa do bug.

---

## 📝 Observações (não são bugs)

CT-API-05 e CT-API-06 falharam na primeira execução por erro nos scripts (payload sem `cliente` e leitura de `body.codigo`). Os scripts foram corrigidos e passam. Detalhes no [relatório de execução](relatorio-de-execucao.md#-correções-nos-scripts-de-teste).
