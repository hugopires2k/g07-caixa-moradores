-- Dados ficticios para testes do sistema Caixa da Associacao de Moradores

INSERT INTO despesas (
    descricao,
    valor,
    categoria,
    data_despesa,
    conferida
)
VALUES
    ('Compra de materiais de limpeza', 85.50, 'limpeza', '2026-11-02', FALSE),
    ('Reparo na iluminacao da associacao', 120.00, 'manutencao', '2026-11-05', TRUE),
    ('Compra de materiais para evento', 250.75, 'eventos', '2026-11-08', FALSE),
    ('Pagamento de material administrativo', 45.90, 'administrativo', '2026-11-10', TRUE),
    ('Manutencao de equipamentos', 180.00, 'manutencao', '2026-11-12', FALSE),
    ('Outras despesas da associacao', 30.00, 'outros', '2026-11-15', FALSE);