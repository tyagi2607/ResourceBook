"""
country_names.py — turn IMF's formal country labels into the short names readers expect.

    "China, People's Republic of" -> "China"
    "Russian Federation"          -> "Russia"
"""

from __future__ import annotations

OVERRIDES = {
    "KOR": "South Korea",
    "PRK": "North Korea",
    "RUS": "Russia",
    "IRN": "Iran",
    "SYR": "Syria",
    "VEN": "Venezuela",
    "LAO": "Laos",
    "MDA": "Moldova",
    "TZA": "Tanzania",
    "COD": "DR Congo",
    "COG": "Republic of Congo",
    "HKG": "Hong Kong SAR",
    "MAC": "Macao SAR",
    "TWN": "Taiwan",
    "KGZ": "Kyrgyzstan",
    "SVK": "Slovakia",
}


def short_country_name(iso3: str, imf_label: str | None) -> str:
    if iso3 in OVERRIDES:
        return OVERRIDES[iso3]
    if not imf_label:  # a few IMF entries have no label
        return iso3
    # "Türkiye, Republic of" -> "Türkiye"; "Netherlands, The" -> "Netherlands"
    return imf_label.split(",")[0].strip()
