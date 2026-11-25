INSERT INTO despesas (descricao, valor, categoria, data_despesa) VALUES
 ('Troca de lâmpadas do salão (fictício)', 10.10, 'manutencao', CURDATE() - INTERVAL 5 DAY),
 ('Reparo do portão (fictício)',           20.20, 'manutencao', CURDATE() - INTERVAL 4 DAY),
 ('Peças de reposição (fictício)',          0.70, 'manutencao', CURDATE() - INTERVAL 3 DAY),
 ('Produtos de limpeza (fictício)',        45.90, 'limpeza',    CURDATE() - INTERVAL 2 DAY),
 ('Decoração da festa junina (fictício)',  80.00, 'eventos',    CURDATE() - INTERVAL 1 DAY);
