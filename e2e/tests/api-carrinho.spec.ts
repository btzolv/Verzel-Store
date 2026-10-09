import { test, expect } from '@playwright/test';

test.describe('API - /api/carrinho/calcular', () => {

  test('CT-API-01 - Cupom inexistente no cálculo (Status 200 OK + Mensagem) (CA03)', async ({ request }) => {
    const response = await request.post('/api/carrinho/calcular', {
      data: {
        itens: [{ produtoId: 'P005', quantidade: 1 }],
        cupom: 'CUPOMINEXISTENTE'
      }
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.desconto).toBe(0);
    expect(body.cupom.aplicado).toBe(false);
    expect(body.cupom.mensagem).toBe('Cupom inválido.');
  });

  test('CT-API-02 - Cupom expirado no cálculo (Status 200 OK + Mensagem) (CA04)', async ({ request }) => {
    const response = await request.post('/api/carrinho/calcular', {
      data: {
        itens: [{ produtoId: 'P005', quantidade: 1 }],
        cupom: 'VERAO2026'
      }
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.desconto).toBe(0);
    expect(body.cupom.aplicado).toBe(false);
    expect(body.cupom.mensagem).toBe('Cupom expirado.');
  });

  test('CT-API-03 - Rejeição de quantidade acima do limite de 5 unidades (CA10)', async ({ request }) => {
    const response = await request.post('/api/carrinho/calcular', {
      data: {
        itens: [{ produtoId: 'P001', quantidade: 6 }]
      }
    });

    expect(response.status()).toBe(422);
    const body = await response.json();
    expect(body.erro.codigo).toBe('QUANTIDADE_MAXIMA_EXCEDIDA');
  });

  test('CT-API-04 - Fórmula exata do cálculo e arredondamento a 2 casas decimais (CA11)', async ({ request }) => {
    const response = await request.post('/api/carrinho/calcular', {
      data: {
        itens: [
          { produtoId: 'P002', quantidade: 1 }, // R$ 139,90
          { produtoId: 'P004', quantidade: 2 }  // R$ 99,80
        ],
        cupom: 'BEMVINDO10'
      }
    });

    expect(response.status()).toBe(200);
    const body = await response.json();

    expect(body.subtotal).toBe(239.70);
    expect(body.desconto).toBe(23.97);
    expect(body.frete).toBe(0.00);
    expect(body.total).toBe(215.73);
  });

});