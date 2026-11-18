CREATE TABLE IF NOT EXISTS despesas (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  descricao     VARCHAR(200)  NOT NULL,
  valor         DECIMAL(10,2) NOT NULL,
  categoria     VARCHAR(20)   NOT NULL,
  data_despesa  DATE          NOT NULL,
  conferida     BOOLEAN       NOT NULL DEFAULT FALSE,
  criada_em     TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_descricao CHECK (CHAR_LENGTH(TRIM(descricao)) >= 3),
  CONSTRAINT chk_valor     CHECK (valor > 0),
  CONSTRAINT chk_categoria CHECK (categoria IN ('manutencao','limpeza','eventos','administrativo','outros')),
  INDEX idx_despesas_data_cat (data_despesa, categoria)
);
