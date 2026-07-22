-- 04_customer.sql
-- Per-customer purchase behavior for registered customers, plus a
-- walk-in/anonymous summary row for context (since 59% of invoices have
-- no customer attached - see reports/data_quality_report.md).

SELECT
    COALESCE(c.name, '(Walk-in / No Customer Attached)') AS customer_name,
    c.id                                                  AS customer_id,
    c.loyalty_points,
    COUNT(i.id)                                           AS num_invoices,
    SUM(i.grand_total)                                    AS total_spent,
    ROUND(AVG(i.grand_total), 2)                          AS avg_invoice_value,
    MIN(date(CAST(i.invoice_date AS INTEGER) / 1000, 'unixepoch')) AS first_purchase,
    MAX(date(CAST(i.invoice_date AS INTEGER) / 1000, 'unixepoch')) AS last_purchase
FROM invoice i
LEFT JOIN customer c ON c.id = i.customer_id
WHERE i.status = 'PAID'
GROUP BY c.id, c.name, c.loyalty_points
ORDER BY total_spent DESC;
