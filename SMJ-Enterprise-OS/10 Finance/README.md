# 10 Finance

**Scope:** Real financial data exists for Toko Sembako Sejahtera only (from
the Loka POS export). No financial data or system exists for SBGA (zero
sales to date) or Sentra Telur Keluarga (not launched).

## Toko Sembako Sejahtera — Real Financial Picture

| Metric | Source Query |
|---|---|
| Daily/period revenue | `11 Data Platform/scripts/analytics/01_revenue.sql` |
| Profit and margin % | `11 Data Platform/scripts/analytics/02_profit.sql` |
| Per-product margin | `11 Data Platform/scripts/analytics/07_margin.sql` |
| Category-level revenue/margin | `11 Data Platform/scripts/analytics/08_category.sql` |
| Payment method mix | `11 Data Platform/scripts/analytics/09_payment.sql` (96% cash) |
| Full daily operating summary incl. expenses | `11 Data Platform/scripts/analytics/10_daily_sales.sql` |

**Expense tracking:** 25 recorded expenses in the data window (e.g.
"Shodaqoh"/charity, operational costs), each with itemized line entries.

**Supplier payments:** All 37 restock batches in the current data window
show fully paid status — no outstanding supplier balances observed.

**Known anomaly:** 1 invoice recorded a net loss (`profit < 0`) — flagged
for review, not corrected (see `11 Data Platform/reports/data_quality_report.md`).

## ⚠️ Knowledge Gap

No consolidated, holding-company-level financial view exists. Each business
unit's finances (to the extent they exist) are unit-level only. No
enterprise P&L, no capital allocation record between units beyond the
founding-story anecdote of SBGA's initial 200kg capital. See
`15 Decision Memory/Knowledge_Gap_Report.md`.

## Cross-References

- `11 Data Platform/README.md`
- `01 Holding/README.md`
