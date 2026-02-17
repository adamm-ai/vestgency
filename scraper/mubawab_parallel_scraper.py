#!/usr/bin/env python3
"""
Mubawab At Home Agency - Parallel Scraper
==========================================
Scrapes ALL 38 listings from At Home agency with 4 parallel instances
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
from concurrent.futures import ThreadPoolExecutor, as_completed
import threading

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.common.exceptions import TimeoutException, NoSuchElementException


# Thread-safe print
print_lock = threading.Lock()

def safe_print(*args, **kwargs):
    with print_lock:
        print(*args, **kwargs)


@dataclass
class Property:
    """Property data structure"""
    id: str
    name: str
    type: str
    category: str
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


class MubawabScraper:
    """Single instance scraper"""

    CATEGORY_MAP = {
        "à vendre": "SALE", "a vendre": "SALE", "vente": "SALE",
        "à louer": "RENT", "a louer": "RENT", "location": "RENT",
    }

    TYPE_MAP = {
        "appartement": "Appartement", "villa": "Villa", "maison": "Villa",
        "bureau": "Bureau", "local commercial": "Magasin", "magasin": "Magasin",
        "terrain": "Terrain", "studio": "Appartement", "duplex": "Appartement",
    }

    def __init__(self, instance_id: int):
        self.instance_id = instance_id
        self.driver = None
        self.wait = None

    def start(self):
        options = Options()
        options.add_argument("--headless=new")
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")
        options.add_argument("--disable-gpu")
        options.add_argument("--window-size=1920,1080")
        options.add_argument("--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36")
        options.add_argument("--disable-blink-features=AutomationControlled")
        options.add_experimental_option("excludeSwitches", ["enable-automation"])

        self.driver = webdriver.Chrome(options=options)
        self.driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
        self.wait = WebDriverWait(self.driver, 20)

    def stop(self):
        if self.driver:
            self.driver.quit()

    def _gen_id(self, url: str) -> str:
        return f"ATH-{hashlib.md5(url.encode()).hexdigest()[:8].upper()}"

    def _get_text(self, selectors: List[str]) -> str:
        for sel in selectors:
            try:
                el = self.driver.find_element(By.CSS_SELECTOR, sel)
                text = el.text.strip()
                if text:
                    return text
            except:
                continue
        return ""

    def _extract_price(self, text: str) -> tuple:
        if not text:
            return "Prix sur demande", 0
        nums = re.sub(r'[^\d]', '', text)
        try:
            n = int(nums)
            return f"{n:,} MAD".replace(",", " "), n
        except:
            return text, 0

    def _extract_area(self, text: str) -> tuple:
        match = re.search(r'(\d+)\s*m[²2]', text, re.I)
        if match:
            n = int(match.group(1))
            return f"{n} m²", n
        return "", 0

    def _extract_beds(self, text: str) -> int:
        match = re.search(r'(\d+)\s*ch', text, re.I)
        return int(match.group(1)) if match else 0

    def _extract_baths(self, text: str) -> int:
        match = re.search(r'(\d+)\s*sdb', text, re.I)
        return int(match.group(1)) if match else 0

    def _get_category(self, text: str) -> str:
        t = text.lower()
        for k, v in self.CATEGORY_MAP.items():
            if k in t:
                return v
        return "SALE"

    def _get_type(self, text: str) -> str:
        t = text.lower()
        for k, v in self.TYPE_MAP.items():
            if k in t:
                return v
        return "Appartement"

    def _get_features(self, text: str) -> List[str]:
        features = []
        keywords = {
            "terrasse": "Terrasse", "balcon": "Balcon", "jardin": "Jardin",
            "piscine": "Piscine", "garage": "Garage", "parking": "Parking",
            "meublé": "Meublé", "ascenseur": "Ascenseur", "climatisation": "Climatisation",
        }
        t = text.lower()
        for k, v in keywords.items():
            if k in t:
                features.append(v)
        return features

    def scrape(self, url: str) -> Optional[Property]:
        try:
            self.driver.get(url)
            time.sleep(2)

            # Title
            title = self._get_text([
                "h1.adTitle", "h1[class*='title']", ".adMainInfo h1", "h1"
            ]) or "Propriété"

            # Price
            price_text = self._get_text([".adPrice", "[class*='price']", ".priceBox"])
            price, price_num = self._extract_price(price_text)

            # Location
            location = self._get_text([
                ".adLocation", "[class*='location']", ".adAddress", ".locationInfos"
            ]) or "Casablanca"

            # Description
            desc = self._get_text([
                ".adDescription", ".adMainContent", "[class*='description']", ".contentBox"
            ]) or ""

            # Details text
            details = self._get_text([".adParams", "[class*='details']", ".characteristics"]) or ""
            full_text = f"{title} {details} {desc}"

            # Area
            area, area_num = self._extract_area(full_text)

            # Beds/Baths
            beds = self._extract_beds(full_text)
            baths = self._extract_baths(full_text)

            # Category & Type
            category = self._get_category(title)
            prop_type = self._get_type(title)

            # Images
            images = []
            for sel in [".adImages img", ".adGallery img", "[class*='gallery'] img", ".carousel img", "img[src*='mubawab']"]:
                try:
                    for img in self.driver.find_elements(By.CSS_SELECTOR, sel):
                        src = img.get_attribute("src") or img.get_attribute("data-src") or img.get_attribute("data-lazy")
                        if src and "mubawab" in src and src not in images:
                            # Get higher res
                            src = re.sub(r'/\d+x\d+/', '/800x600/', src)
                            images.append(src)
                except:
                    continue

            # Try og:image
            if not images:
                try:
                    og = self.driver.find_element(By.CSS_SELECTOR, "meta[property='og:image']")
                    src = og.get_attribute("content")
                    if src:
                        images.append(src)
                except:
                    pass

            # Default
            if not images:
                images = ["https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=800"]

            # Features
            features = self._get_features(full_text)

            # Smart tags
            smart_tags = []
            if price_num > 5000000:
                smart_tags.append("Luxe")
            if area_num > 200:
                smart_tags.append("Grande Surface")

            return Property(
                id=self._gen_id(url),
                name=title,
                type=prop_type,
                category=category,
                location=location,
                city="Casablanca",
                price=price,
                priceNumeric=price_num,
                beds=beds,
                baths=baths,
                area=area,
                areaNumeric=area_num,
                image=images[0],
                images=images[:10],
                features=features,
                smartTags=smart_tags,
                description=desc[:1000] if desc else "",
                url=url,
            )

        except Exception as e:
            safe_print(f"  [Instance {self.instance_id}] Error: {str(e)[:50]}")
            return None


def get_all_listing_urls() -> List[str]:
    """Get all listing URLs from agency page"""
    print("=" * 60)
    print("PHASE 1: DISCOVERING ALL LISTINGS")
    print("=" * 60)

    options = Options()
    options.add_argument("--headless=new")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36")

    driver = webdriver.Chrome(options=options)
    wait = WebDriverWait(driver, 20)

    urls = []
    base_url = "https://www.mubawab.ma/fr/b/7859/at-home-immobilier-real-estate-agency"

    try:
        page = 1
        while page <= 5:  # Max 5 pages
            url = base_url if page == 1 else f"{base_url}:p:{page}"
            print(f"Page {page}: ", end="", flush=True)

            driver.get(url)
            time.sleep(3)

            # Find listings
            page_urls = []
            selectors = [
                "a[href*='/fr/ad/']",
                ".listingBox a",
                ".adListItem a",
            ]

            for sel in selectors:
                try:
                    links = driver.find_elements(By.CSS_SELECTOR, sel)
                    for link in links:
                        href = link.get_attribute("href")
                        if href and "/fr/ad/" in href and href not in urls and href not in page_urls:
                            page_urls.append(href)
                except:
                    continue

            if not page_urls:
                print("No more listings")
                break

            urls.extend(page_urls)
            print(f"{len(page_urls)} found (Total: {len(urls)})")

            page += 1

    finally:
        driver.quit()

    print(f"\nTotal URLs discovered: {len(urls)}")
    return urls


def scrape_batch(urls: List[str], instance_id: int) -> List[Property]:
    """Scrape a batch of URLs with one instance"""
    scraper = MubawabScraper(instance_id)
    scraper.start()

    results = []
    for i, url in enumerate(urls):
        safe_print(f"  [Instance {instance_id}] [{i+1}/{len(urls)}] Scraping...")
        prop = scraper.scrape(url)
        if prop:
            results.append(prop)
            safe_print(f"  [Instance {instance_id}] ✓ {prop.type} | {prop.category} | {prop.price}")
        else:
            safe_print(f"  [Instance {instance_id}] ✗ Failed")
        time.sleep(1.5)

    scraper.stop()
    return results


def main():
    print("""
╔══════════════════════════════════════════════════════════════════════╗
║     MUBAWAB - AT HOME AGENCY PARALLEL SCRAPER (4 INSTANCES)          ║
╚══════════════════════════════════════════════════════════════════════╝
    """)

    # Get all URLs
    urls = get_all_listing_urls()

    if not urls:
        print("No listings found!")
        return

    # Split URLs into 4 batches
    num_instances = 4
    batch_size = len(urls) // num_instances + 1
    batches = [urls[i:i+batch_size] for i in range(0, len(urls), batch_size)]

    print(f"\n{'='*60}")
    print(f"PHASE 2: SCRAPING WITH {num_instances} PARALLEL INSTANCES")
    print(f"{'='*60}")
    print(f"Total URLs: {len(urls)}")
    for i, batch in enumerate(batches):
        print(f"  Instance {i+1}: {len(batch)} URLs")
    print()

    # Scrape in parallel
    all_properties = []

    with ThreadPoolExecutor(max_workers=num_instances) as executor:
        futures = {
            executor.submit(scrape_batch, batch, i+1): i
            for i, batch in enumerate(batches)
        }

        for future in as_completed(futures):
            instance = futures[future] + 1
            try:
                results = future.result()
                all_properties.extend(results)
                safe_print(f"\n[Instance {instance}] Completed: {len(results)} properties")
            except Exception as e:
                safe_print(f"\n[Instance {instance}] Error: {e}")

    # Summary
    sale = sum(1 for p in all_properties if p.category == "SALE")
    rent = sum(1 for p in all_properties if p.category == "RENT")

    print(f"\n{'='*60}")
    print("SCRAPING COMPLETE")
    print(f"{'='*60}")
    print(f"✓ Total: {len(all_properties)} properties")
    print(f"  - SALE: {sale}")
    print(f"  - RENT: {rent}")

    # Export
    data = {
        "metadata": {
            "totalProperties": len(all_properties),
            "saleCount": sale,
            "rentCount": rent,
            "source": "mubawab.ma",
            "agency": "At Home Real Estate Agency",
            "scrapedAt": datetime.now().isoformat(),
        },
        "properties": [asdict(p) for p in all_properties]
    }

    # Save to multiple locations
    paths = [
        "data/properties.json",
        "public/data/properties.json",
    ]

    for path in paths:
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"✓ Saved to {path}")

    print("\n✓ DONE! All properties scraped and saved.")


if __name__ == "__main__":
    main()
