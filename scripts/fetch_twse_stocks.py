#!/usr/bin/env python3
"""
Fetch all Taiwan stock list from TWSE (Taiwan Stock Exchange)
Downloads complete list of TWSE and TPEX stocks
"""

import requests
import json
import sys

def fetch_twse_stocks():
    """Fetch all TWSE (上市) stocks"""
    url = "https://isin.twse.com.tw/isin/C_public.jsp?strMode=2"

    try:
        response = requests.get(url, timeout=10)
        response.encoding = 'big5'

        stocks = []
        lines = response.text.split('\n')

        for line in lines:
            if '<td' in line and '股票' in line:
                # Parse HTML table data
                parts = line.split('</td>')
                if len(parts) >= 2:
                    # Extract stock code and name
                    code_name = parts[0].replace('<td class="h4">', '').replace('<td>', '').strip()
                    if '\u3000' in code_name or ' ' in code_name:
                        split_char = '\u3000' if '\u3000' in code_name else ' '
                        code, name = code_name.split(split_char, 1)

                        # Only include numeric codes (stocks)
                        if code.isdigit() and len(code) == 4:
                            stocks.append({
                                'code': code,
                                'name': name.strip(),
                                'market': 'TWSE',
                                'type': 'stock'
                            })

        return stocks
    except Exception as e:
        print(f"Error fetching TWSE stocks: {str(e)}", file=sys.stderr)
        return []

def fetch_tpex_stocks():
    """Fetch all TPEX (上櫃) stocks"""
    url = "https://isin.twse.com.tw/isin/C_public.jsp?strMode=4"

    try:
        response = requests.get(url, timeout=10)
        response.encoding = 'big5'

        stocks = []
        lines = response.text.split('\n')

        for line in lines:
            if '<td' in line and '股票' in line:
                parts = line.split('</td>')
                if len(parts) >= 2:
                    code_name = parts[0].replace('<td class="h4">', '').replace('<td>', '').strip()
                    if '\u3000' in code_name or ' ' in code_name:
                        split_char = '\u3000' if '\u3000' in code_name else ' '
                        code, name = code_name.split(split_char, 1)

                        if len(code) == 4 and code.isdigit():
                            stocks.append({
                                'code': code,
                                'name': name.strip(),
                                'market': 'TPEX',
                                'type': 'stock'
                            })

        return stocks
    except Exception as e:
        print(f"Error fetching TPEX stocks: {str(e)}", file=sys.stderr)
        return []

def fetch_etfs():
    """Fetch all ETFs"""
    # TWSE ETFs
    url = "https://isin.twse.com.tw/isin/C_public.jsp?strMode=2"

    try:
        response = requests.get(url, timeout=10)
        response.encoding = 'big5'

        etfs = []
        lines = response.text.split('\n')

        for line in lines:
            if '<td' in line and 'ETF' in line:
                parts = line.split('</td>')
                if len(parts) >= 2:
                    code_name = parts[0].replace('<td class="h4">', '').replace('<td>', '').strip()
                    if '\u3000' in code_name or ' ' in code_name:
                        split_char = '\u3000' if '\u3000' in code_name else ' '
                        code, name = code_name.split(split_char, 1)

                        etfs.append({
                            'code': code,
                            'name': name.strip(),
                            'market': 'TWSE',
                            'type': 'etf'
                        })

        return etfs
    except Exception as e:
        print(f"Error fetching ETFs: {str(e)}", file=sys.stderr)
        return []

def main():
    if len(sys.argv) < 2:
        print("Usage: python fetch_twse_stocks.py <command>", file=sys.stderr)
        print("Commands: all, twse, tpex, etf", file=sys.stderr)
        sys.exit(1)

    command = sys.argv[1]

    if command == "all":
        twse = fetch_twse_stocks()
        tpex = fetch_tpex_stocks()
        etfs = fetch_etfs()
        all_stocks = twse + tpex + etfs
        print(json.dumps(all_stocks, ensure_ascii=False))

    elif command == "twse":
        stocks = fetch_twse_stocks()
        print(json.dumps(stocks, ensure_ascii=False))

    elif command == "tpex":
        stocks = fetch_tpex_stocks()
        print(json.dumps(stocks, ensure_ascii=False))

    elif command == "etf":
        etfs = fetch_etfs()
        print(json.dumps(etfs, ensure_ascii=False))

    else:
        print(f"Unknown command: {command}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
