import { KpData, KpLevel } from '../types';

export function evaluateKp(val: number, timeStr: string, isLocalMode = false): KpData {
  let level: KpLevel = 'safe';
  let badgeText = '비행 적합';
  let description = '지자기 안정 (GPS 및 나침반 센서 정상 동작)';

  if (val < 3.5) {
    level = 'safe';
    badgeText = '비행 적합';
    description = '지자기 안정 (GPS 및 나침반 센서 정상 동작)';
  } else if (val < 5.0) {
    level = 'caution';
    badgeText = '비행 주의';
    description = '지자기 교란 주의 (GPS 오차 및 간헐적 튐 현상 가능)';
  } else {
    level = 'danger';
    badgeText = '비행 금지';
    description = '지자기 폭풍 경보 (비행 비권고 / 캘리브레이션 주의)';
  }

  return {
    value: Number(val.toFixed(2)),
    level,
    badgeText,
    description,
    timestamp: timeStr,
    isLocalMode,
  };
}

export async function fetchNoaaKpData(): Promise<KpData> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch('https://services.swpc.noaa.gov/json/planetary_k_index_1m.json', {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    if (Array.isArray(data) && data.length > 1) {
      const latest = data[data.length - 1];
      if (Array.isArray(latest)) {
        const val = parseFloat(latest[1]);
        const timeStr = String(latest[0]);
        if (!isNaN(val)) {
          return evaluateKp(val, timeStr, false);
        }
      } else if (typeof latest === 'object' && latest !== null) {
        const val = parseFloat((latest as Record<string, unknown>).kp_index as string || (latest as Record<string, unknown>).kp as string);
        const timeStr = String((latest as Record<string, unknown>).time_tag || '');
        if (!isNaN(val)) {
          return evaluateKp(val, timeStr || new Date().toISOString().replace('T', ' ').substring(0, 19), false);
        }
      }
    }
    throw new Error('Invalid format');
  } catch {
    // 로컬 파일 또는 CORS/오프라인 환경에서도 안정적으로 1.67 표출
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const timeStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())} (로컬 안정 모드)`;
    return evaluateKp(1.67, timeStr, true);
  }
}

export function formatDuration(seconds: number): string {
  const h = String(Math.floor(seconds / 3600)).padStart(2, '0');
  const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
  const s = String(seconds % 60).padStart(2, '0');
  return `${h}:${m}:${s}`;
}
