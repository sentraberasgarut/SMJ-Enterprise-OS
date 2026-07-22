-- 05_supplier.sql
-- Supplier spend analysis: total purchase volume and payment status.

SELECT
    s.id                                AS supplier_id,
    s.name                              AS supplier_name,
    COUNT(DISTINCT prb.id)              AS num_restock_batches,
    SUM(prb.total_amount)               AS total_purchase_amount,
    SUM(prb.paid_amount)                AS total_paid,
    SUM(prb.total_amount) - SUM(prb.paid_amount) AS outstanding_balance,
    SUM(CASE WHEN prb.payment_status != 'PAID' THEN 1 ELSE 0 END) AS unpaid_batch_count
FROM supplier s
LEFT JOIN product_restock_batch prb ON prb.supplier_id = s.id
GROUP BY s.id, s.name
ORDER BY total_purchase_amount DESC;
