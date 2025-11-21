#!/usr/bin/env python3
"""
Fetch institutional trading data (三大法人) from Taiwan Stock Exchange
"""

import requests
import json
import sys
from datetime import datetime, timedelta
import re

def get_institutional_trades(date_str=None):
    """
    Fetch institutional trading data from TWSE
    Args:
        date_str: Date in YYYYMMDD format. If None, uses latest trading day
    Returns:
        List of institutional trading data
    """
    if date_str is None:
        # Use today or latest trading day
        date = datetime.now()
    else:
        date = datetime.strptime(date_str, '%Y%m%d')

    # Convert to ROC year format (民國年)
    roc_year = date.year - 1911
    date_param = f"{roc_year}/{date.month:02d}/{date.day:02d}"

    url = "https://www.twse.com.tw/fund/T86"

    params = {
        'response': 'json',
        'date': date_param,
        'selectType': 'ALL'
    }

    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }

    try:
        response = requests.get(url, params=params, headers=headers, timeout=10)
        response.raise_for_status()
        data = response.json()

        if data.get('stat') != 'OK':
            print(f"API returned non-OK status: {data.get('stat')}", file=sys.stderr)
            return []

        if 'data' not in data or not data['data']:
            print("No data available for the specified date", file=sys.stderr)
            return []

        results = []
        for row in data['data']:
            # Row format: [股票代號, 股票名稱, 外資買賣超, 投信買賣超, 自營商買賣超, 三大法人合計, ...]
            if len(row) < 6:
                continue

            try:
                stock_code = row[0].strip()
                stock_name = row[1].strip()

                # Remove commas and convert to integer
                foreign = int(row[2].replace(',', '')) if row[2] != '-' else 0
                trust = int(row[3].replace(',', '')) if row[3] != '-' else 0
                dealer = int(row[4].replace(',', '')) if row[4] != '-' else 0
                total = int(row[5].replace(',', '')) if row[5] != '-' else 0

                results.append({
                    'symbol': f"{stock_code}.TW",
                    'stockCode': stock_code,
                    'stockName': stock_name,
                    'date': date.strftime('%Y-%m-%d'),
                    'foreignInvestor': foreign,
                    'investmentTrust': trust,
                    'dealer': dealer,
                    'total': total
                })
            except (ValueError, IndexError) as e:
                continue

        return results

    except requests.RequestException as e:
        print(f"Error fetching institutional trades: {str(e)}", file=sys.stderr)
        return []
    except Exception as e:
        print(f"Unexpected error: {str(e)}", file=sys.stderr)
        return []

def get_institutional_trade_for_stock(stock_code, date_str=None):
    """
    Get institutional trading data for a specific stock
    Args:
        stock_code: Stock code (e.g., "2330")
        date_str: Date in YYYYMMDD format
    Returns:
        Institutional trading data for the stock
    """
    all_trades = get_institutional_trades(date_str)

    for trade in all_trades:
        if trade['stockCode'] == stock_code:
            return trade

    return None

def main():
    if len(sys.argv) < 2:
        print("Usage: python fetch_institutional_trades.py <command> [args...]", file=sys.stderr)
        sys.exit(1)

    command = sys.argv[1]

    if command == "all":
        # Fetch all institutional trades for the date
        date_str = sys.argv[2] if len(sys.argv) > 2 else None
        data = get_institutional_trades(date_str)
        print(json.dumps(data, ensure_ascii=False))

    elif command == "stock":
        # Fetch institutional trades for a specific stock
        if len(sys.argv) < 3:
            print("Usage: python fetch_institutional_trades.py stock <stock_code> [date]", file=sys.stderr)
            sys.exit(1)

        stock_code = sys.argv[2]
        date_str = sys.argv[3] if len(sys.argv) > 3 else None
        data = get_institutional_trade_for_stock(stock_code, date_str)
        print(json.dumps(data, ensure_ascii=False))

    else:
        print(f"Unknown command: {command}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
