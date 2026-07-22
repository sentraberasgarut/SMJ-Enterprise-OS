-- 10_daily_sales.sql
-- Full daily operating summary: sales, profit, items sold, unique
-- customers, and expenses - one row per calendar day, for a daily
-- CEO-level view.

WITH daily_sales AS (
    SELECT
        date(CAST(invoice_date AS INTEGER) / 1000, 'unixepoch') AS d,
        COUNT(*)                    AS num_invoices,
        SUM(grand_total)            AS revenue,
        SUM(profit)                 AS profit,
        COUNT(DISTINCT customer_id) AS unique_customers
    FROM invoice
    WHERE status = 'PAID'
    GROUP BY d
),
daily_items AS (
    SELECT
        date(CAST(i.invoice_date AS INTEGER) / 1000, 'unixepoch') AS d,
        SUM(ii.quantity) AS items_sold
    FROM invoice i
    JOIN invoice_item ii ON ii.invoice_id = i.id
    WHERE i.status = 'PAID'
    GROUP BY d
),
daily_expenses AS (
    SELECT
        date(CAST(expense_date AS INTEGER) / 1000, 'unixepoch') AS d,
        SUM(price) AS total_expenses
    FROM expense e
    JOIN expense_item ei ON ei.expense_id = e.id
    GROUP BY d
)
SELECT
    ds.d                                  AS sale_date,
    ds.num_invoices,
    ds.revenue,
    ds.profit,
    di.items_sold,
    ds.unique_customers,
    COALESCE(de.total_expenses, 0)        AS expenses,
    ROUND(ds.profit - COALESCE(de.total_expenses, 0), 2) AS net_profit_after_expenses
FROM daily_sales ds
LEFT JOIN daily_items di ON di.d = ds.d
LEFT JOIN daily_expenses de ON de.d = ds.d
ORDER BY ds.d;
