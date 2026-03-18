export const MARKET_ITEMS = [
  { id: "KOSPI",  label: "KOSPI",   type: "index",                  defaultOn: true  },
  { id: "KOSDAQ", label: "KOSDAQ",  type: "index",                  defaultOn: true  },
  { id: "SP500",  label: "S&P500",  type: "index",                  defaultOn: true  },
  { id: "NASDAQ", label: "NASDAQ",  type: "index",                  defaultOn: true  },
  { id: "DOW",    label: "다우",    type: "index",                  defaultOn: false },
  { id: "USD",    label: "USD/KRW", type: "fx", currency: "USD",   defaultOn: true  },
  { id: "JPY",    label: "JPY/KRW", type: "fx", currency: "JPY",   defaultOn: true  },
  { id: "EUR",    label: "EUR/KRW", type: "fx", currency: "EUR",   defaultOn: false },
  { id: "CNY",    label: "CNY/KRW", type: "fx", currency: "CNY",   defaultOn: false },
  { id: "GBP",    label: "GBP/KRW", type: "fx", currency: "GBP",   defaultOn: false },
];

const LS_KEY = "market_overview_enabled";

function getDefaults() {
  return Object.fromEntries(MARKET_ITEMS.map((i) => [i.id, i.defaultOn]));
}

export function loadMarketSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(LS_KEY) || "{}");
    return { ...getDefaults(), ...saved };
  } catch {
    return getDefaults();
  }
}

export function saveMarketSettings(settings) {
  localStorage.setItem(LS_KEY, JSON.stringify(settings));
}
