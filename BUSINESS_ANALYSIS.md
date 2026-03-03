# 📊 True Shop Dashboard — Business Analysis Report

> **Analyst:** AI Business Analyst | **Date:** March 3, 2026  
> **Data Source:** Google Sheets Transaction Data (2,438 records)  
> **Period:** January 2025 — February 2026 (14 months)

---

## Executive Summary

The True Shop retail network generated **฿3,395,570 total revenue** from **5,843 units sold** across **55 shop-type pairs** (52 unique locations) over 14 months. The data reveals **critical concentration risk** (top 2 shops = 73% of revenue), **seasonal spikes** (December ฿458k), a **declining trend** in recent months, and a **massive shop inactivity problem** (67% of shops had zero transactions in the last 3 months).

---

## 1. Revenue Trend Analysis

### Monthly Revenue Performance

| Month | Revenue | Units | Txns | MoM% | AOV/Txn |
|-------|---------|-------|------|------|---------|
| Jan-25 | ฿72,164 | 116 | 57 | — | ฿1,266 |
| Feb-25 | ฿29,394 | 47 | 32 | -59.3% | ฿918 |
| Mar-25 | ฿78,530 | 125 | 75 | +167.2% | ฿1,047 |
| Apr-25 | ฿253,730 | 620 | 170 | +223.1% | ฿1,493 |
| May-25 | ฿167,591 | 439 | 180 | -33.9% | ฿931 |
| Jun-25 | ฿456,149 | 589 | 272 | +172.2% | ฿1,674 |
| **Jul-25** | **฿294,031** | **331** | **187** | **-35.5%** | ฿1,575 |
| Aug-25 | ฿291,390 | 479 | 175 | -0.9% | ฿1,665 |
| Sep-25 | ฿258,111 | 341 | 178 | -11.4% | ฿1,451 |
| Oct-25 | ฿230,006 | 347 | 192 | -10.9% | ฿1,196 |
| Nov-25 | ฿202,368 | 264 | 179 | -12.0% | ฿1,133 |
| **Dec-25** | **฿458,097** | **968** | **267** | **+126.4%** | ฿1,714 |
| Jan-26 | ฿319,445 | 612 | 219 | -30.3% | ฿1,457 |
| Feb-26 | ฿284,564 | 485 | 275 | -10.9% | ฿1,034 |

### Key Findings

> [!IMPORTANT]
> **Revenue declining 4 consecutive months (Jul→Nov)** before a December spike. Post-Dec revenue is trending back down. This could indicate seasonal dependency or promotional fatigue.

- **Best month:** Dec-25 (฿458k) — likely holiday season + promotional push
- **Worst month:** Feb-25 (฿29k) — post-New Year slowdown
- **Growth pattern:** Erratic with no sustained upward trend
- **AOV declining:** From ฿1,714/txn (Dec-25) to ฿1,034/txn (Feb-26) — **customers buying cheaper items or more discounts**

---

## 2. Shop Performance Analysis

### Revenue by Shop Type

| Shop Type | Revenue | Share | Shops | Txns |
|-----------|---------|-------|-------|------|
| ทรู แบรนดิ้งช็อป | ฿3,278,684 | **96.6%** | 14 | 2,313 |
| WW | ฿76,722 | 2.3% | 32 | 86 |
| ทรู สเฟียร์ | ฿40,164 | 1.2% | 9 | 39 |

> [!CAUTION]
> **96.6% of revenue comes from "ทรู แบรนดิ้งช็อป"** shops (14 shops). The other 41 shops (WW + ทรู สเฟียร์) contribute only **3.4% combined**. This is extreme concentration risk.

### Top Shop Concentration

| Rank | Shop | Revenue | Share |
|------|------|---------|-------|
| 1 | ทรู ทาวเวอร์ 1 | ฿1,591,543 | **46.9%** |
| 2 | ทรู ดิจิทัล พาร์ค | ฿899,467 | **26.5%** |
| 3 | ซีพี ทาวเวอร์ สีลม | ฿318,055 | 9.4% |
| | **Top 3 Total** | **฿2,809,065** | **82.7%** |

> [!WARNING]
> **ทรู ทาวเวอร์ 1 alone generates 46.9% of ALL revenue.** If this single location underperforms, the entire business is at risk.

### Shop Activity Crisis

| Metric | Count |
|--------|-------|
| Total shop-type pairs | 55 |
| Active (last 3 months) | **18 (33%)** |
| Inactive (last 3 months) | **37 (67%)** |

> [!CAUTION]
> **37 out of 55 shops have HAD ZERO TRANSACTIONS in the last 3 months.** Almost all WW shops and ทรู สเฟียร์ shops appear inactive. This suggests either: shops closing, product stock-outs at these locations, or staff not logging sales.

---

## 3. Product Performance Analysis

### Revenue by Product Category

| Category | Revenue | Share | Products | Avg Unit Price |
|----------|---------|-------|----------|---------------|
| Camera | ฿1,356,172 | **39.9%** | 8 | ฿754 |
| Appliances | ฿946,710 | 27.9% | 7 | ฿1,216 |
| Gadget | ฿416,937 | 12.3% | 2 | ฿282 |
| Control | ฿253,760 | 7.5% | 4 | ฿302 |
| Health | ฿211,180 | 6.2% | 3 | ฿520 |
| Security | ฿210,811 | 6.2% | 6 | ฿1,079 |

### Top Products

| Rank | Product | Revenue | Units | AOV |
|------|---------|---------|-------|-----|
| 1 | Smart Robot Vacuum Mop | ฿573,728 | 189 | ฿3,036 |
| 2 | Smart Camera 4Pro Ai | ฿403,609 | 464 | ฿870 |
| 3 | Portable Fan Coolpad | ฿390,142 | 1,291 | ฿302 |
| 4 | Smart Camera Affordable (Pack 3) | ฿363,636 | 1,082 | ฿336 |
| 5 | Ice Maker | ฿194,139 | 97 | ฿2,001 |

- **Robot Vacuum Mop** is the hero product (฿574k) with highest AOV (฿3,036)
- **Portable Fan Coolpad** sells the most units (1,291) but at low price (฿302)
- **Camera category** dominates at 40% of revenue

### Category Trends

> [!IMPORTANT]
> - **Camera** had a massive Dec spike (฿296k, 5x average) — likely holiday gifting
> - **Appliances** emerged from Jun-25 onwards (฿0 → ฿221k in Jun) — new product line launch?
> - **Gadget** peaked in Apr-25 (฿132k) and steadily declining since

---

## 4. Customer Behavior Patterns

### Weekend vs. Weekday

| Period | Revenue | Share | Txns | AOV/Txn |
|--------|---------|-------|------|---------|
| Weekday | ฿2,984,757 | **87.9%** | 2,065 | ฿1,445 |
| Weekend | ฿410,813 | 12.1% | 373 | ฿1,101 |

> [!NOTE]
> **Weekend revenue is disproportionately low (12.1%)** while weekends theoretically represent ~29% of days. This suggests the shops primarily serve office workers/B2B customers, not walk-in retail consumers.

### Day of Week Performance

| Day | Revenue | Txns |
|-----|---------|------|
| Thursday | ฿788,058 | 488 |
| Wednesday | ฿712,529 | 467 |
| Tuesday | ฿544,513 | 392 |
| Monday | ฿470,561 | 322 |
| Friday | ฿469,096 | 396 |
| Saturday | ฿243,536 | 187 |
| Sunday | ฿167,277 | 186 |

- **Thursday is the strongest day** (23.2% of revenue)
- **Mid-week (Tue-Thu)** accounts for 60.3% of all revenue

---

## 5. Shop Segment Analysis

| Segment | Revenue | Share | Txns |
|---------|---------|-------|------|
| Event | ฿2,491,010 | **73.4%** | 1,479 |
| Champion | ฿684,427 | 20.1% | 674 |
| Mass | ฿154,021 | 4.5% | 215 |
| High Potential | ฿45,075 | 1.3% | 36 |
| At Risk | ฿21,037 | 0.6% | 34 |

> [!NOTE]
> **"Event" segment generates 73.4% of revenue** — these are likely promotional/event-driven sales. "High Potential" and "At Risk" shops contribute only 1.9% combined, suggesting limited penetration in newer markets.

---

## 6. Promotion Analysis

| Promotion | Revenue | Txns | AOV |
|-----------|---------|------|-----|
| Ecom/True Shop | ฿1,195,179 | 810 | ฿1,476 |
| True Shop | ฿1,177,277 | 783 | ฿1,504 |
| No Promotion | ฿146,902 | 153 | ฿960 |
| DISCOUNT | ฿124,158 | 124 | ฿1,001 |
| DISCOUNT ecommerce | ฿144,087 | 79 | ฿1,824 |

- **93.7% of transactions involve a promotion** — heavy promotional dependency
- Sales without promotions have a **36% lower AOV** (฿960 vs. ฿1,476)

---

## 7. Critical Business Problems Identified

### 🔴 Problem 1: Extreme Shop Concentration Risk
- **1 shop = 47% of revenue.** ทรู ทาวเวอร์ 1 is a single point of failure.
- **Action:** Develop revenue growth plans for underperforming shops.

### 🔴 Problem 2: Massive Shop Inactivity (67% Inactive)
- **37 of 55 shops had zero sales in 3 months.** This is the most alarming finding.
- **Action:** Investigate root cause — are these shops closed? Out of stock? Staff not logging? Need urgent audit.

### 🟡 Problem 3: Revenue Decline Trend
- **4 consecutive declining months** (Jul→Nov 2025) before a Dec holiday spike.
- Feb-26 AOV dropping to ฿1,034 (lowest in 9 months).
- **Action:** Analyze if this is organic decline or seasonal. Implement retention campaigns.

### 🟡 Problem 4: WW & ทรู สเฟียร์ Channel Underperformance
- **41 shops across WW and ทรู สเฟียร์ generate only 3.4% of revenue.**
- **Action:** Evaluate whether these channels are worth maintaining or need different product mix.

### 🟡 Problem 5: Weekend Revenue Gap
- **Weekends represent only 12.1%** of revenue despite being 29% of days.
- **Action:** Consider weekend-specific promotions or events to drive foot traffic.

### 🟢 Problem 6: Promotion Dependency
- **93.7% of sales are promotional.** Organic demand is low.
- **Action:** Test pricing strategies that reduce promotional dependency.

---

## 8. Recommendations for Dashboard Enhancement

Based on this analysis, the dashboard should consider adding:

1. **🔴 Inactive Shop Alert** — Flag shops with zero transactions in the last N days
2. **📈 Revenue Trend Forecast** — Add a moving average or trendline to spot declining patterns
3. **🏪 Shop Concentration Warning** — Show when a single shop exceeds 40% of total revenue
4. **📊 AOV Tracking** — Add Average Order Value as a KPI card (currently missing)
5. **🎯 Shop Segment Breakdown** — Add a chart for Event/Champion/Mass/High Potential/At Risk segments
6. **🔄 Promotion Effectiveness** — Track promo vs. non-promo revenue to monitor dependency
7. **⚠️ Month-over-Month Decline Counter** — Alert when revenue declines for X consecutive months

---

*Analysis based on 2,438 transaction records from True Shop transection sheet.*
