# 04 Products

Two product knowledge sources exist: SBGA's specialized rice knowledge
(philosophy-driven, documented pre-launch), and Toko Sembako Sejahtera's
real retail catalogue (44 SKUs, from live POS data). They overlap on rice.

## SBGA Rice Varieties (7, documented)

| Variety | Best Use Case | Key Trait |
|---|---|---|
| Panawuan (flagship) | Long service windows, restaurants/hotels | Holds softness for hours |
| Mawar | Aroma-sensitive customers | Longest-lasting fragrance |
| Sarinah | Budget-conscious, quality-sensitive | Good eating quality, slight visual inconsistency |
| Singaparna | Padang/curry-heavy menus | Firm, absorbs sauce without mushiness |
| Majalengka | Budget Padang-style | Similar to Singaparna, weaker visual appeal |
| Buled Cigalontang | Ketupat/lontong only | Not for daily table rice |
| Red Rice / Black Glutinous | Health-focused cross-sell | Specialty/niche |

**Diagnostic Matching Framework — the Five Questions:** (1) What type of
operation do they run? (2) What dishes do they serve? (3) How long does
cooked rice sit before eating? (4) Has anything changed recently? (5) What
are customers specifically saying?

⚠️ **Knowledge Gap:** Aroma profiles and precise weaknesses are incomplete
for several varieties — flagged since the original Knowledge Base build,
still open.

## Toko Sembako Sejahtera Retail Catalogue (real data)

44 products across 7 categories, including rice (shared varieties with
SBGA — "Buleud" and "Majalengka" appear directly in POS sales data), eggs
("Telur" — top seller by volume), and general grocery ("Bahan Dapur").
Full product-level data, including current stock and margin per product:
`11 Data Platform/scripts/analytics/03_best_selling.sql`,
`06_stock.sql`, `07_margin.sql`.

**This is the clearest concrete link between the two business units** —
SBGA's specialized rice knowledge could directly inform how Toko Sembako
Sejahtera sells and stocks its own rice SKUs. Not yet acted on — see
`16 Roadmap/90_Day_Roadmap.md`.

## Cross-References

- `02 Business Units/SBGA/README.md`, `02 Business Units/Toko Sembako Sejahtera/README.md`
- `11 Data Platform/reports/business_dictionary.md`
- `05 Customers/README.md` (product-to-customer matching)
