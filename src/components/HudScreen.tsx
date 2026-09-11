import React, { useEffect, useState } from 'react';
import { formatDuration } from '../utils/noaa';
import { Equipment } from '../types';
import { Play, Pause, Zap, Flame, Compass } from 'lucide-react';

interface HudScreenProps {
  equipment: Equipment;
  elapsedSeconds: number;
  currentBattery: number;
  startBattery: number;
  onBatteryChange: (val: number) => void;
  onLand: () => void;
  onBatteryWarning?: () => void;
  locationName?: string;
  windSpeed?: number;
}

export const HudScreen: React.FC<HudScreenProps> = ({
  equipment,
  elapsedSeconds,
  currentBattery,
  startBattery,
  onBatteryChange,
  onLand,
  onBatteryWarning,
  locationName = '한강 드론 공원',
  windSpeed = 2.4,
}) => {
  const [autoDischarge, setAutoDischarge] = useState(false);

  // Auto discharge simulation
  useEffect(() => {
    if (!autoDischarge) return;
    const interval = setInterval(() => {
      onBatteryChange(Math.max(0, currentBattery - 1));
    }, 4000);
    return () => clearInterval(interval);
  }, [autoDischarge, currentBattery, onBatteryChange]);

  // Check low battery trigger
  useEffect(() => {
    if (currentBattery <= 25 && onBatteryWarning) {
      onBatteryWarning();
    }
  }, [currentBattery, onBatteryWarning]);

  // Color calculation based on battery level
  let batColor = '#00E676';
  let isLowBattery = false;

  if (currentBattery <= 25) {
    batColor = '#FF1744';
    isLowBattery = true;
  } else if (currentBattery <= 50) {
    batColor = '#FFD600';
    isLowBattery = false;
  }

  const consumed = Math.max(0, startBattery - currentBattery);

  return (
    <div id="screen-hud" className="flex-1 flex flex-col p-[18px]">
      {/* 1. HUD Status Header */}
      <div className="flex items-center justify-center gap-2 my-2.5 mb-5 text-[0.8rem] font-bold tracking-[1.5px] text-[#00E676]">
        <div className="w-[9px] h-[9px] rounded-full bg-[#00E676] animate-pulse" />
        <span>RECORDING IN PROGRESS</span>
      </div>

      {/* 2. Timer Box */}
      <div className="bg-[#141820] rounded-[20px] border border-[#2a3142] p-[28px_16px] text-center mb-[18px] shadow-lg shadow-black/40">
        <div className="text-[0.75rem] tracking-[1.5px] text-[#718096] mb-2 font-bold uppercase">
          FLIGHT DURATION
        </div>
        <div
          id="timer-display"
          className="text-[3.2rem] font-extrabold font-mono tracking-[2px] text-white leading-none select-none"
        >
          {formatDuration(elapsedSeconds)}
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-center gap-3 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <Compass size={13} className="text-[#4fd1c5]" /> {equipment.droneModel}
          </span>
          <span className="flex items-center gap-1">
            <Flame size={13} className="text-orange-400" /> 소모: {consumed}%
          </span>
          {windSpeed !== undefined && (
            <span className="flex items-center gap-1 text-gray-300">
              <span className="text-[#00E676] font-bold">풍속:</span> {windSpeed} m/s
            </span>
          )}
        </div>
        {locationName && (
          <div className="mt-2 text-[11px] text-gray-500 truncate text-center">
            비행 위치: {locationName}
          </div>
        )}
      </div>

      {/* 3. Battery Card */}
      <div className="bg-[#141820] rounded-[18px] border border-[#2a3142] p-[18px] mb-[14px]">
        <div className="flex justify-between items-center">
          <span className="text-[0.88rem] font-bold text-white flex items-center gap-1.5">
            <Zap size={16} className="text-[#4fd1c5]" />
            배터리 잔량 모니터링
          </span>
          <span
            id="bat-text"
            className="text-[1.2rem] font-extrabold transition-colors duration-300"
            style={{ color: batColor }}
          >
            {currentBattery}%
          </span>
        </div>

        {/* Battery Bar */}
        <div className="w-full h-[12px] bg-[#252a36] rounded-[6px] overflow-hidden my-3 mb-4">
          <div
            id="bat-fill"
            className="h-full rounded-[6px] transition-all duration-300"
            style={{
              width: `${currentBattery}%`,
              background: batColor,
            }}
          />
        </div>

        {/* Battery Slider */}
        <div className="flex items-center gap-2.5 text-[0.78rem] text-[#718096]">
          <span className="shrink-0">잔량 조절(시연):</span>
          <input
            type="range"
            id="bat-slider"
            min="0"
            max="100"
            value={currentBattery}
            onChange={(e) => onBatteryChange(parseInt(e.target.value, 10))}
            className="flex-1 accent-[#00E676] cursor-pointer"
          />
        </div>

        {/* Auto discharge simulation toggle */}
        <div className="mt-3 pt-2.5 border-t border-[#222838] flex items-center justify-between text-xs">
          <span className="text-gray-400">자동 소모 시뮬레이션 (4초당 -1%):</span>
          <button
            onClick={() => setAutoDischarge(!autoDischarge)}
            className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1 transition-colors ${
              autoDischarge
                ? 'bg-[#00E676]/20 text-[#00E676] border border-[#00E676]/30'
                : 'bg-[#252a36] text-gray-400 hover:text-white'
            }`}
          >
            {autoDischarge ? <Pause size={12} /> : <Play size={12} />}
            {autoDischarge ? '동작 중' : '시작'}
          </button>
        </div>

        {/* Low Battery Warning Banner */}
        {isLowBattery && (
          <div
            id="bat-warn"
            className="bg-[rgba(255,23,68,0.15)] border border-[#FF1744] text-[#FF1744] rounded-[10px] p-[10px_14px] text-[0.8rem] font-bold flex items-center gap-2 mt-3 animate-pulse"
          >
            <svg className="w-[18px] h-[18px] fill-current shrink-0" viewBox="0 0 24 24">
              <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
            </svg>
            <span>경고: 저전압 상태! 즉시 착륙을 권고합니다.</span>
          </div>
        )}
      </div>

      {/* 4. Action Wrap: Landing Button */}
      <div className="mt-auto pt-4">
        <button
          id="btn-land"
          onClick={onLand}
          className="w-full h-[54px] bg-[#E53935] hover:bg-[#D32F2F] active:scale-[0.99] text-white rounded-[14px] text-[1.05rem] font-bold cursor-pointer flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#E53935]/25"
        >
          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
            <path d="M2.5 19h19v2h-19zm19.57-4.64c-.21.8-1.04 1.28-1.84 1.06L6.32 12.7 2.07 5.28l1.92-.51 6.9 6.4 4.57-1.22 1.98 1.54 1.4-.38-1.47-3.65-1.54-.41L20.23 12.5c.79.22 1.27 1.04 1.05 1.86z" />
          </svg>
          <span>착륙 및 일지 기록 (Land)</span>
        </button>
      </div>
    </div>
  );
};
