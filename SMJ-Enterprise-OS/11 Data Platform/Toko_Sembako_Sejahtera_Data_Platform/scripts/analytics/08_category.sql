-- 08_category.sql
-- Revenue and margin rolled up by ProductCategory.

SELECT
    pc.id                                  AS category_id,
    pc.text                                AS category_name,
    COUNT(DISTINCT p.id)                   AS num_products,
    SUM(ii.quantity)                       AS units_sold,
    SUM(ii.total)                          AS total_revenue,
    SUM(ii.price * ii.quantity) - SUM(ii.capital_price * ii.quantity) AS gross_margin
FROM product_category pc
LEFT JOIN product p ON p.category_id = pc.id
LEFT JOIN invoice_item ii ON ii.product_id = p.id
GROUP BY pc.id, pc.text
ORDER BY total_revenue DESC;
