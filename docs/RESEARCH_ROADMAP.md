# V2 Research Roadmap — AI/ML & Geospatial Surveillance

DengueSense V1 is architected to accumulate clean, source-traceable daily time-series data for V2 epidemiological research without delaying the V1 MVP.

## 1. Epidemiological Ground Truth
- Archive daily/weekly dengue case counts and hospitalizations from **DGHS (Directorate General of Health Services)** and **OpenDengue** into `public.epidemiological_observations`.
- Preserve exact `geography_level` (`district`, `division`, `national`); **never** disaggregate division totals into synthetic district counts.

## 2. Feature Engineering
- Lagged meteorological windows: `1, 2, 4, 6, 8` weeks for rainfall, temperature, humidity.
- Rolling 7-day and 30-day statistics, wet-day counts (`rainfall > 10 mm`), diurnal temperature range (`temp_max - temp_min`), soil moisture, and spatial neighbor lags.

## 3. Modeling Progression & Evaluation
1. Seasonal-naive & statistical regression baselines.
2. Tabular ML: **Random Forest**, **XGBoost**, **LightGBM**.
3. Deep Learning: **LSTM / GRU** and **Spatio-Temporal Graph Neural Networks (ST-GNN)** over the 64-district adjacency graph.
- Use strict temporal train/test splits; evaluate with **MAE / RMSE** (regression) and **Precision / Recall / F1 / PR-AUC** (outbreak classification).
- Apply **SHAP** for feature-level explainability.

## 4. Computer Vision & Satellite Expansion
- **CV:** Fine-tune **MobileNetV3 / EfficientNet-Lite / YOLOv8** on labeled stagnant-water / container datasets to assist moderators (never to diagnose dengue).
- **Satellite:** Integrate **Sentinel-1 SAR** flood/surface-water indices, **SRTM/Copernicus DEM** low-lying drainage basins, **CHIRPS v3** rainfall, and **WorldPop** population density.

## 5. Potential Thesis / Publication Topics
- *Multi-Modal Spatio-Temporal Dengue Suitability & Outbreak Forecasting Across 64 Districts of Bangladesh.*
- *Explainable XGBoost vs. LSTM for Monsoon-Driven Dengue Early Warning.*
- *Lightweight Computer Vision Verification of Crowdsourced Urban Waterlogging Reports.*
