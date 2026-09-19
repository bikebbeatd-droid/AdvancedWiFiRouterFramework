export interface WifiCapabilities {
  bands_2ghz: boolean;
  bands_5ghz: boolean;
  bands_6ghz: boolean;
  ap: boolean;
  sta: boolean;
  concurrent_ap_sta: boolean;
  mesh_80211s: boolean;
  ieee80211k: boolean;
  ieee80211v: boolean;
  ieee80211r: boolean;
}

export const defaultCapabilities: WifiCapabilities = {
  bands_2ghz: true,
  bands_5ghz: true,
  bands_6ghz: false,
  ap: true,
  sta: true,
  concurrent_ap_sta: true,
  mesh_80211s: true,
  ieee80211k: true,
  ieee80211v: true,
  ieee80211r: false,
};

export function supportedFeatures(cap: WifiCapabilities): string[] {
  return Object.entries(cap)
    .filter(([_, enabled]) => Boolean(enabled))
    .map(([name]) => name);
}
