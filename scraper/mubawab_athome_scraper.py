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
        """Extract price and numeric value"""
        if not price_text:
            return "Prix sur demande", 0

        # Clean and extract number
        price_clean = re.sub(r'[^\d]', '', price_text)
        try:
            price_num = int(price_clean)
            # Format price
            if price_num >= 1000000:
                price_formatted = f"{price_num:,} MAD".replace(",", " ")
            else:
                price_formatted = f"{price_num:,} MAD".replace(",", " ")
            return price_formatted, price_num
        except ValueError:
            return price_text.strip(), 0

    def _extract_area(self, text: str) -> tuple:
        """Extract area from text"""
        if not text:
            return "", 0

        patterns = [
            r'(\d+(?:\s*\d+)?)\s*m[²2]',
            r'(\d+(?:\s*\d+)?)\s*m2',
        ]

        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                area_str = match.group(1).replace(" ", "")
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

        # Bedrooms
        bed_patterns = [
            r'(\d+)\s*ch(?:ambre)?s?',
            r'(\d+)\s*pi[èe]ces?',
        ]
        for pattern in bed_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                beds = int(match.group(1))
                break

        # Bathrooms
        bath_patterns = [
            r'(\d+)\s*sdb',
            r'(\d+)\s*salle[s]?\s*de\s*bain',
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
        """Extract features from text"""
        features = []
        feature_keywords = {
            "terrasse": "Terrasse",
            "balcon": "Balcon",
            "jardin": "Jardin",
            "piscine": "Piscine",
            "garage": "Garage",
            "parking": "Parking",
            "meublé": "Meublé",
            "meuble": "Meublé",
            "neuf": "Neuf",
            "rénové": "Rénové",
            "vue mer": "Vue Mer",
            "ascenseur": "Ascenseur",
            "gardien": "Gardien",
            "sécurisé": "Sécurisé",
            "climatisation": "Climatisation",
            "cave": "Cave",
            "cuisine équipée": "Cuisine Équipée",
        }

        text_lower = text.lower()
        for keyword, feature in feature_keywords.items():
            if keyword in text_lower:
                features.append(feature)

        return features

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

            # Price
            price_text = self._safe_get_text(self.driver, [
                ".adPrice",
                "[class*='price']",
                ".priceBox",
            ])
            price_formatted, price_numeric = self._extract_price(price_text)

            # Location
            location = self._safe_get_text(self.driver, [
                ".adLocation",
                "[class*='location']",
                ".adAddress",
            ]) or "Casablanca"

            # Description
            description = self._safe_get_text(self.driver, [
                ".adDescription",
                ".adMainContent",
                "[class*='description']",
                ".adText",
            ]) or ""

            # Category (SALE/RENT)
            category_text = self._safe_get_text(self.driver, [
                ".adCategory",
                "[class*='type']",
            ]) or title
            category = self._determine_category(f"{title} {category_text}")

            # Property type
            property_type = self._determine_type(title)

            # Area
            area_text = self._safe_get_text(self.driver, [
                "[class*='area']",
                "[class*='surface']",
                ".adParams",
            ]) or ""
            area_str, area_num = self._extract_area(f"{title} {area_text} {description}")

            # Beds and Baths
            details_text = self._safe_get_text(self.driver, [
                ".adParams",
                "[class*='details']",
                ".characteristics",
            ]) or ""
            beds, baths = self._extract_beds_baths(f"{title} {details_text} {description}")

            # Images
            images = []
            image_selectors = [
                ".adImages img",
                ".adGallery img",
                "[class*='gallery'] img",
                ".carousel img",
                "img[src*='mubawab']",
            ]

            for selector in image_selectors:
                try:
                    img_elements = self.driver.find_elements(By.CSS_SELECTOR, selector)
                    for img in img_elements:
                        src = img.get_attribute("src") or img.get_attribute("data-src")
                        if src and "mubawab" in src and src not in images:
                            # Get full resolution image
                            full_src = re.sub(r'/\d+x\d+/', '/800x600/', src)
                            images.append(full_src)
                except:
                    continue

            # If no images found, try to get from og:image
            if not images:
                try:
                    og_image = self.driver.find_element(By.CSS_SELECTOR, "meta[property='og:image']")
                    og_src = og_image.get_attribute("content")
                    if og_src:
                        images.append(og_src)
                except:
                    pass

            # Default image if none found
            if not images:
                images = ["https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=800"]

            main_image = images[0] if images else ""

            # Features
            features = self._extract_features(f"{title} {description} {details_text}")

            # Smart tags
            smart_tags = self._extract_smart_tags(price_numeric, area_num, location)

            # Create property
            property_data = Property(
                id=self._generate_id(url),
                name=title,
                type=property_type,
                category=category,
                location=location,
                city="Casablanca",
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
