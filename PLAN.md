# Integrate Google Sheets Transaction Data into TrueX Dashboard

Replace mock data with real transaction data from the published Google Sheet, using the 11 focused columns. Redesign the dashboard to leverage the richer dataset.

## Data Analysis

From the spreadsheet (`gid=395929549`), I identified:

| Dimension | Distinct Values |
|-----------|----------------|
| **Month2** | `Jan-25`, `Feb-25`, `Mar-25`, `Apr-25`, `May-25`, `Jun-25`, `Jul-25`, `Aug-25`, `Sep-25`, `Oct-25`, `Nov-25`, `Dec-25`, `Jan-26` |
| **Shop_Type** | `WW`, `ทรู แบรนดิ้งช็อป`, `ทรู สเฟียร์` |
| **Shop_Segment** | `Champion`, `High Potential`, `Mass`, `At Risk`, `Event` |
| **Product_Sub** | `Camera`, `Control`, `Appliances`, `Security`, `Gadget`, `Health` |
| **Product_Segment** | `Premium`, `Hero`, `Mass` |
| **Day_of_Week** | Mon–Sun |
| **Is_Weekend** | `TRUE` / `FALSE` |

## Proposed Changes

### Data Layer

#### [NEW] [src/data/fetchTransactions.js](file:///d:/vibe_code/deploy-webapp-example/src/data/fetchTransactions.js)

Fetch CSV from the public Google Sheets URL at app startup, parse it, and return an array of objects with only the 11 focused columns:

```js
{ productName, qty, amount, month, dayOfWeek, isWeekend,
  shopType, shopName, productSub, shopSegment, productSegment }
```

> [!IMPORTANT]
> **Data fetching strategy**: Fetch live from Google Sheets CSV export URL on every page load. This means the dashboard auto-updates when new rows are added to the sheet — no redeployment needed. The Import button remains as a fallback/offline option.

---

### Dashboard Redesign

#### [MODIFY] [App.jsx](file:///d:/vibe_code/deploy-webapp-example/src/App.jsx)

**Filters** — dynamic dropdowns populated from actual data:

| Filter | Source Column | Values |
|--------|--------------|--------|
| Time Period | `Month2` | All + distinct months (13 periods) |
| Shop Type | `Shop_Type` | All + WW / ทรู แบรนดิ้งช็อป / ทรู สเฟียร์ |
| Shop Segment | `Shop_Segment` | All + Champion / High Potential / Mass / At Risk / Event |
| Product Category | `Product_Sub` | All + Camera / Control / Appliances / Security / Gadget / Health |
| Product Segment | `Product_Segment` | All + Premium / Hero / Mass |
| Search | `Shop_Name` | **Autocomplete** — see below |

**Search Autocomplete Behavior**:
- As the user types, a dropdown appears below the input showing matching `Shop_Name` values
- Matches are filtered in real-time (case-insensitive, partial match)
- Clicking a suggestion fills the search box and filters the dashboard
- Shows up to 8 suggestions at a time to avoid clutter
- Dropdown dismisses on blur or when a selection is made

**KPI Cards** (4 cards — same layout, real data):

| Card | Metric |
|------|--------|
| Total Revenue | Sum of `Amount` (filtered) |
| Units Sold | Sum of `Qty` (filtered) |
| Active Shops | Count of distinct `Shop_Name` with transactions |
| Product Categories | Count of distinct `Product_Sub` in selection |

**Charts** (3 charts + 1 Weekend analysis):

| Chart | Type | X-Axis | Y-Axis | Purpose |
|-------|------|--------|--------|---------|
| Revenue Trend | Line | `Month2` (chronological) | Sum of `Amount` | Monthly revenue trend |
| Revenue by Shop Segment | Bar | `Shop_Segment` | Sum of `Amount` | Segment comparison |
| Product Mix | Pie | `Product_Sub` | Sum of `Amount` | Category distribution |
| Weekend vs Weekday | Bar (stacked) | `Is_Weekend` | Sum of `Amount` + `Qty` | Weekend performance |

**Table** — Branch Performance ranking:

| Column | Source |
|--------|--------|
| Shop Name | `Shop_Name` (Thai, as-is from data) |
| Shop Type | `Shop_Type` |
| Shop Segment | `Shop_Segment` |
| Revenue (THB) | Sum of `Amount` grouped by shop |
| Units | Sum of `Qty` grouped by shop |
| Top Product | Most sold `Product_Sub` per shop |

---

## Verification Plan

### Automated Tests
- `npm run build` succeeds with no errors

### Manual Verification
- Dev server shows live data from Google Sheets
- All filters work correctly and update charts/table/KPIs
- Confirm data matches spreadsheet totals
