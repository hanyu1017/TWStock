#!/usr/bin/env python3
"""
Stock data fetcher using yfinance
Fetches Taiwan stock data and other market indices
"""

import yfinance as yf
import json
import sys
from datetime import datetime

def get_taiwan_stock_symbol(stock_code):
    """Convert Taiwan stock code to yfinance symbol"""
    return f"{stock_code}.TW"

def get_stock_data(symbol):
    """Fetch stock data for a given symbol"""
    try:
        stock = yf.Ticker(symbol)
        info = stock.info
        hist = stock.history(period="1d")

        if hist.empty:
            # Try 5 days if 1 day is empty
            hist = stock.history(period="5d")

        if hist.empty:
            return None

        latest = hist.iloc[-1]

        data = {
            'symbol': symbol,
            'name': info.get('longName', info.get('shortName', symbol)),
            'currentPrice': float(latest['Close']),
            'previousClose': float(info.get('previousClose', latest['Close'])),
            'open': float(latest['Open']),
            'high': float(latest['High']),
            'low': float(latest['Low']),
            'volume': int(latest['Volume']),
            'marketCap': info.get('marketCap'),
            'pe': info.get('trailingPE'),
            'dividend': info.get('dividendYield'),
            'lastUpdated': datetime.now().isoformat()
        }

        # Calculate change
        data['change'] = data['currentPrice'] - data['previousClose']
        data['changePercent'] = (data['change'] / data['previousClose']) * 100 if data['previousClose'] != 0 else 0

        return data
    except Exception as e:
        print(f"Error fetching {symbol}: {str(e)}", file=sys.stderr)
        return None

def get_multiple_stocks(symbols):
    """Fetch data for multiple stocks"""
    results = []
    for symbol in symbols:
        data = get_stock_data(symbol)
        if data:
            results.append(data)
    return results

def get_market_indices():
    """Fetch major market indices including futures"""
    indices = {
        # Cash Indices
        '^TWII': {'name': '加權指數', 'country': 'TW', 'type': 'index'},
        '^DJI': {'name': '道瓊指數', 'country': 'US', 'type': 'index'},
        '^IXIC': {'name': '那斯達克', 'country': 'US', 'type': 'index'},
        '^GSPC': {'name': 'S&P 500', 'country': 'US', 'type': 'index'},
        '^N225': {'name': '日經指數', 'country': 'JP', 'type': 'index'},
        '^KS11': {'name': '韓國綜合', 'country': 'KR', 'type': 'index'},
        # Futures
        'ES=F': {'name': 'S&P期貨', 'country': 'US', 'type': 'futures'},
        'NQ=F': {'name': '那指期貨', 'country': 'US', 'type': 'futures'},
        'YM=F': {'name': '道瓊期貨', 'country': 'US', 'type': 'futures'},
        'NKD=F': {'name': '日經期貨', 'country': 'JP', 'type': 'futures'},
    }

    results = []
    for symbol, info in indices.items():
        try:
            ticker = yf.Ticker(symbol)
            hist = ticker.history(period="2d")

            if len(hist) < 2:
                continue

            latest = hist.iloc[-1]
            previous = hist.iloc[-2]

            data = {
                'symbol': symbol,
                'name': info['name'],
                'country': info['country'],
                'type': info['type'],
                'currentValue': float(latest['Close']),
                'previousClose': float(previous['Close']),
                'lastUpdated': datetime.now().isoformat()
            }

            data['change'] = data['currentValue'] - data['previousClose']
            data['changePercent'] = (data['change'] / data['previousClose']) * 100 if data['previousClose'] != 0 else 0

            results.append(data)
        except Exception as e:
            print(f"Error fetching index {symbol}: {str(e)}", file=sys.stderr)
            continue

    return results

def main():
    if len(sys.argv) < 2:
        print("Usage: python fetch_stock_data.py <command> [args...]", file=sys.stderr)
        sys.exit(1)

    command = sys.argv[1]

    if command == "stock":
        if len(sys.argv) < 3:
            print("Usage: python fetch_stock_data.py stock <symbol>", file=sys.stderr)
            sys.exit(1)
        symbol = sys.argv[2]
        data = get_stock_data(symbol)
        print(json.dumps(data))

    elif command == "stocks":
        if len(sys.argv) < 3:
            print("Usage: python fetch_stock_data.py stocks <symbol1> <symbol2> ...", file=sys.stderr)
            sys.exit(1)
        symbols = sys.argv[2:]
        data = get_multiple_stocks(symbols)
        print(json.dumps(data))

    elif command == "indices":
        data = get_market_indices()
        print(json.dumps(data))

    else:
        print(f"Unknown command: {command}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
