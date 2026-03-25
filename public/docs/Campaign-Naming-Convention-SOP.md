# Campaign Naming Convention SOP
## For Market-Based Reporting in the Marketing Dashboard

---

## Purpose

This document outlines the required naming conventions for Google Ads and Meta Ads campaigns to enable accurate market-based filtering and reporting in the dashboard.

---

## Naming Requirements

For the Market Filter to correctly identify and segment campaigns, **include one of the following identifiers** in your campaign name:

| Market | Accepted Identifiers | Examples |
|--------|---------------------|----------|
| **Ireland** | `IRE`, `IE`, `Ireland` | `Brand - IRE - Awareness`, `IE-Prospecting-Q1`, `Ireland Summer Sale` |
| **United Kingdom** | `UK`, `United Kingdom`, `Britain`, `British` | `Brand - UK - Conversions`, `UK-Retargeting-Q1`, `British Spring Campaign` |
| **United States** | `US`, `USA`, `United States` | `Brand - US - Awareness`, `USA-Prospecting-Q1` |
| **Germany** | `DE`, `Germany`, `German` | `Brand - DE - Conversions`, `German Summer Campaign` |
| **New Zealand** | `NZ`, `New Zealand` | `Brand - NZ - Awareness`, `New Zealand Q1` |
| **Greece** | `GR`, `Greece`, `Greek` | `Brand - GR - Awareness`, `GR-Prospecting-Q1`, `Greek Summer Campaign` |

---

## Formatting Rules

### 1. Use Separators Around Market Codes

Use spaces or hyphens to separate the market code from other words:

✅ **Correct:**
- `Campaign - IE - Awareness`
- `UK-Prospecting-2024`
- `Brand IE Conversions`

❌ **Incorrect:**
- `CampaignIEAwareness` (no separator - will not be detected)

### 2. Position Flexibility

The market code can appear anywhere in the campaign name:

- **Beginning:** `IE - Brand Campaign`
- **Middle:** `Brand - UK - Conversions`
- **End:** `Summer Sale - IRE`

### 3. Case Insensitive

The system recognizes market codes regardless of case:
- `IE`, `ie`, `Ie` — all work the same
- `UK`, `uk`, `Uk` — all work the same

---

## Examples

| Campaign Name | Detected Market |
|--------------|-----------------|
| `ActiveIron - IE - Brand Awareness` | Ireland ✅ |
| `UK-Retargeting-Iron Supplements` | United Kingdom ✅ |
| `Ireland Prospecting Q1 2024` | Ireland ✅ |
| `British Summer Campaign` | United Kingdom ✅ |
| `Brand Campaign 2024` | ⚠️ No market detected |

---

## Platform-Specific Instructions

### Google Ads

1. Navigate to your campaign in Google Ads
2. Click on the campaign name to edit
3. Add the market identifier following the format above
4. Save changes

### Meta Ads (Facebook/Instagram)

1. Go to Ads Manager
2. Select the campaign you want to rename
3. Click the pencil icon next to the campaign name
4. Add the market identifier following the format above
5. Save changes

---

## Important Notes

- ⚠️ Campaigns **without** a market identifier will only appear when "All Markets" is selected in the dashboard
- 📊 Consistent naming across both Google Ads and Meta Ads ensures unified reporting
- 🔄 Apply this convention to **new campaigns** and consider renaming existing campaigns for historical accuracy
- 📅 Changes to campaign names take effect immediately in the dashboard after the next data refresh

---

## Recommended Naming Structure

For consistency, we recommend the following naming structure:

```
[Brand] - [Market] - [Objective] - [Audience/Creative] - [Date/Version]
```

**Examples:**
- `ActiveIron - IE - Awareness - Cold Audience - Q1 2024`
- `ActiveIron - UK - Conversions - Retargeting - Feb 2024`

---

## Support

If you have questions about campaign naming or the market filter functionality, please contact your marketing dashboard administrator.

---

*Document Version: 1.0*  
*Last Updated: February 2024*
