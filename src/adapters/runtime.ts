import { OpenWrtAdapter } from "./openwrt.js";
import { SafeCommandRunner } from "./runner.js";

export interface HardwareRuntime {
  enabled: boolean;
  adapter: OpenWrtAdapter | null;
  reason?: string;
}

export function createHardwareRuntime(): HardwareRuntime {
  const enabled = process.env.HARDWARE_ADAPTER === "openwrt";
  if (!enabled) return { enabled: false, adapter: null, reason: "Hardware adapter disabled" };
  return { enabled: true, adapter: new OpenWrtAdapter(new SafeCommandRunner()) };
}
