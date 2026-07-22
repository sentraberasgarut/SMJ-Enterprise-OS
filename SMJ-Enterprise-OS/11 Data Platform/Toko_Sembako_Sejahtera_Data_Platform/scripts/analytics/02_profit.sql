-- 02_profit.sql
-- Gross profit by day (revenue minus cost basis), plus overall margin %.
-- Uses invoice.profit directly (recorded by the POS at sale time) rather
-- than recomputing from capital_sub_total, since profit is the field the
-- source system itself trusts as authoritative.

SELECT
    date(CAST(invoice_date AS INTEGER) / 1000, 'unixepoch') AS sale_date,
    SUM(grand_total)                                         AS total_revenue,
    SUM(profit)                                               AS total_profit,
    ROUND(100.0 * SUM(profit) / NULLIF(SUM(grand_total), 0), 2) AS margin_pct
FROM invoice
WHERE status = 'PAID'
GROUP BY sale_date
ORDER BY sale_date;
