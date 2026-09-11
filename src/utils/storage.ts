import { Equipment, FlightLogRecord } from '../types';

const STORAGE_LOGS_KEY = 'skylog_pro_flight_logs_v1';
const STORAGE_EQUIPMENT_KEY = 'skylog_pro_equipment_v1';

export const DEFAULT_EQUIPMENT: Equipment = {
  droneModel: 'Standard Hexa-Drone A1',
  batteryModel: 'LiPo 6S 5000mAh (#BAT-01)',
  batteryCapacityMah: 5000,
};

const SAMPLE_LOGS: FlightLogRecord[] = [
  {
    id: 'log-1726021000',
    date: '2026-09-10 16:45',
    timestampMs: Date.now() - 1000 * 60 * 60 * 3,
    droneModel: 'Standard Hexa-Drone A1',
    batteryModel: 'LiPo 6S 5000mAh (#BAT-01)',
    durationSeconds: 945, // 15m 45s
    durationFormatted: '00:15:45',
    startBattery: 100,
    endBattery: 32,
    consumedBattery: 68,
    kpValue: 1.33,
    kpStatus: '비행 적합',
    location: '한강 드론 공원 (A구역)',
    notes: 'GPS 고도 유지 양호, 미풍(1.8m/s). 호버링 및 경로 비행 테스트 완료',
  },
  {
    id: 'log-1725934000',
    date: '2026-09-09 14:20',
    timestampMs: Date.now() - 1000 * 60 * 60 * 28,
    droneModel: 'Standard Hexa-Drone A1',
    batteryModel: 'LiPo 6S 5000mAh (#BAT-02)',
    durationSeconds: 1220, // 20m 20s
    durationFormatted: '00:20:20',
    startBattery: 98,
    endBattery: 22,
    consumedBattery: 76,
    kpValue: 2.00,
    kpStatus: '비행 적합',
    location: '시흥 드론 전용 비행장',
    notes: '배터리 25% 저전압 경보 정상 작동 확인 후 안전 착륙.',
  },
];

export function getStoredLogs(): FlightLogRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_LOGS_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_LOGS_KEY, JSON.stringify(SAMPLE_LOGS));
      return SAMPLE_LOGS;
    }
    return JSON.parse(raw);
  } catch {
    return SAMPLE_LOGS;
  }
}

export function saveFlightLog(record: FlightLogRecord): FlightLogRecord[] {
  try {
    const existing = getStoredLogs();
    const updated = [record, ...existing];
    localStorage.setItem(STORAGE_LOGS_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

export function deleteFlightLog(id: string): FlightLogRecord[] {
  try {
    const existing = getStoredLogs();
    const updated = existing.filter((item) => item.id !== id);
    localStorage.setItem(STORAGE_LOGS_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

export function getStoredEquipment(): Equipment {
  try {
    const raw = localStorage.getItem(STORAGE_EQUIPMENT_KEY);
    if (!raw) return DEFAULT_EQUIPMENT;
    return JSON.parse(raw);
  } catch {
    return DEFAULT_EQUIPMENT;
  }
}

export function saveEquipment(eq: Equipment): void {
  try {
    localStorage.setItem(STORAGE_EQUIPMENT_KEY, JSON.stringify(eq));
  } catch {
    // Ignore storage quota
  }
}
