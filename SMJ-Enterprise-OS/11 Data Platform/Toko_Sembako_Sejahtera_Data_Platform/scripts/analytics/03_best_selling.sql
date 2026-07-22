-- 03_best_selling.sql
-- Best-selling products by quantity sold and by revenue generated.

SELECT
    p.id                    AS product_id,
    p.name                  AS product_name,
    pc.text                 AS category,
    SUM(ii.quantity)        AS total_quantity_sold,
    SUM(ii.total)           AS total_revenue,
    COUNT(DISTINCT ii.invoice_id) AS num_invoices_appeared_in
FROM invoice_item ii
JOIN product p ON p.id = ii.product_id
LEFT JOIN product_category pc ON pc.id = p.category_id
GROUP BY p.id, p.name, pc.text
ORDER BY total_quantity_sold DESC;
