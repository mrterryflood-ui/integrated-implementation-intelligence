"""Read report links carried by retained originals; preserve contemporary receipts.

Retrieved definitions are current observations, not proof of historic availability.
This script performs public GET requests only and does not alter the archive.
"""
from pathlib import Path
from zipfile import ZipFile
from html import unescape
import concurrent.futures
import datetime
import hashlib
import json
import re
import urllib.error
import urllib.parse
import urllib.request


def retrieve(key, url, destination):
    receipt = {'id': key, 'url': url, 'retrieved_at': datetime.datetime.now(datetime.timezone.utc).isoformat(),
               'historical_definition_availability_proven': False}
    try:
        with urllib.request.urlopen(url, timeout=20) as response:
            raw = response.read()
            receipt.update(http_status=response.status, final_url=response.url,
                           content_type=response.headers.get('content-type'), bytes=len(raw))
            suffix = '.csv' if 'export' in key else '.html'
            path = destination / (key + suffix)
            path.write_bytes(raw)
            receipt.update(path=path.name, sha256=hashlib.sha256(raw).hexdigest())
    except urllib.error.HTTPError as error:
        receipt.update(http_status=error.code, error=str(error))
    except Exception as error:
        receipt.update(error=repr(error))
    return receipt


if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('archive')
    parser.add_argument('--out', required=True)
    args = parser.parse_args()
    destination = Path(args.out)
    destination.mkdir(parents=True, exist_ok=True)
    jobs = []
    with ZipFile(args.archive) as archive:
        for stem in ('hinds_all', 'hinds_late', 'harris_all', 'harris_late'):
            html = archive.read('originals/' + stem + '.html').decode()
            links = re.findall(r'<a[^>]+href=[\"\']([^\"\']+)[\"\'][^>]*>(.*?)</a>', html, re.S)
            exports = {unescape(url) for url, label in links if 'Export Data' in label}
            if len(exports) != 1:
                raise ValueError('Ambiguous export link in original ' + stem)
            jobs.append((stem + '_export', urllib.parse.urljoin('https://statecancerprofiles.cancer.gov', exports.pop())))
    jobs.extend([
        ('standard20', 'https://seer.cancer.gov/stdpopulations/stdpop.20ages.html'),
        ('standard19', 'https://seer.cancer.gov/stdpopulations/stdpop.19ages.html')])
    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
        receipts = list(pool.map(lambda job: retrieve(*job, destination), jobs))
    (destination / 'export_and_standard_retrieval_receipt.json').write_text(json.dumps(receipts, indent=2) + '\n')
    print(json.dumps(receipts, indent=2))
