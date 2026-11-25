# G07 · Caixa da Associação de Moradores

## 1. Problema e Usuário
A associação de moradores presta contas mensalmente em assembleia. Atualmente, as despesas são anotadas em um caderno e os totais somados na calculadora, o que gera inconsistências de centavos e falta de transparência nas prestações de contas.

**Usuário principal:** Tesoureiro(a) da associação, acessando a aplicação via computador ou navegador para registrar entradas de despesas, conferir lançamentos e emitir relatórios confiáveis por categoria e período.

---

## 2. Requisitos e Status de Implementação

| Código | Requisito / Critério | Status |
|---|---|---|
| **RF1** | Cadastrar despesa (descrição, valor $>0$ com 2 casas decimais, categoria e data não futura) | ✅ Implementado |
| **RF2** | Listar despesas por período (`de`/`ate`) e categoria | ✅ Implementado |
| **RF3** | Totais por categoria e total geral calculados via SQL de forma exata (Regra Central) | ✅ Implementado |
| **RF4** | Marcar despesa como conferida (despesa conferida não pode ser editada nem excluída) | ✅ Implementado |
| **RF5** | Editar descrição, valor e categoria de despesa não conferida | ✅ Implementado |
| **CA1** | Validação de valor inválido ou $> 2$ casas decimais $\rightarrow$ Retorna `400 Bad Request` | ✅ Implementado |
| **CA2** | Validação de data futura $\rightarrow$ Retorna `400 Bad Request` | ✅ Implementado |
| **CA3** | Soma exata de centavos via banco (ex: $10,10 + 20,20 + 0,70 = 31,00$) | ✅ Implementado |
| **CA4** | Total por período ignora datas fora do intervalo `de`/`ate` | ✅ Implementado |
| **CA5** | Tentativa de editar despesa conferida $\rightarrow$ Retorna `409 Conflict` | ✅ Implementado |

---

## 3. Arquitetura e Decisões Técnicas

```
┌─────────────────┐       HTTP (JSON)       ┌────────────────────────┐       SQL/TLS       ┌──────────────────────────────────────────┐
│  Cliente / REST │  ───────────────────>   │  Azure App Service     │  ─────────────────> │  Azure Database for PostgreSQL           │
│  (requests.http)│  <───────────────────   │  (Node.js + Express)   │  <───────────────── │  (Servidor Flexível - NUMERIC(10,2))     │
└─────────────────┘                         └────────────────────────┘                     └──────────────────────────────────────────┘
```

### Decisão Justificada: Tipo `NUMERIC(10,2)` no Banco vs. Cálculo na Aplicação
* **O que se ganha:** Utilizando o tipo `NUMERIC(10,2)` no PostgreSQL e realizando agregações diretamente no banco de dados com `SUM(valor)` e `GROUP BY`, garantimos **precisão decimal exata ao centavo**. Em representações padrão de ponto flutuante (`FLOAT` em linguagens de programação), operações simples como `0.1 + 0.2` resultam em `0.30000000000000004`, o que causaria divergência financeira na prestação de contas da associação.
* **O que se perde:** Exige consultas tratadas como string/numeric na comunicação do driver SQL para evitar coerções implícitas para `float` antes da renderização.

---

## 4. Modelo de Dados (`schema.sql`)

```sql
CREATE TABLE IF NOT EXISTS despesas (
    id SERIAL PRIMARY KEY,
    descricao VARCHAR(255) NOT NULL,
    valor NUMERIC(10,2) NOT NULL CHECK (valor > 0),
    categoria VARCHAR(50) NOT NULL CHECK (categoria IN ('manutencao', 'limpeza', 'eventos', 'administrativo', 'outros')),
    data_despesa DATE NOT NULL,
    conferida BOOLEAN NOT NULL DEFAULT false,
    criada_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## 5. Como Executar

### Variáveis de Ambiente (`.env`)
Copie o arquivo `.env.example` para `.env` e ajuste as credenciais:
```ini
PORT=3000
DATABASE_URL=postgres://usuario:senha@localhost:5432/caixa
DATABASE_SSL=false
```

### Passos para Rodar Localmente
1. Instale as dependências:
   ```bash
   npm install
   ```
2. Execute os scripts SQL no PostgreSQL local para criar o esquema e os dados iniciais:
   ```bash
   psql -U usuario -d caixa -f banco/schema.sql
   ```
3. Inicie a aplicação:
   ```bash
   npm start
   ```
4. A API estará disponível em `http://localhost:3000`. Testes de rotas podem ser executados via VS Code abrindo o arquivo `requests.http`.

---

## 6. Casos de Teste

| ID | Cenário | Entrada | Resultado Esperado | Resultado Obtido | Status |
|---|---|---|---|---|---|
| CT01 | Cadastro com valor 0 (Negativo) | `valor: 0` | HTTP `400 Bad Request` | HTTP `400 Bad Request` | PASS |
| CT02 | Cadastro com data futura (Negativo) | `data_despesa: "2099-01-01"` | HTTP `400 Bad Request` | HTTP `400 Bad Request` | PASS |
| CT03 | Tentativa de editar item conferido (Negativo) | `PUT /api/despesas/1` em registro `conferida = true` | HTTP `409 Conflict` | HTTP `409 Conflict` | PASS |
| CT04 | Cadastro e soma exata de centavos | $10.10 + 20.20 + 0.70$ no período | `total_geral: 31.00` | `total_geral: 31.00` | PASS |
| CT05 | Filtro por intervalo de datas | `de=2026-10-01&ate=2026-10-31` | Ignorar lançamentos de Novembro | Apenas registros de Outubro retornados | PASS |

---

## 7. Dificuldade Superada
* **Problema:** Erro de conversão de tipos ao somar valores decimais e formatação de datas em timezone UTC retornado pelo App Service Linux na Azure.
* **Diagnóstico:** O servidor Node.js interpretava os retornos do PostgreSQL como strings numéricas, e a conversão direta para Number no JavaScript poderia resultar em inconsistência de ponto flutuante. Além disso, datas sem especificação de timezone sofriam desvio de 3 horas em relação ao fuso de Brasília (UTC-3).
* **Solução:** Mantivemos o cálculo de soma agregada (`SUM(valor)`) inteiramente sob responsabilidade do PostgreSQL via SQL e passamos a enviar e salvar as datas utilizando tipos explícitos `DATE` e consultas parametrizadas na API.

---

## 8. Limitações Conhecidas e Próximos Passos
* **Limitações:** A API atualmente não possui camada de autenticação/login por usuário para distinguir papeis de tesoureiro e administrador.
* **Próximos Passos:** Implementar autenticação via tokens JWT e anexar comprovantes de despesas (upload de imagens e PDFs) utilizando o Azure Blob Storage.

---

## 9. Evidências e Pitch
* **Pasta de Evidências:** Os prints obrigatórios da infraestrutura, persistência (`G07-PALAVRA`), variáveis de ambiente e testes estão salvos na pasta `/evidencias`.
* **Pitch de 90 Segundos:** [Link para o Vídeo da Apresentação no YouTube / Drive](https://youtube.com)