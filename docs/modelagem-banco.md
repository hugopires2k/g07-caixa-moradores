# Modelagem do Banco de Dados — Caixa da Associação de Moradores

## 1. Banco de dados

O projeto utiliza PostgreSQL como sistema gerenciador de banco de dados, responsável por armazenar as despesas registradas pela associação.

## 2. Tabela despesas

A tabela `despesas` armazena as informações financeiras cadastradas no sistema.

| Campo | Tipo | Descrição |
|---|---|---|
| id | INTEGER | Identificador único, gerado automaticamente |
| descricao | VARCHAR(200) | Descrição da despesa |
| valor | NUMERIC(10,2) | Valor monetário da despesa |
| categoria | VARCHAR(20) | Categoria da despesa |
| data_despesa | DATE | Data em que ocorreu a despesa |
| conferida | BOOLEAN | Indica se a despesa foi conferida |
| criada_em | TIMESTAMPTZ | Data e horário de criação do registro, com informação de fuso horário |

## 3. Categorias permitidas

O sistema trabalha com cinco categorias:

- manutencao
- limpeza
- eventos
- administrativo
- outros

## 4. Regras de integridade

O banco de dados possui restrições para garantir a consistência dos registros:

- A descrição deve possuir pelo menos três caracteres, desconsiderando espaços nas extremidades.
- O valor da despesa deve ser maior que zero.
- A categoria deve pertencer à lista permitida.
- O identificador é gerado automaticamente.
- O campo `conferida` inicia como falso por padrão.

## 5. Precisão monetária

O campo `valor` utiliza o tipo `NUMERIC(10,2)`, evitando problemas de precisão comuns em tipos de ponto flutuante.

Os cálculos de totais são realizados no próprio PostgreSQL utilizando `SUM()` e agrupamentos com `GROUP BY`.

## 6. Consultas e dados de teste

Os scripts SQL estão organizados na pasta `banco`:

- `schema.sql`: criação da estrutura da tabela e índice.
- `seed.sql`: inserção de dados fictícios para testes.
- `queries.sql`: consultas de listagem, filtros e cálculos.

## 7. Índice

Foi criado um índice composto sobre `data_despesa` e `categoria`, com o objetivo de auxiliar consultas que utilizam esses campos como filtros.
