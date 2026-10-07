import React, { useEffect, useState, useRef } from 'react';
import { formatDuration } from '../utils/noaa';
import { Equipment } from '../types';
import { Play, Pause, Zap, Flame, Compass, Volume2, Timer } from 'lucide-react';

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

  // 로컬 스토리지에서 타이머 설정값 불러오기 (기본값: 목표 15분, 음성 주기 2분)
  const targetMinutes = Number(localStorage.getItem('flight_target_minutes') || 15);
  const voiceIntervalMinutes = Number(localStorage.getItem('flight_voice_interval') || 2);

  const wakeLockRef = useRef<any>(null);
  const lastAnnouncedMinuteRef = useRef<number>(-1);

  // 1. 한국어 음성 안내 (TTS) 함수
  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // 이전 음성 취소 후 재생
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ko-KR';
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  // 2. 비행 시작 시 초기화 (Wake Lock 활성화 + 시작 음성 안내)
  useEffect(() => {
    // 화면 꺼짐 방지
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
        }
      } catch (err) {
        console.warn('Wake Lock 활성화 실패:', err);
      }
    };
    requestWakeLock();

    // 이륙 안내 음성
    speak('비행을 시작합니다. 안전 비행 하십시오.');

    // 컴포넌트 언마운트 시 화면 꺼짐 방지 해제
    return () => {
      if (wakeLockRef.current) {
        wakeLockRef.current.release().then(() => {
          wakeLockRef.current = null;
        });
      }
    };
  }, []);

  // 3. 비행 시간(초)에 따른 실시간 음성 알림 및 목표 시간 도달 감지
  useEffect(() => {
    if (elapsedSeconds <= 0) return;

    const currentMinute = Math.floor(elapsedSeconds / 60);
    const isMinuteExact = elapsedSeconds % 60 === 0;

    // 주기적 음성 알림 (예: 매 2분 정각)
    if (
      voiceIntervalMinutes > 0 &&
      isMinuteExact &&
      currentMinute > 0 &&
      currentMinute % voiceIntervalMinutes === 0 &&
      lastAnnouncedMinuteRef.current !== currentMinute
    ) {
      lastAnnouncedMinuteRef.current = currentMinute;
      speak(`현재 비행 시간 ${currentMinute}분 경과되었습니다.`);
    }

    // 목표 비행 시간 도달 알림
    if (elapsedSeconds === targetMinutes * 60) {
      speak(`목표 비행 시간 ${targetMinutes}분에 도달했습니다. 착륙을 준비하십시오.`);
      if ('vibrate' in navigator) {
        navigator.vibrate([300, 100, 300, 100, 500]);
      }
    }
  }, [elapsedSeconds, targetMinutes, voiceIntervalMinutes]);

  // 4. 착륙 버튼 핸들러 (음성 안내 후 기존 onLand 호출)
  const handleLandClick = () => {
    const finalMinutes = Math.floor(elapsedSeconds / 60);
    const finalSeconds = elapsedSeconds % 60;

    speak(`비행이 종료되었습니다. 총 비행 시간은 ${finalMinutes}분 ${finalSeconds}초입니다.`);

    if (wakeLockRef.current) {
      wakeLockRef.current.release();
    }

    onLand();
  };

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

  // 목표 시간 대비 진행률 (%)
  const targetTotalSeconds = targetMinutes * 60;
  const flightProgress = Math.min(100, Math.round((elapsedSeconds / targetTotalSeconds) * 100));

  return (
    <div id="screen-hud" className="flex-1 flex flex-col p-[18px]">
      {/* 1. HUD Status Header */}
      <div className="flex items-center justify-center gap-2 my-2.5 mb-4 text-[0.8rem] font-bold tracking-[1.5px] text-[#00E676]">
        <div className="w-[9px] h-[9px] rounded-full bg-[#00E676] animate-pulse" />
        <span>RECORDING IN PROGRESS</span>
      </div>

      {/* 2. Timer Box */}
      <div className="bg-[#141820] rounded-[20px] border border-[#2a3142] p-[24px_16px] text-center mb-[14px] shadow-lg shadow-black/40">
        <div className="text-[0.75rem] tracking-[1.5px] text-[#718096] mb-2 font-bold uppercase">
          FLIGHT DURATION
        </div>
        <div
          id="timer-display"
          className="text-[3.2rem] font-extrabold font-mono tracking-[2px] text-white leading-none select-none"
        >
          {formatDuration(elapsedSeconds)}
        </div>

        {/* 목표 시간 대비 프로그레스 바 */}
        <div className="mt-4 px-4">
          <div className="flex justify-between items-center text-[11px] mb-1">
            <span className="text-gray-400 flex items-center gap-1">
              <Timer size={12} className="text-[#38bdf8]" /> 목표 {targetMinutes}분
            </span>
            <span className="text-[#38bdf8] font-bold">{flightProgress}%</span>
          </div>
          <div className="w-full h-[6px] bg-[#252a36] rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                flightProgress >= 100 ? 'bg-[#FF1744]' : 'bg-[#38bdf8]'
              }`}
              style={{ width: `${flightProgress}%` }}
            />
          </div>
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
          {voiceIntervalMinutes > 0 && (
            <span className="flex items-center gap-1 text-[#00E676]">
              <Volume2 size={12} /> {voiceIntervalMinutes}분 주기 안내
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
          onClick={handleLandClick}
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
