# Sprint 1 · Persistência (28/10 até 20h05)
Colunas sugeridas no GitHub Projects: **Backlog · Em andamento · Revisão · Feito**

| # | Tarefa | Responsável | Papel |
|---|---|---|---|
| 1 | Criar repositório, .gitignore (com .env), .env.example e estrutura de pastas | Hugo Pires | DEV |
| 2 | Criar grupo de recursos `rg-cloud-gXX` com tags aula e grupo | Pedro Lucas | NUVEM |
| 3 | Criar Azure PostgreSQL Flexível (B1ms, acesso público, permitir serviços do Azure + IP) | Pedro Lucas | NUVEM |
| 4 | Criar App Service Linux F1 Node 20 | Pedro Lucas | NUVEM |
| 5 | Escrever `banco/schema.sql` com tipos e restrições | Israel Soares | DADOS |
| 6 | Escrever `banco/dados-iniciais.sql` (dados fictícios) | Isack Otavio | DADOS |
| 7 | Rodar schema no banco e validar restrições (inserir valor 0 e categoria inválida) | Isack Otavio | DADOS |
| 8 | Projeto Node + conexão `pg` via DATABASE_URL (SSL) | Hugo Pires | DEV |
| 9 | Rota GET /health com `iniciado_em` e 503 em falha | Zaion | DEV |
| 10 | POST /api/despesas e GET /api/despesas (consultas parametrizadas) | Zaion | DEV |
| 11 | Configurar DATABASE_URL no App Service e fazer 1º deploy | Pedro Lucas | NUVEM |
| 12 | Diagrama de arquitetura e planejamento no README | Alef Rafael | QA |
| 13 | Arquivo `requests.http` e plano de testes (CA1 a CA5) | João Victor | QA |
| 14 | Prova de persistência: GXX-PALAVRA (4 prints em `evidencias/`) | Israel + João Victor | DADOS/QA |
| 15 | Verificar o ponto de controle 2 do grupo vizinho da ilha | Alef Rafael | QA |

## Prova de persistência (19h55, palavra do dia)
1. Cadastrar `GXX-PALAVRA` pela aplicação · 2. Listar (Print 1) · 3. Anotar `iniciado_em` (Print 2) · 4. Reiniciar o App Service · 5. Conferir (Print 3) · 6. Consulta direta no banco (Print 4)

## Sprint 2 (preview)
Totais no SQL (RF3) · conferir/editar/excluir com 409 (RF4/RF5) · validações 400 · testes · README final · pitch de 90 s.
