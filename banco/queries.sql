-- 1. Listar despesas por periodo
SELECT *
FROM despesas
WHERE data_despesa BETWEEN $1 AND $2
ORDER BY data_despesa DESC;


-- 2. Listar despesas por periodo e categoria
SELECT *
FROM despesas
WHERE data_despesa BETWEEN $1 AND $2
  AND categoria = $3
ORDER BY data_despesa DESC;


-- 3. Calcular totais por categoria
SELECT
    categoria,
    SUM(valor) AS total_categoria
FROM despesas
WHERE data_despesa BETWEEN $1 AND $2
GROUP BY categoria
ORDER BY categoria;


-- 4. Calcular o total geral do periodo
SELECT
    COALESCE(SUM(valor), 0) AS total_geral
FROM despesas
WHERE data_despesa BETWEEN $1 AND $2;


-- 5. Consultar despesas ainda nao conferidas
SELECT *
FROM despesas
WHERE conferida = FALSE
ORDER BY data_despesa DESC;


-- 6. Consultar despesas ja conferidas
SELECT *
FROM despesas
WHERE conferida = TRUE
ORDER BY data_despesa DESC;