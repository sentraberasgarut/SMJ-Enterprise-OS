-- 07_margin.sql
-- Per-product margin analysis using actual transacted price/capital_price
-- from invoice_item (reflects real selling conditions, including any
-- per-sale discounting), not just the current Product list price.

SELECT
    p.id                                              AS product_id,
    p.name                                            AS product_name,
    SUM(ii.quantity)                                  AS units_sold,
    SUM(ii.price * ii.quantity)                       AS gross_sales,
    SUM(ii.capital_price * ii.quantity)               AS total_cost,
    SUM(ii.price * ii.quantity) - SUM(ii.capital_price * ii.quantity) AS gross_margin,
    ROUND(
        100.0 * (SUM(ii.price * ii.quantity) - SUM(ii.capital_price * ii.quantity))
        / NULLIF(SUM(ii.price * ii.quantity), 0), 2
    )                                                  AS margin_pct
FROM invoice_item ii
JOIN product p ON p.id = ii.product_id
GROUP BY p.id, p.name
ORDER BY gross_margin DESC;
