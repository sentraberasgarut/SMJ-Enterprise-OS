-- 06_stock.sql
-- Current stock position per product, with stock-alert flag and
-- inventory value at cost.

SELECT
    p.id                                        AS product_id,
    p.name                                      AS product_name,
    pc.text                                     AS category,
    p.stock                                     AS current_stock,
    p.stock_alert                               AS stock_alert_threshold,
    CASE WHEN p.stock_alert IS NOT NULL AND p.stock <= p.stock_alert
         THEN 1 ELSE 0 END                      AS below_alert_threshold,
    p.capital_price                             AS unit_cost,
    ROUND(p.stock * p.capital_price, 2)         AS inventory_value_at_cost
FROM product p
LEFT JOIN product_category pc ON pc.id = p.category_id
ORDER BY inventory_value_at_cost DESC;
