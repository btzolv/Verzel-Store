import { test, expect, Page } from '@playwright/test';

async function adicionarAoCarrinho(page: Page, itens: Array<[produto: string, quantidade: number]>) {
  await page.goto('/');
  let total = 0;
  for (const [produto, quantidade] of itens) {
    const card = page.getByRole('article', { name: produto });
    for (let i = 0; i < quantidade; i++) {
      await card.getByRole('button', { name: 'Adicionar ao carrinho' }).click();
      total++;
      await expect(page.locator('.contador-carrinho')).toHaveText(String(total));
    }
  }
}

async function abrirCarrinho(page: Page) {
  await page.getByRole('link', { name: /^Carrinho/ }).click();
  await expect(page.getByRole('heading', { name: 'Carrinho', level: 1 })).toBeVisible();
  await expect(page.getByRole('listitem').first()).toBeVisible();
}

async function aplicarCupom(page: Page, codigo: string) {
  await page.getByRole('textbox', { name: 'Cupom de desconto' }).fill(codigo);
  await page.getByRole('button', { name: 'Aplicar cupom' }).click();
}

const valor = (page: Page, campo: 'subtotal' | 'desconto' | 'frete' | 'total') =>
  page.locator(`[data-valor="${campo}"]`);

test.describe('E2E - Interface do Carrinho', () => {

  test('CT-E2E-01 - Aplicar cupom BEMVINDO10: 10% sobre o subtotal, sem incidir no frete (CA01, CA09)', async ({ page }) => {
    await adicionarAoCarrinho(page, [['Camiseta Essencial', 1]]);
    await abrirCarrinho(page);
    await aplicarCupom(page, 'BEMVINDO10');

    await expect(page.getByText('Desconto (BEMVINDO10)')).toBeVisible();
    await expect(valor(page, 'subtotal')).toHaveText('R$ 59,90');
    await expect(valor(page, 'desconto')).toHaveText('- R$ 5,99');
    await expect(valor(page, 'frete')).toHaveText('R$ 19,90');
    await expect(valor(page, 'total')).toHaveText('R$ 73,81');
  });

  for (const codigo of ['bemvindo10', '  BEMVINDO10  ', 'BemVindo10']) {
    test(`CT-E2E-02 - Cupom reconhecido independente de caixa e espaços: "${codigo}" (CA02)`, async ({ page }) => {
      await adicionarAoCarrinho(page, [['Camiseta Essencial', 1]]);
      await abrirCarrinho(page);
      await aplicarCupom(page, codigo);

      await expect(page.getByText('Desconto (BEMVINDO10)')).toBeVisible();
      await expect(valor(page, 'desconto')).toHaveText('- R$ 5,99');
    });
  }

  test('CT-E2E-03 - Cupom inexistente: mensagem "Cupom inválido." e nenhum desconto (CA03)', async ({ page }) => {
    await adicionarAoCarrinho(page, [['Camiseta Essencial', 1]]);
    await abrirCarrinho(page);
    await aplicarCupom(page, 'CUPOM10');

    await expect(page.getByText('Cupom inválido.')).toBeVisible();
    await expect(valor(page, 'desconto')).toHaveText('R$ 0,00');
    await expect(valor(page, 'total')).toHaveText('R$ 79,80');
  });

  test('CT-E2E-04 - Cupom expirado: mensagem "Cupom expirado." e nenhum desconto (CA04)', async ({ page }) => {
    await adicionarAoCarrinho(page, [['Camiseta Essencial', 1]]);
    await abrirCarrinho(page);
    await aplicarCupom(page, 'VERAO2026');

    await expect(page.getByText('Cupom expirado.')).toBeVisible();
    await expect(valor(page, 'desconto')).toHaveText('R$ 0,00');
    await expect(valor(page, 'total')).toHaveText('R$ 79,80');
  });

  test('CT-E2E-05 - Troca de cupom: remover o atual e aplicar outro, só o novo é considerado (CA05)', async ({ page }) => {
    await adicionarAoCarrinho(page, [['Camiseta Essencial', 1]]);
    await abrirCarrinho(page);
    await aplicarCupom(page, 'BEMVINDO10');
    await expect(valor(page, 'desconto')).toHaveText('- R$ 5,99');

    await expect(page.getByRole('textbox', { name: 'Cupom de desconto' })).toHaveCount(0);
    await page.getByRole('button', { name: 'Remover cupom' }).click();
    await expect(valor(page, 'desconto')).toHaveText('R$ 0,00');

    await aplicarCupom(page, 'VERAO2026');
    await expect(page.getByText('Cupom expirado.')).toBeVisible();
    await expect(valor(page, 'desconto')).toHaveText('R$ 0,00');
    await expect(valor(page, 'total')).toHaveText('R$ 79,80');
  });

  test('CT-E2E-06 - Reaplicar cupom válido após remover não acumula desconto (CA05)', async ({ page }) => {
    await adicionarAoCarrinho(page, [['Camiseta Essencial', 1]]);
    await abrirCarrinho(page);
    await aplicarCupom(page, 'BEMVINDO10');
    await page.getByRole('button', { name: 'Remover cupom' }).click();
    await aplicarCupom(page, 'BEMVINDO10');

    await expect(valor(page, 'desconto')).toHaveText('- R$ 5,99');
    await expect(valor(page, 'total')).toHaveText('R$ 73,81');
  });

  test('CT-E2E-07 - Frete grátis com subtotal de exatamente R$ 200,00 (CA06 / BUG-001)', async ({ page }) => {
    await adicionarAoCarrinho(page, [['Mochila Urbana 20L', 2]]);
    await abrirCarrinho(page);

    await expect(valor(page, 'subtotal')).toHaveText('R$ 200,00');
    await expect(valor(page, 'frete')).toHaveText('Grátis');
    await expect(valor(page, 'total')).toHaveText('R$ 200,00');
  });

  test('CT-E2E-08 - Frete grátis considera o subtotal antes do desconto do cupom (CA06, CA08, CA09 / BUG-001)', async ({ page }) => {
    await adicionarAoCarrinho(page, [['Mochila Urbana 20L', 2]]);
    await abrirCarrinho(page);
    await aplicarCupom(page, 'BEMVINDO10');

    await expect(valor(page, 'desconto')).toHaveText('- R$ 20,00');
    await expect(valor(page, 'frete')).toHaveText('Grátis');
    await expect(valor(page, 'total')).toHaveText('R$ 180,00');
  });

  test('CT-E2E-09 - Frete grátis mantido com cupom quando o subtotal é maior que R$ 200,00 (CA08)', async ({ page }) => {
    await adicionarAoCarrinho(page, [['Tênis Casual Urbano', 1], ['Kit 3 Pares de Meias', 1]]);
    await abrirCarrinho(page);
    await aplicarCupom(page, 'BEMVINDO10');

    await expect(valor(page, 'desconto')).toHaveText('- R$ 21,98');
    await expect(valor(page, 'frete')).toHaveText('Grátis');
    await expect(valor(page, 'total')).toHaveText('R$ 197,82');
  });

  test('CT-E2E-10 - Frete fixo de R$ 19,90 abaixo de R$ 200,00 e valor faltante informado (CA07)', async ({ page }) => {
    await adicionarAoCarrinho(page, [['Camiseta Essencial', 1]]);
    await abrirCarrinho(page);

    await expect(valor(page, 'frete')).toHaveText('R$ 19,90');
    await expect(page.getByText('Faltam R$ 140,10 para o frete grátis.')).toBeVisible();
  });

  test('CT-E2E-11 - Limite de 5 unidades por produto: sexta unidade não pode ser adicionada (CA10)', async ({ page }) => {
    await adicionarAoCarrinho(page, [['Camiseta Essencial', 5]]);

    const card = page.getByRole('article', { name: 'Camiseta Essencial' });
    await expect(card.getByText('Limite de 5 unidades atingido.')).toBeVisible();
    await expect(card.getByRole('button', { name: 'Adicionar ao carrinho' })).toBeDisabled();

    await abrirCarrinho(page);
    await expect(page.getByRole('status', { name: 'Quantidade de Camiseta Essencial' })).toHaveText('5');
    await expect(page.getByText('Limite de 5 unidades por produto.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Aumentar quantidade de Camiseta Essencial' })).toBeDisabled();
    await expect(valor(page, 'subtotal')).toHaveText('R$ 299,50');
  });

  test('CT-E2E-12 - Valores monetários com 2 casas decimais com cupom e frete grátis (CA11)', async ({ page }) => {
    await adicionarAoCarrinho(page, [['Jaqueta Corta-Vento', 1], ['Kit 3 Pares de Meias', 1]]);
    await abrirCarrinho(page);
    await aplicarCupom(page, 'BEMVINDO10');

    await expect(valor(page, 'subtotal')).toHaveText('R$ 259,80');
    await expect(valor(page, 'desconto')).toHaveText('- R$ 25,98');
    await expect(valor(page, 'frete')).toHaveText('Grátis');
    await expect(valor(page, 'total')).toHaveText('R$ 233,82');

    for (const campo of ['subtotal', 'desconto', 'total'] as const) {
      await expect(valor(page, campo)).toHaveText(/^(- )?R\$ \d+,\d{2}$/);
    }
  });

});
