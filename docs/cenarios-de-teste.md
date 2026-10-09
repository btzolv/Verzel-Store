CA01
  Cenário: Aplicar cupom de desconto de 10% válido com sucesso no carrinho
  Dado que o cliente adicionou o produto ao carrinho
  Quando o cliente insere o cupom BEMVINDO10 e aplica
  Então deve exibir a mensagem "Desconto (BEMVINDO10)" e o valor do desconto
  E o desconto deve ser de 10%
  E o desconto deve ser aplicado sobre o subtotal, sem contar com o frete

CA02
  Cenário: Código não diferencia maiúsculas, minúsculas e espaço
  Dado que o cliente possui produtos no carrinho
  Quando o cliente insere o cupom BEMVINDO10 com letra maiúscula, minúscula ou espaços no início e/ou no fim
  Então o sistema deve reconhecer e aplicar o cupom "BEMVINDO10" com sucesso
  E conceder o desconto de 10% sobre o subtotal

CA03
  Cenário: Inserir cupom inválido
  Dado que o cliente possui produtos no carrinho
  Quando o cliente aplica um cupom inexistente (ex.: CUPOM10)
  Então o cálculo do carrinho deve retornar Status 200 OK
  E não deve ser aplicado nenhum desconto
  E o objeto cupom deve conter "aplicado" como "false"
  E a mensagem exibida deve ser "Cupom inválido."

CA03.1
  Cenário: Finalizar pedido com cupom inexistente na API
  Dado que o cliente tenta criar um pedido com o cupom "CUPOMINEXISTENTE"
  Quando a requisição é enviada
  Então a API deve retornar Status 422
  E o código do erro deve ser "CUPOM_INVALIDO"

CA04
  Cenário: Inserir cupom expirado no cálculo do carrinho
  Dado que o cliente possui produtos no carrinho
  Quando o cliente aplica um cupom fora da validade (ex.: "VERAO2026")
  Então o cálculo do carrinho deve retornar Status 200 OK
  E não deve ser aplicado nenhum desconto
  E o objeto cupom deve conter "aplicado" como "false"
  E a mensagem exibida deve ser "Cupom expirado."

CA04.1
  Cenário: Finalizar pedido com cupom expirado na API
  Dado que o cliente tenta criar um pedido com o cupom "VERAO2026"
  Quando a requisição é enviada
  Então a API deve retornar Status 422
  E o código do erro deve ser "CUPOM_EXPIRADO"


CA05
  Cenário: Troca de cupom
  Dado que o cliente já possui o cupom "BEMVINDO10" aplicado ao carrinho
  Quando o cliente remove o cupom atual
  E aplica um novo cupom válido
  Então apenas o desconto do novo cupom deve ser considerado no total do pedido

CA06, CA08, CA09
  Cenário: Frete grátis a partir de R$200,00
  Dado que o subtotal dos produtos no carrinho soma R$ 200,00
  E o cliente inseriu o cupom BEMVINDO10
  Quando os valores são recalculados e mesmo que fiquem abaixo de R$200,00 após inserir o cupom
  Então o frete deve ser de R$0,00
  E deve aparecer a mensagem "Frete grátis"
  E a regra de frete deve ter considerado o subtotal ANTES do desconto do cupom

CA07
  Cenário: Frete para compras abaixo de R$200,00
  Dado que o subtotal dos produtos no carrinho é inferior a R$ 200,00
  Quando o cliente vai finalizar a compra
  Então o frete deve ser fixo no valor de R$ 19,90
  E deve aparecer a mensagem de qual valor falta para o frete grátis

CA10
  Cenário: Adicionar quantidade máxima permitida de um produto
  Dado que o cliente adiciona 5 unidades de um produto ao carrinho
  Quando tenta adicionar mais um item do mesmo produto
  Então não deve ser possível adicionar

CA10.1
  Cenário: Tentar adicionar quantidade diferente da permitida
  Dado que o cliente informa a quantidade para o produto maior que 5 ou que não é um número inteiro maior ou igual a 1
  Quando envia a requisição para a API
  Então a API deve retornar Status 422 (QUANTIDADE_INVALIDA ou QUANTIDADE_MAXIMA_EXCEDIDA)



CA11
  Cenário: Todos os valores são arredondados para duas casas decimais
  Dado que o carrinho possui itens, adiciona o cupom de 10% e possui frete grátis, por exemplo
  Quando a API calcula a resposta
  Então todos os valores devem ser arredondados para 2 casas decimais