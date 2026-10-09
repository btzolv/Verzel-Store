import { test, expect } from '@playwright/test';

const cliente = { nome: 'Maria Silva', email: 'maria.silva@teste.com', cep: '01310-100' };

test.describe('API - /api/pedidos', () => {

  test('CT-API-05 - Tentar finalizar pedido com cupom inexistente (Status 422) (CA03)', async ({ request }) => {
    const response = await request.post('/api/pedidos', {
      data: {
        cliente,
        itens: [{ produtoId: 'P005', quantidade: 1 }],
        cupom: 'CUPOMINEXISTENTE'
      }
    });

    expect(response.status()).toBe(422);
    const body = await response.json();
    expect(body.erro.codigo).toBe('CUPOM_INVALIDO');
  });

  test('CT-API-06 - Tentar finalizar pedido com cupom expirado (Status 422) (CA04)', async ({ request }) => {
    const response = await request.post('/api/pedidos', {
      data: {
        cliente,
        itens: [{ produtoId: 'P005', quantidade: 1 }],
        cupom: 'VERAO2026'
      }
    });

    expect(response.status()).toBe(422);
    const body = await response.json();
    expect(body.erro.codigo).toBe('CUPOM_EXPIRADO');
  });

});
