require('dotenv').config({ quiet: true });
const express = require('express');
const { Pool } = require('pg');

const app = express();
app.use(express.json());

// Conexão com o banco. SSL só quando DATABASE_SSL=true (produção na nuvem).
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false
});

// 1. Health Check (liveness): não depende do banco, usado pelo Render e pelo CI
app.get('/health', (req, res) => {
  res.json({ status: 'ok', iniciado_em: new Date().toISOString() });
});

// 1b. Health Check do banco (readiness): testa a conexão com o Postgres
app.get('/health/db', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ status: 'ok', banco_conectado: true, servidor_tempo: result.rows[0].now });
  } catch (err) {
    res.status(503).json({ status: 'erro', banco_conectado: false, erro: err.message });
  }
});

// 2. Cadastrar Despesa (RF1)
app.post('/api/despesas', async (req, res) => {
  const { descricao, valor, categoria, data_despesa } = req.body;

  // Validação (CA1: valor 0, -5, 12,345 -> 400)
  if (valor === undefined || valor === null || !/^\d+(\.\d{1,2})?$/.test(String(valor)) || Number(valor) <= 0) {
    return res.status(400).json({ erro: 'O valor deve ser maior que zero e ter no máximo 2 casas decimais.' });
  }

  // Validação (CA2: data futura -> 400)
  if (data_despesa && new Date(data_despesa) > new Date()) {
    return res.status(400).json({ erro: 'A data da despesa não pode ser futura.' });
  }

  try {
    const query = `
      INSERT INTO despesas (descricao, valor, categoria, data_despesa) 
      VALUES ($1, $2, $3, $4) 
      RETURNING *;
    `;
    const values = [descricao, valor, categoria, data_despesa];
    const novo = await pool.query(query, values);
    res.status(201).json(novo.rows[0]);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// 4. Listar despesas com filtro por período e categoria (RF2)
app.get('/api/despesas', async (req, res) => {
  const { de, ate, categoria } = req.query;
  try {
    let query = 'SELECT * FROM despesas WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (de && ate) {
      query += ` AND data_despesa BETWEEN $${paramIndex} AND $${paramIndex + 1}`;
      params.push(de, ate);
      paramIndex += 2;
    }
    if (categoria) {
      query += ` AND categoria = $${paramIndex}`;
      params.push(categoria);
      paramIndex++;
    }

    query += ' ORDER BY data_despesa DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// 5. Marcar despesa como conferida (RF4)
app.patch('/api/despesas/:id/conferir', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'UPDATE despesas SET conferida = true WHERE id = $1 RETURNING *',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ erro: 'Despesa não encontrada.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// 6. Editar despesa não conferida (RF5 / CA5 -> Retorna 409 se estiver conferida)
app.put('/api/despesas/:id', async (req, res) => {
  const { id } = req.params;
  const { descricao, valor, categoria, data_despesa } = req.body;

  try {
    const check = await pool.query('SELECT conferida FROM despesas WHERE id = $1', [id]);
    if (check.rows.length === 0) {
      return res.status(404).json({ erro: 'Despesa não encontrada.' });
    }
    if (check.rows[0].conferida) {
      return res.status(409).json({ erro: 'Não é possível editar uma despesa já conferida.' });
    }

    const updateQuery = `
      UPDATE despesas 
      SET descricao = $1, valor = $2, categoria = $3, data_despesa = $4 
      WHERE id = $5 RETURNING *;
    `;
    const updated = await pool.query(updateQuery, [descricao, valor, categoria, data_despesa, id]);
    res.json(updated.rows[0]);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// 3. Totais por categoria e geral calculados no banco (Regra Central - RF3)
app.get('/api/totais', async (req, res) => {
  const { de, ate } = req.query;

  try {
    const porCategoriaQuery = `
      SELECT categoria, SUM(valor) as total_categoria 
      FROM despesas 
      WHERE data_despesa BETWEEN $1 AND $2 
      GROUP BY categoria;
    `;
    const geralQuery = `
      SELECT SUM(valor) as total_geral 
      FROM despesas 
      WHERE data_despesa BETWEEN $1 AND $2;
    `;

    const categoriasRes = await pool.query(porCategoriaQuery, [de, ate]);
    const geralRes = await pool.query(geralQuery, [de, ate]);

    res.json({
      periodo: { de, ate },
      por_categoria: categoriasRes.rows,
      total_geral: geralRes.rows[0].total_geral || 0
    });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

const PORT = process.env.PORT || 3000;
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
  });
}

module.exports = app;
module.exports.pool = pool;
