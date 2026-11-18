const express = require('express');
const { Pool } = require('pg');

const app = express();
app.use(express.json());

// Conexão com o banco (usa a variável de ambiente DATABASE_URL da Azure ou local)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

// 1. Rota de Health Check (Testa a conexão com o banco)
app.get('/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({
      status: 'OK',
      iniciado_em: new Date().toISOString(),
      banco_conectado: true,
      servidor_tempo: result.rows[0].now
    });
  } catch (err) {
    res.status(503).json({ status: 'ERRO', erro: err.message });
  }
});

// 2. Cadastrar Despesa (RF1)
app.post('/api/despesas', async (req, res) => {
  const { descricao, valor, categoria, data_despesa } = req.body;

  // Validação simples (CA1 e CA2)
  if (!valor || valor <= 0) {
    return res.status(400).json({ erro: 'O valor deve ser maior que zero.' });
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
    // Totais agrupados por categoria
    const porCategoriaQuery = `
      SELECT categoria, SUM(valor) as total_categoria 
      FROM despesas 
      WHERE data_despesa BETWEEN $1 AND $2 
      GROUP BY categoria;
    `;
    
    // Total geral do período
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
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});