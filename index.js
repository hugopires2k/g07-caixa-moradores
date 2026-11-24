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
