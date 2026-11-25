
CREATE TABLE IF NOT EXISTS despesas (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    descricao VARCHAR(200) NOT NULL,
    valor NUMERIC(10,2) NOT NULL,
    categoria VARCHAR(20) NOT NULL,
    data_despesa DATE NOT NULL,
    conferida BOOLEAN NOT NULL DEFAULT FALSE,
    criada_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_descricao
        CHECK (CHAR_LENGTH(TRIM(descricao)) >= 3),

    CONSTRAINT chk_valor
        CHECK (valor > 0),

    CONSTRAINT chk_categoria
        CHECK (
            categoria IN (
                'manutencao',
                'limpeza',
                'eventos',
                'administrativo',
                'outros'
            )
        )
);

CREATE INDEX IF NOT EXISTS idx_despesas_data_cat
ON despesas (data_despesa, categoria);
