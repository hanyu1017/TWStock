/**
 * Comprehensive Taiwan Stock Market Database
 * Including: Listed stocks, OTC stocks, ETFs, and popular warrants
 */

export interface StockInfo {
  code: string;
  name: string;
  type: 'stock' | 'etf' | 'warrant';
  market: 'TWSE' | 'TPEX'; // TWSE = 上市, TPEX = 上櫃
}

export const TAIWAN_STOCKS: StockInfo[] = [
  // === 上市股票 (TWSE Listed Stocks) ===
  // 半導體
  { code: '2330', name: '台積電', type: 'stock', market: 'TWSE' },
  { code: '2303', name: '聯電', type: 'stock', market: 'TWSE' },
  { code: '2454', name: '聯發科', type: 'stock', market: 'TWSE' },
  { code: '2379', name: '瑞昱', type: 'stock', market: 'TWSE' },
  { code: '3034', name: '聯詠', type: 'stock', market: 'TWSE' },
  { code: '2408', name: '南亞科', type: 'stock', market: 'TWSE' },
  { code: '3661', name: '世芯-KY', type: 'stock', market: 'TWSE' },
  { code: '2449', name: '京元電子', type: 'stock', market: 'TWSE' },
  { code: '2301', name: '光寶科', type: 'stock', market: 'TWSE' },
  { code: '2327', name: '國巨', type: 'stock', market: 'TWSE' },

  // 電腦及週邊設備
  { code: '2382', name: '廣達', type: 'stock', market: 'TWSE' },
  { code: '2357', name: '華碩', type: 'stock', market: 'TWSE' },
  { code: '3231', name: '緯創', type: 'stock', market: 'TWSE' },
  { code: '2353', name: '宏碁', type: 'stock', market: 'TWSE' },
  { code: '3045', name: '台灣大', type: 'stock', market: 'TWSE' },

  // 電子零組件
  { code: '2317', name: '鴻海', type: 'stock', market: 'TWSE' },
  { code: '3008', name: '大立光', type: 'stock', market: 'TWSE' },
  { code: '2308', name: '台達電', type: 'stock', market: 'TWSE' },
  { code: '6505', name: '台塑化', type: 'stock', market: 'TWSE' },
  { code: '2324', name: '仁寶', type: 'stock', market: 'TWSE' },

  // 光電
  { code: '2409', name: '友達', type: 'stock', market: 'TWSE' },
  { code: '3481', name: '群創', type: 'stock', market: 'TWSE' },

  // 通信網路
  { code: '2412', name: '中華電', type: 'stock', market: 'TWSE' },
  { code: '4904', name: '遠傳', type: 'stock', market: 'TWSE' },

  // 金融保險
  { code: '2882', name: '國泰金', type: 'stock', market: 'TWSE' },
  { code: '2881', name: '富邦金', type: 'stock', market: 'TWSE' },
  { code: '2886', name: '兆豐金', type: 'stock', market: 'TWSE' },
  { code: '2891', name: '中信金', type: 'stock', market: 'TWSE' },
  { code: '2884', name: '玉山金', type: 'stock', market: 'TWSE' },
  { code: '2892', name: '第一金', type: 'stock', market: 'TWSE' },
  { code: '2883', name: '開發金', type: 'stock', market: 'TWSE' },
  { code: '2880', name: '華南金', type: 'stock', market: 'TWSE' },
  { code: '5880', name: '合庫金', type: 'stock', market: 'TWSE' },
  { code: '2885', name: '元大金', type: 'stock', market: 'TWSE' },
  { code: '2887', name: '台新金', type: 'stock', market: 'TWSE' },
  { code: '2890', name: '永豐金', type: 'stock', market: 'TWSE' },

  // 航運
  { code: '2603', name: '長榮', type: 'stock', market: 'TWSE' },
  { code: '2609', name: '陽明', type: 'stock', market: 'TWSE' },
  { code: '2615', name: '萬海', type: 'stock', market: 'TWSE' },
  { code: '2618', name: '長榮航', type: 'stock', market: 'TWSE' },

  // 塑膠
  { code: '1301', name: '台塑', type: 'stock', market: 'TWSE' },
  { code: '1303', name: '南亞', type: 'stock', market: 'TWSE' },
  { code: '1326', name: '台化', type: 'stock', market: 'TWSE' },

  // 鋼鐵
  { code: '2002', name: '中鋼', type: 'stock', market: 'TWSE' },
  { code: '2027', name: '大成鋼', type: 'stock', market: 'TWSE' },

  // 食品
  { code: '1216', name: '統一', type: 'stock', market: 'TWSE' },
  { code: '1101', name: '台泥', type: 'stock', market: 'TWSE' },

  // 汽車
  { code: '2207', name: '和泰車', type: 'stock', market: 'TWSE' },
  { code: '2201', name: '裕隆', type: 'stock', market: 'TWSE' },

  // 工業
  { code: '2395', name: '研華', type: 'stock', market: 'TWSE' },

  // 生技醫療
  { code: '4123', name: '晟德', type: 'stock', market: 'TWSE' },
  { code: '6446', name: '藥華藥', type: 'stock', market: 'TWSE' },

  // === ETF (Exchange Traded Funds) ===
  // 國內成分股ETF
  { code: '0050', name: '元大台灣50', type: 'etf', market: 'TWSE' },
  { code: '0056', name: '元大高股息', type: 'etf', market: 'TWSE' },
  { code: '00878', name: '國泰永續高股息', type: 'etf', market: 'TWSE' },
  { code: '00919', name: '群益台灣精選高息', type: 'etf', market: 'TWSE' },
  { code: '00929', name: '復華台灣科技優息', type: 'etf', market: 'TWSE' },
  { code: '00713', name: '元大台灣高息低波', type: 'etf', market: 'TWSE' },
  { code: '006208', name: '富邦台50', type: 'etf', market: 'TWSE' },
  { code: '00692', name: '富邦公司治理', type: 'etf', market: 'TWSE' },
  { code: '00850', name: '元大臺灣ESG永續', type: 'etf', market: 'TWSE' },
  { code: '00888', name: '永豐台灣ESG', type: 'etf', market: 'TWSE' },
  { code: '00891', name: '中信關鍵半導體', type: 'etf', market: 'TWSE' },
  { code: '00881', name: '國泰台灣5G+', type: 'etf', market: 'TWSE' },
  { code: '00757', name: '統一FANG+', type: 'etf', market: 'TWSE' },
  { code: '00662', name: '富邦NASDAQ', type: 'etf', market: 'TWSE' },
  { code: '00885', name: '富邦越南', type: 'etf', market: 'TWSE' },
  { code: '00830', name: '國泰費城半導體', type: 'etf', market: 'TWSE' },
  { code: '00757', name: '統一FANG+', type: 'etf', market: 'TWSE' },
  { code: '0052', name: '富邦科技', type: 'etf', market: 'TWSE' },
  { code: '0051', name: '元大中型100', type: 'etf', market: 'TWSE' },
  { code: '00631L', name: '元大台灣50正2', type: 'etf', market: 'TWSE' },
  { code: '00632R', name: '元大台灣50反1', type: 'etf', market: 'TWSE' },
  { code: '00690', name: '兆豐藍籌30', type: 'etf', market: 'TWSE' },
  { code: '00733', name: '富邦臺灣中小', type: 'etf', market: 'TWSE' },

  // 債券ETF
  { code: '00679B', name: '元大美債20年', type: 'etf', market: 'TWSE' },
  { code: '00687B', name: '國泰20年美債', type: 'etf', market: 'TWSE' },
  { code: '00751B', name: '元大AAA至A公司債', type: 'etf', market: 'TWSE' },
  { code: '00725B', name: '國泰投資級公司債', type: 'etf', market: 'TWSE' },

  // === 上櫃股票 (TPEX OTC Stocks) ===
  { code: '5274', name: '信驊', type: 'stock', market: 'TPEX' },
  { code: '6669', name: '緯穎', type: 'stock', market: 'TPEX' },
  { code: '3707', name: '漢磊', type: 'stock', market: 'TPEX' },
  { code: '4904', name: '遠傳', type: 'stock', market: 'TPEX' },
  { code: '4977', name: '眾達-KY', type: 'stock', market: 'TPEX' },
  { code: '6412', name: '群電', type: 'stock', market: 'TPEX' },
  { code: '4147', name: '中裕', type: 'stock', market: 'TPEX' },
  { code: '6547', name: '高端疫苗', type: 'stock', market: 'TPEX' },

  // === 熱門認購權證 (Popular Warrants - Sample) ===
  { code: '070001', name: '台積電認購01', type: 'warrant', market: 'TWSE' },
  { code: '070002', name: '鴻海認購01', type: 'warrant', market: 'TWSE' },
  { code: '070003', name: '聯發科認購01', type: 'warrant', market: 'TWSE' },
];

// Create search index for faster lookup
const searchIndex = TAIWAN_STOCKS.map(stock => ({
  ...stock,
  searchKey: `${stock.code} ${stock.name}`.toLowerCase(),
}));

/**
 * Search Taiwan stocks by code or name
 * @param query Search query (code or name)
 * @param limit Maximum number of results (default: 20)
 * @returns Array of matching stocks
 */
export function searchTaiwanStocks(
  query: string,
  limit: number = 20
): { code: string; name: string; type: string; market: string }[] {
  if (!query || query.trim().length === 0) {
    return [];
  }

  const lowerQuery = query.toLowerCase().trim();

  // Find matches
  const matches = searchIndex.filter(stock =>
    stock.code.includes(lowerQuery) || stock.name.includes(lowerQuery)
  );

  // Sort by relevance (exact code match first, then starts with, then contains)
  matches.sort((a, b) => {
    const aCode = a.code.toLowerCase();
    const bCode = b.code.toLowerCase();
    const aName = a.name.toLowerCase();
    const bName = b.name.toLowerCase();

    // Exact code match
    if (aCode === lowerQuery) return -1;
    if (bCode === lowerQuery) return 1;

    // Code starts with query
    if (aCode.startsWith(lowerQuery) && !bCode.startsWith(lowerQuery)) return -1;
    if (bCode.startsWith(lowerQuery) && !aCode.startsWith(lowerQuery)) return 1;

    // Name starts with query
    if (aName.startsWith(lowerQuery) && !bName.startsWith(lowerQuery)) return -1;
    if (bName.startsWith(lowerQuery) && !aName.startsWith(lowerQuery)) return 1;

    // Alphabetical
    return aCode.localeCompare(bCode);
  });

  return matches.slice(0, limit).map(({ code, name, type, market }) => ({
    code,
    name,
    type,
    market,
  }));
}
