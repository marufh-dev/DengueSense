#!/usr/bin/env python3
"""Validate all 64 Bangladesh districts GeoJSON, export clean frontend GeoJSON, and seed Supabase."""

import json
import math
import os
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client

ROOT = Path(__file__).resolve().parent.parent
load_dotenv(ROOT / ".env")

GEOJSON_PATH = ROOT / "data" / "raw" / "geoBoundaries-BGD-ADM2_simplified.geojson"
FRONTEND_GEOJSON_PATH = ROOT / "frontend" / "public" / "data" / "bangladesh_districts.geojson"

DISTRICT_META = {
    "Bagerhat": ("Khulna", "বাগেরহাট", "BD-05"),
    "Bandarban": ("Chattogram", "বান্দরবান", "BD-01"),
    "Barguna": ("Barishal", "বরগুনা", "BD-02"),
    "Barisal": ("Barishal", "বরিশাল", "BD-06"),
    "Bhola": ("Barishal", "ভোলা", "BD-07"),
    "Bogra": ("Rajshahi", "বগুড়া", "BD-03"),
    "Brahamanbaria": ("Chattogram", "ব্রাহ্মণবাড়িয়া", "BD-04"),
    "Chandpur": ("Chattogram", "চাঁদপুর", "BD-09"),
    "Chittagong": ("Chattogram", "চট্টগ্রাম", "BD-10"),
    "Chuadanga": ("Khulna", "চুয়াডাঙ্গা", "BD-12"),
    "Comilla": ("Chattogram", "কুমিল্লা", "BD-08"),
    "Cox's Bazar": ("Chattogram", "কক্সবাজার", "BD-11"),
    "Dhaka": ("Dhaka", "ঢাকা", "BD-13"),
    "Dinajpur": ("Rangpur", "দিনাজপুর", "BD-14"),
    "Faridpur": ("Dhaka", "ফরিদপুর", "BD-15"),
    "Feni": ("Chattogram", "ফেনী", "BD-16"),
    "Gaibandha": ("Rangpur", "গাইবান্ধা", "BD-19"),
    "Gazipur": ("Dhaka", "গাজীপুর", "BD-18"),
    "Gopalganj": ("Dhaka", "গোপালগঞ্জ", "BD-17"),
    "Habiganj": ("Sylhet", "হবিগঞ্জ", "BD-20"),
    "Jamalpur": ("Mymensingh", "জামালপুর", "BD-21"),
    "Jessore": ("Khulna", "যশোর", "BD-22"),
    "Jhalokati": ("Barishal", "ঝালকাঠি", "BD-25"),
    "Jhenaidah": ("Khulna", "ঝিনাইদহ", "BD-23"),
    "Joypurhat": ("Rajshahi", "জয়পুরহাট", "BD-24"),
    "Khagrachhari": ("Chattogram", "খাগড়াছড়ি", "BD-29"),
    "Khulna": ("Khulna", "খুলনা", "BD-27"),
    "Kishoreganj": ("Dhaka", "কিশোরগঞ্জ", "BD-26"),
    "Kurigram": ("Rangpur", "কুড়িগ্রাম", "BD-28"),
    "Kushtia": ("Khulna", "কুষ্টিয়া", "BD-30"),
    "Lakshmipur": ("Chattogram", "লক্ষ্মীপুর", "BD-31"),
    "Lalmonirhat": ("Rangpur", "লালমনিরহাট", "BD-32"),
    "Madaripur": ("Dhaka", "মাদারীপুর", "BD-36"),
    "Magura": ("Khulna", "মাগুরা", "BD-37"),
    "Manikganj": ("Dhaka", "মানিকগঞ্জ", "BD-33"),
    "Maulvibazar": ("Sylhet", "মৌলভীবাজার", "BD-38"),
    "Meherpur": ("Khulna", "মেহেরপুর", "BD-39"),
    "Munshiganj": ("Dhaka", "মুন্সীগঞ্জ", "BD-35"),
    "Mymensingh": ("Mymensingh", "ময়মনসিংহ", "BD-34"),
    "Naogaon": ("Rajshahi", "নওগাঁ", "BD-48"),
    "Narail": ("Khulna", "নড়াইল", "BD-43"),
    "Narayanganj": ("Dhaka", "নারায়ণগঞ্জ", "BD-40"),
    "Narsingdi": ("Dhaka", "নরসিংদী", "BD-42"),
    "Natore": ("Rajshahi", "নাটোর", "BD-44"),
    "Nawabganj": ("Rajshahi", "চাঁপাইনবাবগঞ্জ", "BD-45"),
    "Netrakona": ("Mymensingh", "নেত্রকোণা", "BD-41"),
    "Nilphamari": ("Rangpur", "নীলফামারী", "BD-46"),
    "Noakhali": ("Chattogram", "নোয়াখালী", "BD-47"),
    "Pabna": ("Rajshahi", "পাবনা", "BD-49"),
    "Panchagarh": ("Rangpur", "পঞ্চগড়", "BD-52"),
    "Patuakhali": ("Barishal", "পটুয়াখালী", "BD-51"),
    "Pirojpur": ("Barishal", "পিরোজপুর", "BD-50"),
    "Rajbari": ("Dhaka", "রাজবাড়ী", "BD-53"),
    "Rajshahi": ("Rajshahi", "রাজশাহী", "BD-54"),
    "Rangamati": ("Chattogram", "রাঙ্গামাটি", "BD-56"),
    "Rangpur": ("Rangpur", "রংপুর", "BD-55"),
    "Satkhira": ("Khulna", "সাতক্ষীরা", "BD-58"),
    "Shariatpur": ("Dhaka", "শরীয়তপুর", "BD-62"),
    "Sherpur": ("Mymensingh", "শেরপুর", "BD-57"),
    "Sirajganj": ("Rajshahi", "সিরাজগঞ্জ", "BD-59"),
    "Sunamganj": ("Sylhet", "সুনামগঞ্জ", "BD-61"),
    "Sylhet": ("Sylhet", "সিলেট", "BD-60"),
    "Tangail": ("Dhaka", "টাঙ্গাইল", "BD-63"),
    "Thakurgaon": ("Rangpur", "ঠাকুরগাঁও", "BD-64"),
}


def ring_area_and_centroid(ring: list[list[float]]) -> tuple[float, float, float]:
    area = 0.0
    cx = 0.0
    cy = 0.0
    n = len(ring)
    for i in range(n - 1):
        x0, y0 = ring[i][0], ring[i][1]
        x1, y1 = ring[i + 1][0], ring[i + 1][1]
        cross = x0 * y1 - x1 * y0
        area += cross
        cx += (x0 + x1) * cross
        cy += (y0 + y1) * cross
    area *= 0.5
    if abs(area) < 1e-12:
        avg_x = sum(p[0] for p in ring) / max(1, n)
        avg_y = sum(p[1] for p in ring) / max(1, n)
        return 0.0, avg_x, avg_y
    return abs(area), cx / (6.0 * area), cy / (6.0 * area)


def geometry_stats(geom: dict) -> tuple[float, float, float]:
    gtype = geom["type"]
    polys = [geom["coordinates"]] if gtype == "Polygon" else geom["coordinates"]
    total_area = 0.0
    weighted_lon = 0.0
    weighted_lat = 0.0
    for poly in polys:
        outer = poly[0]
        a, cx, cy = ring_area_and_centroid(outer)
        total_area += a
        weighted_lon += cx * a
        weighted_lat += cy * a
    lon = weighted_lon / total_area
    lat = weighted_lat / total_area
    area_sq_km = round(total_area * (111.32 ** 2) * math.cos(math.radians(lat)), 2)
    return round(lat, 5), round(lon, 5), area_sq_km


def to_multipolygon_ewkt(geom: dict) -> str:
    polys = [geom["coordinates"]] if geom["type"] == "Polygon" else geom["coordinates"]
    poly_strs = []
    for poly in polys:
        ring_strs = []
        for ring in poly:
            pts = ", ".join(f"{p[0]} {p[1]}" for p in ring)
            ring_strs.append(f"({pts})")
        poly_strs.append(f"({', '.join(ring_strs)})")
    return f"SRID=4326;MULTIPOLYGON({', '.join(poly_strs)})"


def main():
    supabase_url = os.environ["SUPABASE_URL"]
    service_key = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
    client = create_client(supabase_url, service_key)

    with open(GEOJSON_PATH, "r", encoding="utf-8") as f:
        gj = json.load(f)

    features = gj.get("features", [])
    assert len(features) == 64, f"Expected 64 features, got {len(features)}"

    clean_features = []
    district_rows = []

    for feat in features:
        name_en = feat["properties"]["shapeName"]
        assert name_en in DISTRICT_META, f"Missing metadata for {name_en}"
        division, name_bn, district_code = DISTRICT_META[name_en]
        geom = feat["geometry"]
        assert geom["type"] in ("Polygon", "MultiPolygon"), f"Invalid type for {name_en}"

        lat, lon, area_sq_km = geometry_stats(geom)
        assert 20.3 <= lat <= 26.8, f"Invalid lat for {name_en}: {lat}"
        assert 87.9 <= lon <= 92.8, f"Invalid lon for {name_en}: {lon}"

        clean_features.append({
            "type": "Feature",
            "properties": {
                "district_code": district_code,
                "name_en": name_en,
                "name_bn": name_bn,
                "division": division,
                "centroid_lat": lat,
                "centroid_lon": lon,
                "area_sq_km": area_sq_km,
            },
            "geometry": geom,
        })

        district_rows.append({
            "district_code": district_code,
            "name_en": name_en,
            "name_bn": name_bn,
            "division": division,
            "centroid_lat": lat,
            "centroid_lon": lon,
            "area_sq_km": area_sq_km,
            "geom": to_multipolygon_ewkt(geom),
        })

    FRONTEND_GEOJSON_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(FRONTEND_GEOJSON_PATH, "w", encoding="utf-8") as f:
        json.dump({
            "type": "FeatureCollection",
            "name": "Bangladesh_64_Districts_geoBoundaries_ADM2",
            "features": clean_features,
        }, f, ensure_ascii=False)

    res = client.table("districts").upsert(district_rows, on_conflict="district_code").execute()
    print(f"Upserted {len(res.data)} districts into Supabase.")

    sources = [
        {
            "source_name": "geoBoundaries",
            "dataset_name": "BGD-ADM2 (2020) / BBS & OCHA ROAP",
            "source_url": "https://www.geoboundaries.org/api/current/gbOpen/BGD/ADM2/",
            "license": "CC BY 3.0 IGO",
            "attribution": "Bangladesh Bureau of Statistics (BBS), OCHA ROAP via geoBoundaries",
            "description": "64 administrative district boundaries (ADM2) for Bangladesh.",
            "active": True,
        },
        {
            "source_name": "Open-Meteo",
            "dataset_name": "Historical & Forecast Weather API",
            "source_url": "https://open-meteo.com/en/docs/historical-weather-api",
            "license": "CC BY 4.0",
            "attribution": "Weather data by Open-Meteo.com (ERA5 / seamless forecast)",
            "description": "Daily temperature, relative humidity, precipitation, wind speed, and soil moisture.",
            "active": True,
        },
        {
            "source_name": "Open-Meteo",
            "dataset_name": "Air Quality API",
            "source_url": "https://open-meteo.com/en/docs/air-quality-api",
            "license": "CC BY 4.0",
            "attribution": "Air quality data by Open-Meteo.com (CAMS)",
            "description": "Supplementary PM2.5, PM10, European AQI, and US AQI metrics.",
            "active": True,
        },
    ]
    src_res = client.table("data_sources").upsert(sources, on_conflict="source_name,dataset_name").execute()
    print(f"Upserted {len(src_res.data)} data sources into Supabase.")


if __name__ == "__main__":
    main()
