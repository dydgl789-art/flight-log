import React, { useState } from 'react';
import { Equipment, KpData, WeatherData, AirspaceCheckResult } from '../types';
import {
  Info,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Wind,
  Navigation,
  MapPin,
  Map,
  RotateCw,
} from 'lucide-react';

interface DashboardScreenProps {
  kpData: KpData;
  equipment: Equipment;
  weatherData: WeatherData | null;
  airspaceResult: AirspaceCheckResult;
  currentLocationName: string;
  onTakeoff: () => void;
  onEditEquipment: () => void;
  onOpenMap: () => void;
  onRefreshWeather: () => void;
  isRefreshingWeather?: boolean;
  onSimulateKp?: (level: 'safe' | 'caution' | 'danger') => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  kpData,
  equipment,
  weatherData,
  airspaceResult,
  currentLocationName,
  onTakeoff,
  onEditEquipment,
  onOpenMap,
  onRefreshWeather,
  isRefreshingWeather = false,
  onSimulateKp,
}) => {
  const [showKpInfo, setShowKpInfo] = useState(false);
  const [showWindInfo, setShowWindInfo] = useState(false);

  // NOAA Kp styling
  let kpBadgeClass = 'bg-[rgba(0,230,118,0.15)] text-[#00E676] border-[rgba(0,230,118,0.3)]';
  let kpValColor = '#00E676';
  let kpCardBorder = 'border-[rgba(0,230,118,0.4)] shadow-[0_4px_20px_rgba(0,230,118,0.08)]';

  if (kpData.level === 'caution') {
    kpBadgeClass = 'bg-[rgba(255,214,0,0.15)] text-[#FFD600] border-[rgba(255,214,0,0.3)]';
    kpValColor = '#FFD600';
    kpCardBorder = 'border-[rgba(255,214,0,0.4)] shadow-[0_4px_20px_rgba(255,214,0,0.08)]';
  } else if (kpData.level === 'danger') {
    kpBadgeClass = 'bg-[rgba(255,23,68,0.15)] text-[#FF1744] border-[rgba(255,23,68,0.3)]';
    kpValColor = '#FF1744';
    kpCardBorder = 'border-[rgba(255,23,68,0.4)] shadow-[0_4px_20px_rgba(255,23,68,0.08)]';
  }

  // Wind styling
  const windLevel = weatherData?.windLevel || 'safe';
  let windBadgeClass = 'bg-[rgba(0,230,118,0.15)] text-[#00E676] border-[rgba(0,230,118,0.3)]';
  let windValColor = '#00E676';
  let windCardBorder = 'border-[#252a36]';

  if (windLevel === 'caution') {
    windBadgeClass = 'bg-[rgba(255,214,0,0.15)] text-[#FFD600] border-[rgba(255,214,0,0.3)]';
    windValColor = '#FFD600';
    windCardBorder = 'border-[rgba(255,214,0,0.3)]';
  } else if (windLevel === 'danger') {
    windBadgeClass = 'bg-[rgba(255,23,68,0.15)] text-[#FF1744] border-[rgba(255,23,68,0.3)]';
    windValColor = '#FF1744';
    windCardBorder = 'border-[rgba(255,23,68,0.4)] shadow-[0_4px_20px_rgba(255,23,68,0.08)]';
  }

  // Overall flight permission check
  const isFlightBlocked =
    kpData.level === 'danger' ||
    windLevel === 'danger' ||
    airspaceResult.badgeColor === 'danger';

  return (
    <div id="screen-dashboard" className="flex-1 flex flex-col p-[18px] space-y-[14px]">
      {/* 1. 실시간 비행 안전 모니터링 섹션 헤더 */}
      <div className="flex items-center justify-between">
        <h2 className="text-[0.85rem] uppercase tracking-[1px] text-[#718096] font-bold flex items-center gap-1.5">
          <span>실시간 비행 안전 모니터링</span>
        </h2>
        <button
          id="btn-toggle-kp-guide"
          onClick={() => setShowKpInfo(!showKpInfo)}
          className="text-xs text-[#718096] hover:text-[#00E676] flex items-center gap-1 transition-colors"
        >
          <Info size={13} />
          <span>지자기 기준</span>
          {showKpInfo ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>
      </div>

      {/* NOAA Kp Card */}
      <div
        id="gauge-card"
        className={`bg-[#191c24] rounded-[16px] p-[18px] border transition-all duration-300 ${kpCardBorder}`}
      >
        <div className="flex justify-between items-center mb-3">
          <span className="text-[0.85rem] text-[#a0aec0] font-semibold">
            지자기 교란 지수 (NOAA Kp)
          </span>
          <span
            id="kp-badge"
            className={`px-[10px] py-[3px] rounded-[20px] text-[0.75rem] font-bold border transition-colors ${kpBadgeClass}`}
          >
            {kpData.badgeText}
          </span>
        </div>

        <div className="flex items-baseline gap-[6px] mb-2">
          <span
            id="kp-val"
            className="text-[2.75rem] font-extrabold leading-none tracking-tight transition-colors"
            style={{ color: kpValColor }}
          >
            {kpData.value.toFixed(2)}
          </span>
          <span className="text-[#718096] text-[1rem] font-medium">Kp</span>
        </div>

        <div id="kp-desc" className="text-[0.85rem] leading-[1.4] text-[#cbd5e0] font-normal">
          {kpData.description}
        </div>

        <div id="kp-time" className="text-[0.72rem] text-[#4a5568] mt-[10px]">
          관측 기준: {kpData.timestamp}
        </div>

        {/* Collapsible NOAA guide & tester */}
        {showKpInfo && (
          <div className="mt-3 pt-3 border-t border-[#252a36] text-[0.78rem] text-[#a0aec0] space-y-2">
            <div className="grid grid-cols-3 gap-1.5 text-center text-[0.72rem]">
              <div className="bg-[#12141a] p-1.5 rounded border border-[#00E676]/30">
                <span className="text-[#00E676] font-bold block">0 ~ 3 Kp</span>
                <span className="text-gray-400">안전 (적합)</span>
              </div>
              <div className="bg-[#12141a] p-1.5 rounded border border-[#FFD600]/30">
                <span className="text-[#FFD600] font-bold block">4 ~ 5 Kp</span>
                <span className="text-gray-400">주의 (GPS 오차)</span>
              </div>
              <div className="bg-[#12141a] p-1.5 rounded border border-[#FF1744]/30">
                <span className="text-[#FF1744] font-bold block">6 ~ 9 Kp</span>
                <span className="text-gray-400">위험 (비행 금지)</span>
              </div>
            </div>

            {onSimulateKp && (
              <div className="flex items-center justify-between pt-1">
                <span className="text-[0.72rem] text-gray-500">지수 시연 변경:</span>
                <div className="flex gap-1">
                  <button
                    onClick={() => onSimulateKp('safe')}
                    className="px-2 py-0.5 rounded text-[0.7rem] bg-[#00E676]/20 text-[#00E676] hover:bg-[#00E676]/30"
                  >
                    적합 (1.67)
                  </button>
                  <button
                    onClick={() => onSimulateKp('caution')}
                    className="px-2 py-0.5 rounded text-[0.7rem] bg-[#FFD600]/20 text-[#FFD600] hover:bg-[#FFD600]/30"
                  >
                    주의 (4.33)
                  </button>
                  <button
                    onClick={() => onSimulateKp('danger')}
                    className="px-2 py-0.5 rounded text-[0.7rem] bg-[#FF1744]/20 text-[#FF1744] hover:bg-[#FF1744]/30"
                  >
                    금지 (6.67)
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2. 실시간 기상 및 풍속 모니터링 카드 (Weather & Wind Speed) */}
      <div
        id="weather-card"
        className={`bg-[#191c24] rounded-[16px] p-[18px] border transition-all duration-300 ${windCardBorder}`}
      >
        <div className="flex justify-between items-center mb-2.5">
          <div className="flex items-center gap-1.5">
            <span className="text-[0.85rem] text-[#a0aec0] font-semibold flex items-center gap-1">
              <Wind size={15} className="text-[#00E676]" />
              실시간 풍속 & 기상
            </span>
            <button
              onClick={onRefreshWeather}
              title="날씨/풍속 새로고침"
              disabled={isRefreshingWeather}
              className="text-[#718096] hover:text-[#00E676] transition-colors p-0.5"
            >
              <RotateCw size={12} className={isRefreshingWeather ? 'animate-spin text-[#00E676]' : ''} />
            </button>
          </div>

          <span
            id="wind-badge"
            className={`px-[10px] py-[3px] rounded-[20px] text-[0.75rem] font-bold border transition-colors ${windBadgeClass}`}
          >
            {weatherData ? weatherData.windBadgeText : '측정 중'}
          </span>
        </div>

        {/* Location selector trigger */}
        <div className="flex items-center justify-between py-1 mb-2 text-xs border-b border-[#252a36]">
          <div className="flex items-center gap-1 text-[#e2e8f0] font-semibold truncate">
            <MapPin size={13} className="text-[#1E88E5] shrink-0" />
            <span className="truncate">{currentLocationName}</span>
          </div>
          <button
            onClick={onOpenMap}
            className="text-[11px] text-[#4fd1c5] hover:underline flex items-center gap-1 shrink-0 ml-2"
          >
            <Map size={12} />
            지도에서 변경
          </button>
        </div>

        {weatherData ? (
          <div>
            {/* Primary Wind Speed Display */}
            <div className="flex items-baseline justify-between mb-2">
              <div className="flex items-baseline gap-[6px]">
                <span
                  id="wind-val"
                  className="text-[2.5rem] font-extrabold leading-none tracking-tight"
                  style={{ color: windValColor }}
                >
                  {weatherData.windSpeed}
                </span>
                <span className="text-[#718096] text-[0.95rem] font-medium">m/s (풍속)</span>
              </div>

              <div className="text-right">
                <div className="text-xs text-[#a0aec0]">
                  돌풍: <strong className="text-white font-mono">{weatherData.windGusts} m/s</strong>
                </div>
                <div className="text-[11px] text-[#718096] flex items-center justify-end gap-1 mt-0.5">
                  <Navigation
                    size={11}
                    style={{ transform: `rotate(${weatherData.windDirection}deg)` }}
                    className="text-[#1E88E5]"
                  />
                  <span>{weatherData.windDirectionText}</span>
                </div>
              </div>
            </div>

            {/* Weather Metrics Row */}
            <div className="grid grid-cols-3 gap-1.5 py-2 px-2.5 bg-[#12141a] rounded-xl text-center text-xs mb-2 border border-[#232936]">
              <div>
                <span className="text-[10px] text-gray-500 block">기온</span>
                <span className="font-bold text-gray-200">{weatherData.temperature}°C</span>
              </div>
              <div>
                <span className="text-[10px] text-gray-500 block">습도</span>
                <span className="font-bold text-gray-200">{weatherData.humidity}%</span>
              </div>
              <div>
                <span className="text-[10px] text-gray-500 block">기상 상태</span>
                <span className="font-bold text-gray-200 truncate block">
                  {weatherData.weatherDescription.split(' ')[0]}
                </span>
              </div>
            </div>

            {/* Suitability explanation */}
            <div className="text-[0.82rem] text-[#cbd5e0] leading-snug">
              {weatherData.flightSuitability}
            </div>
          </div>
        ) : (
          <div className="py-4 text-center text-xs text-gray-500">실시간 기상 데이터 조회 중...</div>
        )}
      </div>

      {/* 3. 비행 공역 및 비행 금지 구역 점검 카드 (Airspace Zone Check) */}
      <div className="bg-[#191c24] rounded-[16px] p-[18px] border border-[#252a36]">
        <div className="flex justify-between items-center mb-2">
          <span className="text-[0.85rem] text-[#a0aec0] font-semibold flex items-center gap-1.5">
            <ShieldCheck size={16} className="text-[#1E88E5]" />
            비행 공역 및 금지 구역 상태
          </span>

          <span
            className={`px-[10px] py-[3px] rounded-[20px] text-[0.75rem] font-bold border ${
              airspaceResult.badgeColor === 'danger'
                ? 'bg-[#FF1744]/20 text-[#FF1744] border-[#FF1744]/40'
                : airspaceResult.badgeColor === 'caution'
                ? 'bg-[#FF9100]/20 text-[#FF9100] border-[#FF9100]/40'
                : 'bg-[#00E676]/20 text-[#00E676] border-[#00E676]/40'
            }`}
          >
            {airspaceResult.statusText}
          </span>
        </div>

        <p className="text-xs text-[#cbd5e0] leading-relaxed mb-3">{airspaceResult.details}</p>

        <button
          id="btn-open-airspace-map"
          onClick={onOpenMap}
          className="w-full py-2 px-3 bg-[#222838] hover:bg-[#2c3447] text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors border border-[#30384d]"
        >
          <Map size={14} className="text-[#1E88E5]" />
          <span>전국 비행금지구역 및 공역 지도 열기</span>
        </button>
      </div>

      {/* 4. 장비 체크 및 세팅 섹션 */}
      <div className="flex items-center justify-between">
        <h2 className="text-[0.85rem] uppercase tracking-[1px] text-[#718096] font-bold">
          장비 체크 및 세팅
        </h2>
        <button
          id="btn-edit-equipment-inline"
          onClick={onEditEquipment}
          className="text-xs text-[#4fd1c5] hover:underline"
        >
          장비 수정
        </button>
      </div>

      <div className="bg-[#191c24] rounded-[16px] p-[18px] border border-[#252a36]">
        {/* Drone item */}
        <div className="flex items-center gap-[10px] py-2 text-[0.9rem] text-[#e2e8f0] border-b border-[#252a36]">
          <svg className="w-[18px] h-[18px] fill-[#4fd1c5] shrink-0" viewBox="0 0 24 24">
            <path d="M22 9V7h-2V5c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-2h2v-2h-2v-2h2v-2h-2V9h2zm-4 10H4V5h14v14zM6 13h5v5H6zm6-6h4v3h-4zM6 7h5v5H6zm6 5h4v6h-4z" />
          </svg>
          <span className="font-medium truncate">{equipment.droneModel}</span>
        </div>

        {/* Battery item */}
        <div className="flex items-center gap-[10px] py-2 text-[0.9rem] text-[#e2e8f0]">
          <svg className="w-[18px] h-[18px] fill-[#4fd1c5] shrink-0" viewBox="0 0 24 24">
            <path d="M15.67 4H14V2h-4v2H8.33C7.6 4 7 4.6 7 5.33v15.33C7 21.4 7.6 22 8.33 22h7.33c.74 0 1.34-.6 1.34-1.33V5.33C17 4.6 16.4 4 15.67 4zM11 20v-5.5H9L13 7v5.5h2L11 20z" />
          </svg>
          <span className="font-medium truncate">{equipment.batteryModel}</span>
        </div>
      </div>

      {/* 5. 비행 전 종합 안전 점검 배너 */}
      <div className="bg-[#151821] rounded-[14px] p-3 border border-[#232936] text-[0.8rem]">
        <div className="flex items-center justify-between text-gray-400">
          <div className="flex items-center gap-1.5 text-[#00E676]">
            <CheckCircle2 size={14} />
            <span className="font-semibold text-white">비행 전 자이로/센서 점검 정상</span>
          </div>
          <span className="text-[0.72rem] text-gray-400">GPS 19개 위성 연결됨</span>
        </div>
      </div>

      {/* 비행 금지 경고 배너 if danger */}
      {isFlightBlocked && (
        <div className="p-3 bg-[#FF1744]/15 border border-[#FF1744] text-[#FF1744] rounded-xl flex items-center gap-2 text-xs font-bold">
          <ShieldAlert size={18} className="shrink-0" />
          <span>
            {kpData.level === 'danger'
              ? '지자기 폭풍 경보로 비행이 위험합니다.'
              : windLevel === 'danger'
              ? '강풍/돌풍 위험으로 비행이 비권고됩니다.'
              : '현재 위치는 비행 금지 구역입니다. 특별 승인 없이 이륙 불가합니다.'}
          </span>
        </div>
      )}

      {/* 6. Action Button at Bottom */}
      <div className="mt-auto pt-2">
        <button
          id="btn-takeoff"
          onClick={onTakeoff}
          disabled={airspaceResult.badgeColor === 'danger'}
          className={`w-full h-[54px] rounded-[14px] text-[1.05rem] font-bold cursor-pointer flex items-center justify-center gap-2 transition-all shadow-lg ${
            airspaceResult.badgeColor === 'danger'
              ? 'bg-gray-700 text-gray-400 cursor-not-allowed shadow-none'
              : 'bg-[#1E88E5] hover:bg-[#1976D2] active:scale-[0.99] text-white shadow-[#1E88E5]/25'
          }`}
        >
          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
            <path d="M2.5 19h19v2h-19zm19.57-9.36c-.21-.8-1.04-1.28-1.84-1.06L14.92 10l-6.9-6.4-1.92.51 4.25 7.42-4.57 1.22-1.98-1.54-1.4.38 1.47 3.65 1.54.41 13.91-3.72c.79-.22 1.27-1.04 1.05-1.84z" />
          </svg>
          <span>
            {airspaceResult.badgeColor === 'danger'
              ? '비행 금지 구역 (이륙 불가)'
              : '비행 기록 시작 (Takeoff)'}
          </span>
        </button>
      </div>
    </div>
  );
};
