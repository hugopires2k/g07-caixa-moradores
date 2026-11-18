# Caixa da Associação de Moradores · Grupo G__

## Problema e usuário
A associação presta contas todo mês, mas as despesas ficam num caderno e os totais "não fecham" por centavos. O(a) tesoureiro(a) precisa registrar despesas e emitir totais exatos por categoria e período.

## Equipe
Hugo Pires (DEV) · Zaion (DEV) · Israel Soares (DADOS) · Isack Otavio (DADOS) · Alef Rafael (DADOS) · Pedro Lucas (NUVEM) · João Victor (QA)

## Requisitos
| Requisito | Status |
|---|---|
| RF1 Registrar despesa | ⬜ |
| RF2 Listar por período/categoria | ⬜ |
| RF3 Totais no banco, exatos ao centavo (regra central) | ⬜ |
| RF4 Marcar conferida (bloqueia edição/exclusão) | ⬜ |
| RF5 Editar despesa não conferida | ⬜ |
| GET /health | ⬜ |

## Arquitetura
Ver `docs/planejamento.md` (diagrama Mermaid, rotas e decisões).

## Modelo de dados
Ver `banco/schema.sql`.

## Como executar
```bash
cp .env.example .env        # preencher DATABASE_URL
psql "$DATABASE_URL" -f banco/schema.sql
psql "$DATABASE_URL" -f banco/seed.sql
npm install && npm start
```

## Casos de teste (E3)
| ID | Cenário | Esperado | Obtido |
|---|---|---|---|
| CA1 | Valor 0, −5, 12,345 | 400 | |
| CA2 | Data futura | 400 | |
| CA3 | 10,10 + 20,20 + 0,70 | total 31,00 | |
| CA4 | Período filtrado (limites inclusivos) | ignora fora das datas | |
| CA5 | Editar despesa conferida | 409 | |

## Dificuldade superada
_(preencher: problema, diagnóstico, causa, solução)_

## Limitações e próximos passos
_(preencher)_
