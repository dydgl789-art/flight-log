import { WeatherData, WindLevel } from '../types';

export const PRESET_LOCATIONS = [
  { name: '서울 한강 드론공원 (광나루)', lat: 37.5512, lng: 127.1265 },
  { name: '고양 대덕 한강 드론공원', lat: 37.5872, lng: 126.8375 },
  { name: '시흥 배곧 드론비행장', lat: 37.3712, lng: 126.7212 },
  { name: '서울 용산 대통령실 일대', lat: 37.5342, lng: 126.9782 },
  { name: '김포국제공항 일대', lat: 37.5583, lng: 126.7906 },
  { name: '대전 갑천 드론공원', lat: 36.3685, lng: 127.3789 },
  { name: '부산 해운대 해변', lat: 35.1587, lng: 129.1604 },
  { name: '제주공항 일대', lat: 33.5113, lng: 126.4930 },
];

function getWindDirectionKorean(deg: number): string {
  const directions = [
    '북풍 (N)',
    '북북동풍 (NNE)',
    '북동풍 (NE)',
    '동북동풍 (ENE)',
    '동풍 (E)',
    '동남동풍 (ESE)',
    '남동풍 (SE)',
    '남남동풍 (SSE)',
    '남풍 (S)',
    '남남서풍 (SSW)',
    '남서풍 (SW)',
    '서남서풍 (WSW)',
    '서풍 (W)',
    '서북서풍 (WNW)',
    '북서풍 (NW)',
    '북북서풍 (NNW)',
  ];
  const idx = Math.round(deg / 22.5) % 16;
  return directions[idx];
}

function getWeatherDescription(code: number): string {
  if (code === 0) return '맑음 (시정 최적)';
  if (code === 1 || code === 2) return '대체로 맑음 / 구름 조금';
  if (code === 3) return '흐림 (시계 주의)';
  if (code === 45 || code === 48) return '안개 (비행 주의)';
  if (code >= 51 && code <= 67) return '강우 / 비 (비행 불가)';
  if (code >= 71 && code <= 77) return '강설 / 눈 (비행 불가)';
  if (code >= 80 && code <= 82) return '소나기 (비행 금지)';
  if (code >= 95) return '뇌우 / 낙뢰 위험 (즉시 착륙)';
  return '보통 기상';
}

function evaluateWindLevel(windSpeed: number, gusts: number): {
  windLevel: WindLevel;
  windBadgeText: string;
  flightSuitability: string;
} {
  const effectiveSpeed = Math.max(windSpeed, gusts * 0.85);

  if (effectiveSpeed < 5.0) {
    return {
      windLevel: 'safe',
      windBadgeText: '비행 적합',
      flightSuitability: '풍속 안정 (호버링 및 자동 비행 최적)',
    };
  } else if (effectiveSpeed < 8.0) {
    return {
      windLevel: 'caution',
      windBadgeText: '비행 주의',
      flightSuitability: '바람 다소 강함 (소형 드론 흔들림 및 배터리 소모 증가 유의)',
    };
  } else {
    return {
      windLevel: 'danger',
      windBadgeText: '비행 금지',
      flightSuitability: '강풍/돌풍 위험 (비행 비권고, 기체 분실 및 추락 위험)',
    };
  }
}

export async function fetchWeatherData(
  lat: number = 37.5512,
  lng: number = 127.1265,
  locationName: string = '서울 한강 드론공원 (광나루)'
): Promise<WeatherData> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,wind_direction_10m,wind_gusts_10m&wind_speed_unit=ms&timezone=Asia%2FTokyo`;

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) throw new Error(`Weather HTTP ${res.status}`);
    const data = await res.json();

    const current = data.current;
    if (!current) throw new Error('No current weather payload');

    const temp = Number(current.temperature_2m ?? 21.5);
    const windSpeed = Number(current.wind_speed_10m ?? 2.8);
    const windGusts = Number(current.wind_gusts_10m ?? windSpeed * 1.4);
    const windDir = Number(current.wind_direction_10m ?? 210);
    const humidity = Number(current.relative_humidity_2m ?? 55);
    const code = Number(current.weather_code ?? 0);

    const evalResult = evaluateWindLevel(windSpeed, windGusts);

    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const timeStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(
      now.getHours()
    )}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

    return {
      temperature: Math.round(temp * 10) / 10,
      windSpeed: Math.round(windSpeed * 10) / 10,
      windGusts: Math.round(windGusts * 10) / 10,
      windDirection: windDir,
      windDirectionText: getWindDirectionKorean(windDir),
      humidity,
      weatherCode: code,
      weatherDescription: getWeatherDescription(code),
      windLevel: evalResult.windLevel,
      windBadgeText: evalResult.windBadgeText,
      flightSuitability: evalResult.flightSuitability,
      timestamp: timeStr,
      locationName,
      latitude: lat,
      longitude: lng,
      isSimulated: false,
    };
  } catch {
    // Offline / fallback mode
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const timeStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(
      now.getHours()
    )}:${pad(now.getMinutes())}:${pad(now.getSeconds())} (표준 관측치)`;

    const windSpeed = 2.4;
    const windGusts = 3.6;
    const evalResult = evaluateWindLevel(windSpeed, windGusts);

    return {
      temperature: 22.0,
      windSpeed,
      windGusts,
      windDirection: 195,
      windDirectionText: '남남서풍 (SSW)',
      humidity: 50,
      weatherCode: 1,
      weatherDescription: '대체로 맑음 (시정 양호)',
      windLevel: evalResult.windLevel,
      windBadgeText: evalResult.windBadgeText,
      flightSuitability: evalResult.flightSuitability,
      timestamp: timeStr,
      locationName,
      latitude: lat,
      longitude: lng,
      isSimulated: true,
    };
  }
}
