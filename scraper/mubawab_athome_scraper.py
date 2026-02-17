#!/usr/bin/env python3
"""
Mubawab At Home Agency Scraper
==============================
Scrapes ALL property listings from the At Home agency page on Mubawab
URL: https://www.mubawab.ma/fr/b/7859/at-home-immobilier-real-estate-agency

Author: Claude Code
Date: 2026-02-17
"""

import json
import time
import re
import os
import hashlib
from datetime import datetime
from typing import Dict, List, Optional
from dataclasses import dataclass, asdict, field
from urllib.parse import urljoin, urlparse

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.common.exceptions import (
    TimeoutException,
    NoSuchElementException,
    StaleElementReferenceException
)


@dataclass
class Property:
    """Property data structure matching the At Home app format"""
    id: str
    name: str
    type: str  # Appartement, Villa, Bureau, etc.
    category: str  # SALE or RENT
    location: str
    city: str
    price: str
    priceNumeric: int
    beds: int = 0
    baths: int = 0
    area: str = ""
    areaNumeric: int = 0
    image: str = ""
    images: List[str] = field(default_factory=list)
    features: List[str] = field(default_factory=list)
    smartTags: List[str] = field(default_factory=list)
    description: str = ""
    url: str = ""
    datePublished: Optional[str] = None
    dateScraped: str = field(default_factory=lambda: datetime.now().isoformat())


class MubawabAtHomeScraper:
    """
    Scraper for At Home Real Estate Agency listings on Mubawab
    """

    AGENCY_URL = "https://www.mubawab.ma/fr/b/7859/at-home-immobilier-real-estate-agency"
    BASE_URL = "https://www.mubawab.ma"

    CATEGORY_MAPPING = {
        "à vendre": "SALE",
        "a vendre": "SALE",
        "vente": "SALE",
        "à louer": "RENT",
        "a louer": "RENT",
        "location": "RENT",
    }

    TYPE_MAPPING = {
        "appartement": "Appartement",
        "villa": "Villa",
        "maison": "Villa",
        "bureau": "Bureau",
        "local commercial": "Magasin",
        "magasin": "Magasin",
        "terrain": "Terrain",
        "studio": "Appartement",
        "duplex": "Appartement",
        "riad": "Villa",
        "ferme": "Terrain",
    }

    # Known Moroccan cities for location parsing
    MOROCCAN_CITIES = [
        "Casablanca", "Rabat", "Marrakech", "Tanger", "Fès", "Fes", "Agadir",
        "Meknès", "Meknes", "Oujda", "Kenitra", "Tétouan", "Tetouan", "Salé", "Sale",
        "Nador", "Mohammedia", "El Jadida", "Khouribga", "Béni Mellal", "Beni Mellal",
        "Taza", "Settat", "Berrechid", "Khémisset", "Khemisset", "Inezgane",
        "Ksar El Kebir", "Larache", "Guelmim", "Berkane", "Taourirt", "Bouskoura",
        "Fquih Ben Salah", "Dcheira El Jihadia", "Ouarzazate", "Benslimane",
        "Errachidia", "Youssoufia", "Essaouira", "Sidi Kacem", "Sidi Slimane",
        "Ain Harrouda", "Temara", "Skhirat", "Harhoura", "Bouznika", "Dar Bouazza",
        "Tamaris", "Ain Diab", "Hay Hassani"
    ]

    def __init__(self, headless: bool = True, delay: float = 2.0):
        self.delay = delay
        self.driver = None
        self.wait = None
        self.properties: List[Property] = []
        self.errors: List[Dict] = []

        self.options = Options()
        if headless:
            self.options.add_argument("--headless=new")
        self.options.add_argument("--no-sandbox")
        self.options.add_argument("--disable-dev-shm-usage")
        self.options.add_argument("--disable-gpu")
        self.options.add_argument("--window-size=1920,1080")
        self.options.add_argument("--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
        self.options.add_argument("--disable-blink-features=AutomationControlled")
        self.options.add_experimental_option("excludeSwitches", ["enable-automation"])

    def start(self):
        """Start the browser"""
        self.driver = webdriver.Chrome(options=self.options)
        self.driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
        self.wait = WebDriverWait(self.driver, 20)
        print("✓ Browser started")

    def stop(self):
        """Stop the browser"""
        if self.driver:
            self.driver.quit()
            print("✓ Browser closed")

    def _generate_id(self, url: str) -> str:
        """Generate a unique ID from URL"""
        hash_obj = hashlib.md5(url.encode())
        return f"ATH-{hash_obj.hexdigest()[:8].upper()}"

    def _safe_get_text(self, parent, selectors: List[str]) -> Optional[str]:
        """Safely get text from element using multiple selectors"""
        for selector in selectors:
            try:
                element = parent.find_element(By.CSS_SELECTOR, selector)
                text = element.text.strip()
                if text:
                    return text
            except:
                continue
        return None

    def _safe_get_attribute(self, parent, selector: str, attribute: str) -> Optional[str]:
        """Safely get attribute from element"""
        try:
            element = parent.find_element(By.CSS_SELECTOR, selector)
            return element.get_attribute(attribute)
        except:
            return None

    def _extract_price(self, price_text: str) -> tuple:
        """
        Extract price and numeric value from Mubawab price formats.

        Handles:
        - "1 500 000 DH" -> ("1 500 000 MAD", 1500000)
        - "15 000 DH/mois" -> ("15 000 MAD/mois", 15000)
        - "Prix sur demande" -> ("Prix sur demande", 0)
        - "1.5 M DH" -> ("1 500 000 MAD", 1500000)
        - "2,5 M DH" -> ("2 500 000 MAD", 2500000)
        """
        if not price_text:
            return "Prix sur demande", 0

        price_text = price_text.strip()

        # Handle "Prix sur demande" or similar
        if "demande" in price_text.lower() or "contact" in price_text.lower():
            return "Prix sur demande", 0

        # Detect if it's a rental (contains "/mois" or "par mois")
        is_rental = "/mois" in price_text.lower() or "par mois" in price_text.lower()

        # Handle "M DH" format (millions) - e.g., "1.5 M DH" or "1,5 M DH"
        million_match = re.search(r'([\d]+[.,]?\d*)\s*M\s*(?:DH|MAD)', price_text, re.IGNORECASE)
        if million_match:
            million_str = million_match.group(1).replace(',', '.')
            try:
                price_num = int(float(million_str) * 1_000_000)
                price_formatted = f"{price_num:,} MAD".replace(",", " ")
                if is_rental:
                    price_formatted += "/mois"
                return price_formatted, price_num
            except ValueError:
                pass

        # Standard format: extract all digits, handling spaces as thousand separators
        # "1 500 000 DH" -> 1500000
        # First, remove the currency suffix and /mois
        price_clean = re.sub(r'(?:DH|MAD|/mois|par\s*mois)', '', price_text, flags=re.IGNORECASE)

        # Remove all non-digit and non-decimal characters, keeping spaces temporarily
        # Then remove spaces to get the full number
        price_digits = re.sub(r'[^\d\s]', '', price_clean)
        price_digits = price_digits.replace(' ', '')

        if not price_digits:
            return "Prix sur demande", 0

        try:
            price_num = int(price_digits)
            # Format price with spaces as thousand separators (Moroccan format)
            price_formatted = f"{price_num:,} MAD".replace(",", " ")
            if is_rental:
                price_formatted += "/mois"
            return price_formatted, price_num
        except ValueError:
            return price_text.strip(), 0

    def _extract_area(self, text: str) -> tuple:
        """Extract area from text"""
        if not text:
            return "", 0

        patterns = [
            r'(\d+(?:[\s\.,]\d+)?)\s*m[²2]',  # 120 m², 120m2, 120 m2
            r'(\d+(?:[\s\.,]\d+)?)\s*m2',      # 120m2
            r'[Ss]urface\s*:?\s*(\d+(?:[\s\.,]\d+)?)',  # Surface: 120, Surface 120
            r'(\d+(?:[\s\.,]\d+)?)\s*sqm',     # 120 sqm
            r'superficie\s*:?\s*(\d+(?:[\s\.,]\d+)?)',  # Superficie: 120
        ]

        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                area_str = match.group(1).replace(" ", "").replace(",", "").replace(".", "")
                try:
                    area_num = int(area_str)
                    return f"{area_num} m²", area_num
                except ValueError:
                    pass
        return "", 0

    def _extract_beds_baths(self, text: str) -> tuple:
        """Extract bedrooms and bathrooms from text"""
        beds = 0
        baths = 0

        # Bedrooms - expanded patterns for Mubawab formats
        bed_patterns = [
            r'(\d+)\s*[Cc]hambre[s]?',           # 3 Chambres, 3 chambres
            r'(\d+)\s*[Cc]h\b',                  # 3 ch, 3 Ch
            r'(\d+)\s*pi[èe]ce[s]?',             # 3 pièces, 3 pieces
            r'(\d+)\s*[Pp]c[s]?\b',              # 3 pcs, 3 Pc
            r'[Cc]hambre[s]?\s*:?\s*(\d+)',      # Chambres: 3, Chambre 3
            r'[Bb]edroom[s]?\s*:?\s*(\d+)',      # Bedrooms: 3
            r'(\d+)\s*[Bb]edroom[s]?',           # 3 Bedrooms
            r'(\d+)\s*[Bb]dr?m?',                # 3 Bd, 3 Bdrm
            r'(\d+)\s*[Pp]i[èe]ces?\s*principales?',  # 3 pièces principales
        ]
        for pattern in bed_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                beds = int(match.group(1))
                break

        # Bathrooms - expanded patterns for Mubawab formats
        bath_patterns = [
            r'(\d+)\s*[Ss][Dd][Bb]',              # 2 SDB, 2 sdb
            r'(\d+)\s*[Ss]alle[s]?\s*de\s*[Bb]ain[s]?',  # 2 Salles de bain
            r'(\d+)\s*[Ss]alle[s]?\s*d\'eau',     # 2 Salles d'eau
            r'[Ss]alle[s]?\s*de\s*[Bb]ain[s]?\s*:?\s*(\d+)',  # Salle de bain: 2
            r'[Ss][Dd][Bb]\s*:?\s*(\d+)',         # SDB: 2
            r'(\d+)\s*[Bb]athroom[s]?',           # 2 Bathrooms
            r'[Bb]athroom[s]?\s*:?\s*(\d+)',      # Bathrooms: 2
            r'(\d+)\s*[Bb]ath[s]?\b',             # 2 Bath, 2 Baths
            r'(\d+)\s*[Ww][Cc]',                  # 2 WC
            r'(\d+)\s*toilette[s]?',              # 2 toilettes
        ]
        for pattern in bath_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                baths = int(match.group(1))
                break

        return beds, baths

    def _determine_category(self, text: str) -> str:
        """Determine if property is for SALE or RENT"""
        text_lower = text.lower()
        for keyword, category in self.CATEGORY_MAPPING.items():
            if keyword in text_lower:
                return category
        return "SALE"  # Default to SALE

    def _determine_type(self, text: str) -> str:
        """Determine property type"""
        text_lower = text.lower()
        for keyword, prop_type in self.TYPE_MAPPING.items():
            if keyword in text_lower:
                return prop_type
        return "Appartement"  # Default

    def _extract_features(self, text: str) -> List[str]:
        """Extract features from text using keyword matching"""
        features = []
        feature_keywords = {
            "terrasse": "Terrasse",
            "balcon": "Balcon",
            "jardin": "Jardin",
            "piscine": "Piscine",
            "garage": "Garage",
            "parking": "Parking",
            "meublé": "Meuble",
            "meuble": "Meuble",
            "neuf": "Neuf",
            "rénové": "Renove",
            "renove": "Renove",
            "vue mer": "Vue Mer",
            "ascenseur": "Ascenseur",
            "gardien": "Gardien",
            "sécurisé": "Securise",
            "securise": "Securise",
            "climatisation": "Climatisation",
            "climatisé": "Climatisation",
            "climatise": "Climatisation",
            "cave": "Cave",
            "cuisine équipée": "Cuisine Equipee",
            "cuisine equipee": "Cuisine Equipee",
            "wifi": "WiFi",
            "chauffage": "Chauffage",
            "interphone": "Interphone",
            "concierge": "Concierge",
            "buanderie": "Buanderie",
            "dressing": "Dressing",
            "cheminée": "Cheminee",
            "cheminee": "Cheminee",
            "alarme": "Alarme",
            "double vitrage": "Double Vitrage",
            "parquet": "Parquet",
            "store": "Stores",
            "placards": "Placards",
            "syndic": "Syndic",
            "digicode": "Digicode",
            "vidéophone": "Videophone",
            "videophone": "Videophone",
            "salon marocain": "Salon Marocain",
            "hammam": "Hammam",
            "cuisine américaine": "Cuisine Americaine",
            "cuisine americaine": "Cuisine Americaine",
            "séjour": "Sejour",
            "sejour": "Sejour",
            "lumineux": "Lumineux",
            "vue dégagée": "Vue Degagee",
            "vue degagee": "Vue Degagee",
            "box": "Box",
            "rangement": "Rangements",
        }

        text_lower = text.lower()
        for keyword, feature in feature_keywords.items():
            if keyword in text_lower:
                if feature not in features:
                    features.append(feature)

        return features

    def _extract_features_from_page(self, driver) -> List[str]:
        """Extract features/amenities from Mubawab's caracteristiques/equipements section on the page"""
        features = []

        # Selectors for Mubawab's features/amenities sections
        feature_section_selectors = [
            # Mubawab specific selectors for caracteristiques/equipements
            ".adFeatures li",
            ".adAmenities li",
            ".adEquipments li",
            "[class*='caracteristique'] li",
            "[class*='equipement'] li",
            "[class*='amenities'] li",
            "[class*='features'] li",
            ".allDetails li",
            ".otherDetails li",
            ".adMainDetails li",
            # Icon-based features (common on Mubawab)
            ".adParams span[class*='icon']",
            ".adParams [class*='feature']",
            # Tab content sections
            ".tabContent li",
            "#caracteristiques li",
            "#equipements li",
            # Generic feature containers
            ".featuresList li",
            ".amenitiesList li",
            ".caracteristiques li",
            ".equipements li",
            # Inline feature spans
            ".adDetails span.tag",
            ".adTags span",
            "[class*='tag-list'] span",
            # Mubawab specific blocks
            ".BlockCaracteristiques li",
            ".BlockEquipements li",
            ".infoDetailItem",
            "[class*='detail'] li",
            "[class*='property-feature']",
            "[class*='amenity-item']",
            # More Mubawab selectors
            ".listingDetails li",
            ".propertyFeatures li",
            ".adSpecs li",
            "[class*='spec'] li",
            "[class*='equipment'] li",
        ]

        for selector in feature_section_selectors:
            try:
                elements = driver.find_elements(By.CSS_SELECTOR, selector)
                for elem in elements:
                    text = elem.text.strip()
                    if text and len(text) > 1 and len(text) < 50:
                        # Clean up the text - remove common prefixes/icons
                        text = text.replace("checkmark", "").replace("check", "").strip()
                        text = re.sub(r'^[\u2713\u2714\u2022\u25CF\u25CB\u25A0\u25AA\u2023\u2219\u25E6]\s*', '', text)
                        text = re.sub(r'^\d+\s*', '', text)  # Remove leading numbers
                        if text and text not in features:
                            features.append(text)
            except:
                continue

        # Also look for features in icon+text patterns
        icon_text_selectors = [
            ".adParams > div",
            ".adCharacteristics > div",
            "[class*='detail-item']",
            "[class*='property-detail']",
            "[class*='spec-item']",
            ".adInfo > div",
        ]

        for selector in icon_text_selectors:
            try:
                elements = driver.find_elements(By.CSS_SELECTOR, selector)
                for elem in elements:
                    text = elem.text.strip()
                    # Filter out price/area/rooms that are already captured elsewhere
                    if text and len(text) > 2 and len(text) < 50:
                        skip_keywords = ['dh', 'mad', 'm2', 'chambre', 'piece', 'sdb', 'salle de bain', 'prix']
                        if not any(x in text.lower() for x in skip_keywords):
                            if text not in features:
                                features.append(text)
            except:
                continue

        return features[:20]  # Limit to 20 features

    def _extract_smart_tags(self, price: int, area: int, location: str) -> List[str]:
        """Generate smart tags based on property characteristics"""
        tags = []

        # Price-based tags
        if price > 5000000:
            tags.append("Luxe")
        elif price > 2000000:
            tags.append("Premium")

        # Area-based tags
        if area > 200:
            tags.append("Grande Surface")

        # Location-based tags
        location_lower = location.lower()
        premium_areas = ["anfa", "racine", "gauthier", "maarif", "bourgogne", "californie"]
        for area_name in premium_areas:
            if area_name in location_lower:
                tags.append("Quartier Prisé")
                break

        return tags

    def _parse_location(self, location_text: str) -> tuple:
        """
        Parse location text to extract city and neighborhood.

        Mubawab formats:
        - "Quartier, Ville" (e.g., "Anfa, Casablanca")
        - "Ville - Quartier" (e.g., "Casablanca - Anfa")
        - "Quartier - Ville" (e.g., "Maarif - Casablanca")
        - "Ville" (e.g., "Casablanca")

        Returns: (neighborhood, city)
        """
        if not location_text:
            return "", "Casablanca"

        # Clean up the text
        location_clean = location_text.strip()

        # Try to find a known city in the location text
        found_city = None
        city_position = -1

        for city in self.MOROCCAN_CITIES:
            # Case-insensitive search
            city_lower = city.lower()
            location_lower = location_clean.lower()

            if city_lower in location_lower:
                # Find the position of the city
                pos = location_lower.find(city_lower)
                # Keep track of the city found (prefer exact matches)
                if found_city is None or len(city) > len(found_city):
                    found_city = city
                    city_position = pos

        if not found_city:
            # No known city found, assume the whole text is the location
            # and default to Casablanca as city
            return location_clean, "Casablanca"

        # Normalize the city name (use the canonical spelling from our list)
        city = found_city

        # Extract the neighborhood
        # Split by common separators: comma, dash, hyphen
        separators = [',', ' - ', '-', '|', '/']

        neighborhood = ""

        for sep in separators:
            if sep in location_clean:
                parts = [p.strip() for p in location_clean.split(sep)]
                # Find which part is not the city
                for part in parts:
                    part_lower = part.lower()
                    # Check if this part is NOT the city
                    is_city = False
                    for known_city in self.MOROCCAN_CITIES:
                        if known_city.lower() == part_lower or known_city.lower() in part_lower:
                            is_city = True
                            break

                    if not is_city and part:
                        neighborhood = part
                        break
                break

        # If no separator found but we have a city, the whole text might be just the city
        # or the neighborhood might be embedded
        if not neighborhood:
            # Remove the city name from the location to get the neighborhood
            location_lower = location_clean.lower()
            city_lower = found_city.lower()

            # Try to extract what's before or after the city name
            before_city = location_clean[:city_position].strip(' ,-/')
            after_city = location_clean[city_position + len(found_city):].strip(' ,-/')

            # Prefer non-empty neighborhood
            if after_city:
                neighborhood = after_city
            elif before_city:
                neighborhood = before_city

        # Clean up neighborhood
        neighborhood = neighborhood.strip(' ,-/')

        # If neighborhood is the same as city, clear it
        if neighborhood.lower() == city.lower():
            neighborhood = ""

        return neighborhood, city

    def get_listing_urls(self) -> List[str]:
        """Get all listing URLs from the agency page"""
        urls = []
        page = 1

        print(f"\n{'='*60}")
        print(f"DISCOVERING LISTINGS FROM AT HOME AGENCY")
        print(f"{'='*60}")

        while True:
            if page == 1:
                url = self.AGENCY_URL
            else:
                url = f"{self.AGENCY_URL}:p:{page}"

            print(f"Page {page}: ", end="", flush=True)

            try:
                self.driver.get(url)
                time.sleep(self.delay)

                # Wait for listings to load
                self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "a[href*='/a/'], .listingBox, .adListItem, .listing-item, [class*='listing'], ul li")))

                # Find all listing links
                listing_selectors = [
                    "a[href*='/a/']",
                    "a.listingBox",
                    ".adListItem a.linkRef",
                    "a[href*='/fr/ad/']",
                    ".listing-item a",
                    "a.adLink",
                    "li a[href*='mubawab']",
                ]

                page_urls = []
                for selector in listing_selectors:
                    try:
                        links = self.driver.find_elements(By.CSS_SELECTOR, selector)
                        for link in links:
                            href = link.get_attribute("href")
                            # Match both /fr/ad/ and /a/ URL patterns
                            if href and ("/fr/ad/" in href or "/a/" in href) and href not in page_urls and href not in urls:
                                page_urls.append(href)
                    except:
                        continue

                if not page_urls:
                    print("No more listings found")
                    break

                urls.extend(page_urls)
                print(f"{len(page_urls)} listings found (Total: {len(urls)})")

                # Check if there's a next page
                try:
                    next_btn = self.driver.find_element(By.CSS_SELECTOR, "a.next, [class*='pagination'] a[rel='next'], .paginationNext")
                    if not next_btn.is_displayed():
                        break
                except:
                    # No next button, check if we got fewer results
                    if len(page_urls) < 10:
                        break

                page += 1
                if page > 10:  # Safety limit
                    break

            except TimeoutException:
                print("Timeout - stopping pagination")
                break
            except Exception as e:
                print(f"Error: {str(e)[:50]}")
                break

        print(f"\nTotal listings discovered: {len(urls)}")
        return urls

    def scrape_listing(self, url: str) -> Optional[Property]:
        """Scrape a single listing page"""
        try:
            self.driver.get(url)
            time.sleep(self.delay)

            # Wait for page to load
            self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "body")))

            # Title
            title = self._safe_get_text(self.driver, [
                "h1.adTitle",
                "h1[class*='title']",
                ".adMainInfos h1",
                "h1",
            ]) or "Propriété"

            # Price - Mubawab specific selectors (h3.orangeTit is the actual price element)
            price_text = self._safe_get_text(self.driver, [
                "h3.orangeTit",               # ACTUAL Mubawab price element
                ".infoPrice .priceTag",       # Main price tag on listing page
                ".priceTag",                   # Price tag component
                ".infoPrice",                  # Price info container
                "span[class*='Price']",        # Any span with Price in class
                ".adPrice",                    # Legacy selector
                "[class*='price']",            # Fallback
                ".priceBox",                   # Another fallback
                "h3[class*='price']",          # Price in h3
                ".listingPrice",               # Listing price class
            ])
            price_formatted, price_numeric = self._extract_price(price_text)

            # Location - get raw location text from multiple sources
            location_text = self._safe_get_text(self.driver, [
                ".adLocation",
                "[class*='location']",
                ".adAddress",
                ".locationInfos",
                "[class*='address']",
                "span[class*='city']",
                "span[class*='ville']",
            ]) or ""

            # Also try to find location from breadcrumbs or page title
            if not location_text:
                try:
                    breadcrumb = self.driver.find_elements(By.CSS_SELECTOR, ".breadcrumb a, nav a")
                    for bc in breadcrumb:
                        text = bc.text.strip()
                        for known_city in self.MOROCCAN_CITIES:
                            if known_city.lower() in text.lower():
                                location_text = text
                                break
                except:
                    pass

            # Parse location to extract neighborhood and city
            neighborhood, city = self._parse_location(location_text)

            # If city is still Casablanca (default), try to find actual city in title or URL
            if city == "Casablanca":
                for known_city in self.MOROCCAN_CITIES:
                    if known_city.lower() in title.lower() or known_city.lower() in url.lower():
                        city = known_city
                        break

            # Use neighborhood as location if available, otherwise use the full text or city
            location = neighborhood if neighborhood else (location_text if location_text else city)

            # Description - Mubawab specific selectors for description content
            description = self._safe_get_text(self.driver, [
                ".blockContentDesc",              # Mubawab main description block
                ".adMainInfo .content",           # Content inside main info
                ".blockContent p",                # Paragraph in block content
                ".adDescription",                 # Legacy description class
                ".adMainContent",                 # Main content area
                "[class*='description'] p",       # Paragraphs in description containers
                "[class*='description']",         # Any description class
                ".adText",                        # Ad text
                ".detailsContent",                # Details content section
                "div[itemprop='description']",    # Schema.org description
                ".contentDesc",                   # Content description
                "article p",                      # Paragraphs in article
            ]) or ""

            # If description is still empty, try to get text from multiple elements
            if not description:
                try:
                    desc_elements = self.driver.find_elements(By.CSS_SELECTOR, ".blockContent, .adMainInfo, .detailsBlock")
                    for elem in desc_elements:
                        text = elem.text.strip()
                        if text and len(text) > 50:  # Only use if substantial text
                            description = text
                            break
                except:
                    pass

            # Still no description? Try to extract from any paragraph elements
            if not description:
                try:
                    p_elements = self.driver.find_elements(By.CSS_SELECTOR, "p")
                    for p in p_elements:
                        text = p.text.strip()
                        # Look for paragraphs that look like descriptions (longer text, not just labels)
                        if text and len(text) > 100 and not any(x in text.lower() for x in ['cookie', 'confidentialité', 'contact', 'copyright']):
                            description = text
                            break
                except:
                    pass

            # Try meta description as last resort
            if not description:
                try:
                    meta_desc = self.driver.find_element(By.CSS_SELECTOR, "meta[name='description']")
                    description = meta_desc.get_attribute("content") or ""
                except:
                    pass

            # Category (SALE/RENT)
            category_text = self._safe_get_text(self.driver, [
                ".adCategory",
                "[class*='type']",
            ]) or title
            category = self._determine_category(f"{title} {category_text}")

            # Property type
            property_type = self._determine_type(title)

            # Area - Mubawab specific selectors
            area_text = self._safe_get_text(self.driver, [
                ".adMainCharacteristic [class*='area']",  # Area in main characteristics
                ".infoArea",                              # Info area class
                "span[class*='surface']",                 # Surface span
                ".listingDetails [class*='area']",        # Area in listing details
                "[class*='area']",                        # Generic area class
                "[class*='surface']",                     # Generic surface class
                ".adParams",                              # Ad params container
                ".characteristics span",                  # Characteristics spans
                ".basicInfo span",                        # Basic info spans
            ]) or ""

            # Also try to find area from icon-based elements (Mubawab uses icons)
            if not area_text:
                try:
                    # Look for elements near area/surface icons
                    icon_elements = self.driver.find_elements(By.CSS_SELECTOR, "[class*='icon'][class*='area'], [class*='icon'][class*='surface'], .fa-expand, .fa-ruler")
                    for icon in icon_elements:
                        parent = icon.find_element(By.XPATH, "./..")
                        if parent:
                            area_text = parent.text.strip()
                            if area_text:
                                break
                except:
                    pass

            area_str, area_num = self._extract_area(f"{title} {area_text} {description}")

            # Beds and Baths - look in multiple places on the page
            details_text = self._safe_get_text(self.driver, [
                ".adMainCharacteristic",              # Main characteristics block
                ".infoDetails",                       # Info details section
                ".basicInfo",                         # Basic info section
                ".listingDetails",                    # Listing details
                ".adParams",                          # Ad params
                "[class*='details']",                 # Any details class
                ".characteristics",                   # Characteristics section
                ".adMainInfo",                        # Main info section
                "ul[class*='feature']",               # Feature lists
                ".propertyDetails",                   # Property details
            ]) or ""

            # Also try to extract from specific bedroom/bathroom elements
            beds_text = ""
            baths_text = ""
            try:
                # Look for bedroom-specific elements
                bed_elements = self.driver.find_elements(By.CSS_SELECTOR, "[class*='bedroom'], [class*='chambre'], [class*='room']")
                for elem in bed_elements:
                    text = elem.text.strip()
                    if text:
                        beds_text += " " + text

                # Look for bathroom-specific elements
                bath_elements = self.driver.find_elements(By.CSS_SELECTOR, "[class*='bathroom'], [class*='sdb'], [class*='bath']")
                for elem in bath_elements:
                    text = elem.text.strip()
                    if text:
                        baths_text += " " + text
            except:
                pass

            # Try to extract area from page elements containing m²
            if not area_num:
                try:
                    area_elements = self.driver.find_elements(By.XPATH, "//*[contains(text(),'m²')]")
                    for el in area_elements[:5]:
                        text = el.text.strip()
                        if text and 'm²' in text:
                            match = re.search(r'(\d+)\s*m²', text)
                            if match:
                                area_num = int(match.group(1))
                                area_str = f"{area_num} m²"
                                break
                except:
                    pass

            # Try to extract beds from page elements containing Chambre
            try:
                bed_elements = self.driver.find_elements(By.XPATH, "//*[contains(text(),'Chambre')]")
                for el in bed_elements[:5]:
                    text = el.text.strip()
                    if text:
                        match = re.search(r'(\d+)\s*Chambre', text, re.I)
                        if match:
                            beds = int(match.group(1))
                            break
            except:
                pass

            # Try to extract baths from page elements
            try:
                bath_elements = self.driver.find_elements(By.XPATH, "//*[contains(text(),'Salle') or contains(text(),'SDB')]")
                for el in bath_elements[:5]:
                    text = el.text.strip()
                    if text:
                        match = re.search(r'(\d+)\s*(?:Salle|SDB)', text, re.I)
                        if match:
                            baths = int(match.group(1))
                            break
            except:
                pass

            # Combine all text sources for extraction (fallback)
            combined_text = f"{title} {details_text} {description} {beds_text} {baths_text}"
            if not beds or not baths:
                b, bt = self._extract_beds_baths(combined_text)
                if not beds:
                    beds = b
                if not baths:
                    baths = bt

            # Images - Enhanced extraction for Mubawab gallery structure
            images = []

            # Mubawab-specific image selectors (ordered by priority)
            image_selectors = [
                # Mubawab gallery/slider selectors
                ".adGallery img",
                ".adImages img",
                ".sliderItem img",
                ".swiper-slide img",
                "[class*='gallery'] img",
                "[class*='slider'] img",
                ".carousel-item img",
                ".carousel img",
                # Thumbnail containers
                ".adThumbnails img",
                ".thumbnails img",
                "[class*='thumb'] img",
                # Image containers
                ".imageContainer img",
                ".adPhotoBlock img",
                ".photoBlock img",
                # Generic mubawab image pattern
                "img[src*='mubawab']",
                "img[data-src*='mubawab']",
                "img[data-lazy*='mubawab']",
                # Lightbox/modal images
                "[class*='lightbox'] img",
                "[class*='modal'] img",
            ]

            # Patterns to filter out non-property images
            excluded_patterns = [
                'logo', 'banner', 'icon', 'sprite', 'avatar', 'profile',
                'badge', 'button', 'arrow', 'loading', 'placeholder',
                'ad-', 'advertisement', 'promo', 'sponsor', 'partner',
                'watermark', 'flag', 'social', 'share', 'header', 'footer'
            ]

            for selector in image_selectors:
                try:
                    img_elements = self.driver.find_elements(By.CSS_SELECTOR, selector)
                    for img in img_elements:
                        # Try multiple attributes for image source (high-res first)
                        src = (
                            img.get_attribute("data-src") or
                            img.get_attribute("data-lazy") or
                            img.get_attribute("data-original") or
                            img.get_attribute("data-full") or
                            img.get_attribute("data-large") or
                            img.get_attribute("src")
                        )

                        if not src:
                            continue

                        # Must be from mubawab
                        if "mubawab" not in src:
                            continue

                        # Filter out excluded patterns (banners, logos, etc.)
                        src_lower = src.lower()
                        if any(pattern in src_lower for pattern in excluded_patterns):
                            continue

                        # Skip tiny images (likely icons or placeholders)
                        width = img.get_attribute("width")
                        height = img.get_attribute("height")
                        if width and height:
                            try:
                                if int(width) < 100 or int(height) < 100:
                                    continue
                            except:
                                pass

                        # Skip if already in list
                        if src in images:
                            continue

                        # Upgrade to high-resolution version
                        # Mubawab uses patterns like /320x240/, /640x480/, etc.
                        full_src = re.sub(r'/\d+x\d+/', '/800x600/', src)
                        # Also try other resolution patterns
                        full_src = re.sub(r'_\d+x\d+\.', '_800x600.', full_src)
                        full_src = re.sub(r'\?w=\d+', '?w=800', full_src)
                        full_src = re.sub(r'&h=\d+', '&h=600', full_src)

                        if full_src not in images:
                            images.append(full_src)
                except:
                    continue

            # Try to get images from JSON-LD structured data
            if not images or len(images) < 3:
                try:
                    scripts = self.driver.find_elements(By.CSS_SELECTOR, "script[type='application/ld+json']")
                    for script in scripts:
                        content = script.get_attribute("innerHTML")
                        if content and "image" in content:
                            # Extract image URLs from JSON-LD
                            img_matches = re.findall(r'"image"\s*:\s*"([^"]+)"', content)
                            for img_url in img_matches:
                                if "mubawab" in img_url and img_url not in images:
                                    images.append(img_url)
                            # Also try array format
                            img_array_matches = re.findall(r'"image"\s*:\s*\[([^\]]+)\]', content)
                            for match in img_array_matches:
                                urls = re.findall(r'"([^"]+)"', match)
                                for img_url in urls:
                                    if "mubawab" in img_url and img_url not in images:
                                        images.append(img_url)
                except:
                    pass

            # If no images found, try to get from og:image
            if not images:
                try:
                    og_image = self.driver.find_element(By.CSS_SELECTOR, "meta[property='og:image']")
                    og_src = og_image.get_attribute("content")
                    if og_src:
                        images.append(og_src)
                except:
                    pass

            # Also try twitter:image
            if not images:
                try:
                    tw_image = self.driver.find_element(By.CSS_SELECTOR, "meta[name='twitter:image']")
                    tw_src = tw_image.get_attribute("content")
                    if tw_src:
                        images.append(tw_src)
                except:
                    pass

            # Default image if none found
            if not images:
                images = ["https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=800"]

            main_image = images[0] if images else ""

            # Features - combine text-based extraction with page element extraction
            features = self._extract_features(f"{title} {description} {details_text}")

            # Also extract features from dedicated sections on the page
            page_features = self._extract_features_from_page(self.driver)
            for feature in page_features:
                if feature not in features:
                    features.append(feature)

            # Limit total features
            features = features[:15]

            # Smart tags
            smart_tags = self._extract_smart_tags(price_numeric, area_num, location)

            # Create property
            property_data = Property(
                id=self._generate_id(url),
                name=title,
                type=property_type,
                category=category,
                location=location,
                city=city,
                price=price_formatted,
                priceNumeric=price_numeric,
                beds=beds,
                baths=baths,
                area=area_str,
                areaNumeric=area_num,
                image=main_image,
                images=images[:10],  # Limit to 10 images
                features=features,
                smartTags=smart_tags,
                description=description[:1000] if description else "",
                url=url,
            )

            return property_data

        except Exception as e:
            self.errors.append({"url": url, "error": str(e)})
            return None

    def run(self):
        """Run the complete scraping process"""
        print("""
╔══════════════════════════════════════════════════════════════════════╗
║          MUBAWAB - AT HOME REAL ESTATE AGENCY SCRAPER                ║
║          Scraping all listings from the agency page                  ║
╚══════════════════════════════════════════════════════════════════════╝
        """)

        self.start()

        try:
            # Phase 1: Get all listing URLs
            urls = self.get_listing_urls()

            if not urls:
                print("No listings found!")
                return

            # Phase 2: Scrape each listing
            print(f"\n{'='*60}")
            print(f"SCRAPING {len(urls)} LISTINGS")
            print(f"{'='*60}")

            for i, url in enumerate(urls, 1):
                print(f"[{i}/{len(urls)}] Scraping... ", end="", flush=True)

                property_data = self.scrape_listing(url)

                if property_data:
                    self.properties.append(property_data)
                    print(f"✓ {property_data.type} | {property_data.category} | {property_data.price}")
                else:
                    print("✗ Failed")

                time.sleep(self.delay)

        finally:
            self.stop()

        # Summary
        sale_count = sum(1 for p in self.properties if p.category == "SALE")
        rent_count = sum(1 for p in self.properties if p.category == "RENT")

        print(f"\n{'='*60}")
        print(f"SCRAPING COMPLETE")
        print(f"{'='*60}")
        print(f"✓ Total scraped: {len(self.properties)}")
        print(f"  - SALE: {sale_count}")
        print(f"  - RENT: {rent_count}")
        print(f"✗ Errors: {len(self.errors)}")

        return self.properties

    def export_for_athome(self, output_path: str):
        """Export properties in the format expected by At Home app"""
        os.makedirs(os.path.dirname(output_path), exist_ok=True)

        data = {
            "metadata": {
                "totalProperties": len(self.properties),
                "saleCount": sum(1 for p in self.properties if p.category == "SALE"),
                "rentCount": sum(1 for p in self.properties if p.category == "RENT"),
                "source": "mubawab.ma",
                "agency": "At Home Real Estate Agency",
                "scrapedAt": datetime.now().isoformat(),
            },
            "properties": [asdict(p) for p in self.properties]
        }

        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

        print(f"\n✓ Exported to {output_path}")


def main():
    scraper = MubawabAtHomeScraper(headless=True, delay=2.0)
    scraper.run()

    # Export to the At Home app data folder
    output_paths = [
        "data/properties.json",
        "public/data/properties.json",
    ]

    for path in output_paths:
        scraper.export_for_athome(path)

    print("\n✓ Complete! Properties are ready for the At Home app.")


if __name__ == "__main__":
    main()
