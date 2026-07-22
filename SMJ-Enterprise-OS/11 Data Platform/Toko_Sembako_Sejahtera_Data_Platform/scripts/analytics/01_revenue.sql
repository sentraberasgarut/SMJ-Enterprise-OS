-- 01_revenue.sql
-- Total revenue (grand_total) by day, plus running overall total.
-- Uses invoice.status to exclude anything not actually completed, if such
-- statuses exist in future data (currently all observed rows are PAID).

SELECT
    date(CAST(invoice_date AS INTEGER) / 1000, 'unixepoch') AS sale_date,
    COUNT(*)                                                 AS num_invoices,
    SUM(grand_total)                                         AS total_revenue,
    ROUND(AVG(grand_total), 2)                               AS avg_invoice_value
FROM invoice
WHERE status = 'PAID'
GROUP BY sale_date
ORDER BY sale_date;
