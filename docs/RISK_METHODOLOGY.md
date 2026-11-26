# Risk Methodology — V1 Environmental Dengue Suitability Index (EDSI)

## 1. Scientific Interpretation
EDSI (`0–100`) is a **provisional, explainable heuristic** measuring meteorological suitability for *Aedes aegypti* breeding and transmission. It is **not** a clinical infection probability and does **not** predict confirmed dengue outbreaks.

## 2. Normalized Environmental Formula
$$\text{EDSI} = 100 \times (0.4375 \cdot S_R + 0.3125 \cdot S_T + 0.2500 \cdot S_H)$$

- **Rainfall Suitability ($S_R$, weight `0.4375`):** Computed over a 21-day lagged cumulative rainfall window (`0.05` at ≤5 mm, rising linearly to `0.70` at 80 mm, peaking at `1.0` for 250–450 mm, tapering to `0.90` above 450 mm).
- **Temperature Suitability ($S_T$, weight `0.3125`):** Piecewise curve peaking at `28.0°C` (`1.0`), favorable `25–32°C` (`>= 0.80`), tapering to `0.0` outside `16–38°C`.
- **Humidity Suitability ($S_H$, weight `0.2500`):** `0.0` at ≤40% RH, rising to `0.45` at 70% RH, and saturating at `1.0` above 85% RH.

## 3. Risk Categories & Missing Data
- `CRITICAL`: `75.0 – 100.0`
- `HIGH`: `55.0 – 74.9`
- `MODERATE`: `30.0 – 54.9`
- `LOW`: `0.0 – 29.9`
- `NO DATA`: Returned whenever `temp_mean`, `humidity_mean`, or `rainfall_mm` is missing. Missing values are never replaced with `0`.

## 4. Separate Community Signal
`community_signal_score` (`0–100`) is computed independently from active `APPROVED` `WATERLOGGING`, `STAGNANT_WATER`, and `MOSQUITO_ACTIVITY` reports with 14-day linear freshness decay. `SUSPECTED_DENGUE_REPORT` entries and air-quality metrics (`PM2.5`, `PM10`, `AQI`) are excluded from the core V1 EDSI formula.
