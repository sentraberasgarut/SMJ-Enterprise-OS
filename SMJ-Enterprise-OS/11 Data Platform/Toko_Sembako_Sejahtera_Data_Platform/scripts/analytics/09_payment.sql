-- 09_payment.sql
-- Payment method mix across sales (Invoice) - cash vs digital breakdown.

SELECT
    pm.id                       AS payment_method_id,
    pm.name                     AS payment_method_name,
    COUNT(i.id)                 AS num_invoices,
    SUM(i.grand_total)          AS total_amount,
    ROUND(100.0 * COUNT(i.id) / (SELECT COUNT(*) FROM invoice WHERE status = 'PAID'), 2) AS pct_of_invoices,
    ROUND(100.0 * SUM(i.grand_total) / (SELECT SUM(grand_total) FROM invoice WHERE status = 'PAID'), 2) AS pct_of_revenue
FROM invoice i
JOIN payment_method pm ON pm.id = i.payment_method_id
WHERE i.status = 'PAID'
GROUP BY pm.id, pm.name
ORDER BY total_amount DESC;
