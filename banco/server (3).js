require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');

const app = express();
app.use(express.json());

// Conexão via DATABASE_URL (fora do código). decimalNumbers=false: DECIMAL volta como texto.
const pool = mysql.createPool({
  uri: process.env.DATABASE_URL,
  decimalNumbers: false,
  dateStrings: true,
  timezone: 'Z'
});

const iniciadoEm = new Date().toISOString();
const CATEGORIAS = ['manutencao', 'limpeza', 'eventos', 'administrativo', 'outros'];

// "hoje" = data de Brasília (America/Recife, sem horário de verão)
function hojeBrasilia() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Recife' }).format(new Date());
}
const reData = /^\d{4}-\d{2}-\d{2}$/;
function dataValida(s) {
  if (typeof s !== 'string' || !reData.test(s)) return false;
  const d = new Date(s + 'T00:00:00Z');
  return !isNaN(d) && d.toISOString().slice(0, 10) === s;
}
// valor: ponto decimal, até 2 casas, > 0 (validado como texto, sem float)
function valorValido(v) {
  const s = typeof v === 'number' ? String(v) : v;
  if (typeof s !== 'string' || !/^\d{1,8}(\.\d{1,2})?$/.test(s)) return null;
  if (Number(s) <= 0) return null;
  return s;
}
const erro = (res, code, msg) => res.status(code).json({ erro: msg });

function validarCorpo(b, { exigirData }) {
  const desc = typeof b.descricao === 'string' ? b.descricao.trim() : '';
  if (desc.length < 3 || desc.length > 200) return { e: 'Descrição deve ter de 3 a 200 caracteres.' };
  const valor = valorValido(b.valor);
  if (!valor) return { e: 'Valor deve ser maior que 0, com ponto decimal e até 2 casas (ex.: 12.50).' };
  if (!CATEGORIAS.includes(b.categoria)) return { e: 'Categoria inválida. Use: ' + CATEGORIAS.join(', ') + '.' };
  if (exigirData) {
    if (!dataValida(b.data_despesa)) return { e: 'Data inválida. Use o formato AAAA-MM-DD.' };
    if (b.data_despesa > hojeBrasilia()) return { e: 'A data da despesa não pode ser futura.' };
  }
  return { desc, valor };
}

// GET /health
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', banco: 'ok', iniciado_em: iniciadoEm });
  } catch (e) {
    console.error('health:', e.message);
    res.status(503).json({ status: 'erro', erro: 'Banco de dados indisponível.' });
  }
});

// POST /api/despesas (RF1)
app.post('/api/despesas', async (req, res) => {
  const v = validarCorpo(req.body || {}, { exigirData: true });
  if (v.e) return erro(res, 400, v.e);
  try {
    const [r] = await pool.query(
      'INSERT INTO despesas (descricao, valor, categoria, data_despesa) VALUES (?, ?, ?, ?)',
      [v.desc, v.valor, req.body.categoria, req.body.data_despesa]
    );
    const [rows] = await pool.query('SELECT * FROM despesas WHERE id = ?', [r.insertId]);
    res.status(201).json(rows[0]);
  } catch (e) {
    console.error(e.message);
    erro(res, 503, 'Erro ao acessar o banco de dados.');
  }
});

// GET /api/despesas?de&ate&categoria (RF2)
app.get('/api/despesas', async (req, res) => {
  const { de, ate, categoria } = req.query;
  const where = [], params = [];
  if (de !== undefined) { if (!dataValida(de)) return erro(res, 400, 'Parâmetro "de" inválido (AAAA-MM-DD).'); where.push('data_despesa >= ?'); params.push(de); }
  if (ate !== undefined) { if (!dataValida(ate)) return erro(res, 400, 'Parâmetro "ate" inválido (AAAA-MM-DD).'); where.push('data_despesa <= ?'); params.push(ate); }
  if (categoria !== undefined) { if (!CATEGORIAS.includes(categoria)) return erro(res, 400, 'Categoria inválida.'); where.push('categoria = ?'); params.push(categoria); }
  try {
    const [rows] = await pool.query(
      'SELECT * FROM despesas' + (where.length ? ' WHERE ' + where.join(' AND ') : '') + ' ORDER BY data_despesa DESC, id DESC',
      params
    );
    res.json(rows);
  } catch (e) {
    console.error(e.message);
    erro(res, 503, 'Erro ao acessar o banco de dados.');
  }
});

// GET /api/totais?de&ate (RF3, regra central: SUM + GROUP BY no banco)
app.get('/api/totais', async (req, res) => {
  const { de, ate } = req.query;
  const where = [], params = [];
  if (de !== undefined) { if (!dataValida(de)) return erro(res, 400, 'Parâmetro "de" inválido (AAAA-MM-DD).'); where.push('data_despesa >= ?'); params.push(de); }
  if (ate !== undefined) { if (!dataValida(ate)) return erro(res, 400, 'Parâmetro "ate" inválido (AAAA-MM-DD).'); where.push('data_despesa <= ?'); params.push(ate); }
  const w = where.length ? ' WHERE ' + where.join(' AND ') : '';
  try {
    const [porCat] = await pool.query(
      'SELECT categoria, CAST(SUM(valor) AS CHAR) AS total, COUNT(*) AS quantidade FROM despesas' + w + ' GROUP BY categoria ORDER BY categoria',
      params
    );
    const [geral] = await pool.query(
      'SELECT CAST(COALESCE(SUM(valor), 0) AS CHAR) AS total FROM despesas' + w,
      params
    );
    res.json({ de: de || null, ate: ate || null, por_categoria: porCat, total_geral: geral[0].total });
  } catch (e) {
    console.error(e.message);
    erro(res, 503, 'Erro ao acessar o banco de dados.');
  }
});

function idValido(s) { return /^\d+$/.test(s) ? Number(s) : null; }

// PATCH /api/despesas/:id/conferir (RF4)
app.patch('/api/despesas/:id/conferir', async (req, res) => {
  const id = idValido(req.params.id);
  if (!id) return erro(res, 400, 'Id inválido.');
  try {
    const [r] = await pool.query('UPDATE despesas SET conferida = TRUE WHERE id = ? AND conferida = FALSE', [id]);
    if (r.affectedRows === 0) {
      const [rows] = await pool.query('SELECT id FROM despesas WHERE id = ?', [id]);
      return rows.length ? erro(res, 409, 'Despesa já está conferida.') : erro(res, 404, 'Despesa não encontrada.');
    }
    const [rows] = await pool.query('SELECT * FROM despesas WHERE id = ?', [id]);
    res.json(rows[0]);
  } catch (e) {
    console.error(e.message);
    erro(res, 503, 'Erro ao acessar o banco de dados.');
  }
});

// PUT /api/despesas/:id (RF5)
app.put('/api/despesas/:id', async (req, res) => {
  const id = idValido(req.params.id);
  if (!id) return erro(res, 400, 'Id inválido.');
  const v = validarCorpo(req.body || {}, { exigirData: false });
  if (v.e) return erro(res, 400, v.e);
  try {
    const [r] = await pool.query(
      'UPDATE despesas SET descricao = ?, valor = ?, categoria = ? WHERE id = ? AND conferida = FALSE',
      [v.desc, v.valor, req.body.categoria, id]
    );
    if (r.affectedRows === 0) {
      const [rows] = await pool.query('SELECT id FROM despesas WHERE id = ?', [id]);
      return rows.length ? erro(res, 409, 'Despesa conferida não pode ser editada.') : erro(res, 404, 'Despesa não encontrada.');
    }
    const [rows] = await pool.query('SELECT * FROM despesas WHERE id = ?', [id]);
    res.json(rows[0]);
  } catch (e) {
    console.error(e.message);
    erro(res, 503, 'Erro ao acessar o banco de dados.');
  }
});

// DELETE /api/despesas/:id (RF4)
app.delete('/api/despesas/:id', async (req, res) => {
  const id = idValido(req.params.id);
  if (!id) return erro(res, 400, 'Id inválido.');
  try {
    const [r] = await pool.query('DELETE FROM despesas WHERE id = ? AND conferida = FALSE', [id]);
    if (r.affectedRows === 0) {
      const [rows] = await pool.query('SELECT id FROM despesas WHERE id = ?', [id]);
      return rows.length ? erro(res, 409, 'Despesa conferida não pode ser excluída.') : erro(res, 404, 'Despesa não encontrada.');
    }
    res.status(204).end();
  } catch (e) {
    console.error(e.message);
    erro(res, 503, 'Erro ao acessar o banco de dados.');
  }
});

// JSON inválido e rotas inexistentes, sem detalhes internos
app.use((err, req, res, next) => erro(res, 400, 'Corpo da requisição inválido.'));
app.use((req, res) => erro(res, 404, 'Rota não encontrada.'));

const port = process.env.PORT || 3000;
app.listen(port, () => console.log('Servidor na porta ' + port));
