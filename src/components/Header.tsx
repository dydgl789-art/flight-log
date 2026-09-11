import React from 'react';
import { RotateCw, Plane, BookOpen, SlidersHorizontal, Volume2, VolumeX, Map } from 'lucide-react';
import { ScreenType } from '../types';

interface HeaderProps {
  currentScreen: ScreenType;
  onNavigate: (screen: ScreenType) => void;
  onRefreshKp: () => void;
  isRefreshing: boolean;
  logCount: number;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onOpenEquipmentModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentScreen,
  onNavigate,
  onRefreshKp,
  isRefreshing,
  logCount,
  soundEnabled,
  onToggleSound,
  onOpenEquipmentModal,
}) => {
  return (
    <header className="h-[60px] bg-[#191c24] flex items-center justify-between px-4 border-b border-[#252a36] sticky top-0 z-30">
      <button
        id="btn-header-logo"
        onClick={() => onNavigate('dashboard')}
        className="flex items-center gap-2 font-extrabold text-[1.15rem] text-white hover:opacity-90 transition-opacity"
      >
        {/* Custom SVG / Plane icon matching exact design */}
        <div className="w-[22px] h-[22px] flex items-center justify-center text-[#00E676]">
          <svg className="w-[22px] h-[22px] fill-current" viewBox="0 0 24 24">
            <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
          </svg>
        </div>
        <span className="tracking-tight">SkyLog Pro</span>
      </button>

      <div className="flex items-center gap-1">
        {/* Map Airspace Navigation */}
        <button
          id="btn-nav-map"
          onClick={() => onNavigate(currentScreen === 'map' ? 'dashboard' : 'map')}
          title="공역 및 비행금지구역 지도"
          className={`p-2 rounded-lg transition-colors ${
            currentScreen === 'map'
              ? 'text-[#1E88E5] bg-[#252a36]'
              : 'text-[#a0aec0] hover:text-white hover:bg-[#252a36]'
          }`}
        >
          <Map size={19} />
        </button>

        {/* Sound toggle */}
        <button
          id="btn-sound-toggle"
          onClick={onToggleSound}
          title={soundEnabled ? '비행 알림음 켜짐' : '비행 알림음 음소거'}
          className={`p-2 rounded-lg transition-colors ${
            soundEnabled ? 'text-[#00E676] hover:bg-[#252a36]' : 'text-[#718096] hover:bg-[#252a36]'
          }`}
        >
          {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
        </button>

        {/* Equipment settings button */}
        <button
          id="btn-equipment-settings"
          onClick={onOpenEquipmentModal}
          title="장비 설정"
          className="p-2 rounded-lg text-[#a0aec0] hover:text-white hover:bg-[#252a36] transition-colors"
        >
          <SlidersHorizontal size={18} />
        </button>

        {/* Flight Logs Navigation */}
        <button
          id="btn-nav-logs"
          onClick={() => onNavigate(currentScreen === 'logs' ? 'dashboard' : 'logs')}
          title="비행 일지 목록"
          className={`relative p-2 rounded-lg transition-colors ${
            currentScreen === 'logs'
              ? 'text-[#00E676] bg-[#252a36]'
              : 'text-[#a0aec0] hover:text-white hover:bg-[#252a36]'
          }`}
        >
          <BookOpen size={19} />
          {logCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[17px] h-[17px] bg-[#00E676] text-black text-[10px] font-extrabold rounded-full flex items-center justify-center px-1">
              {logCount}
            </span>
          )}
        </button>

        {/* Refresh NOAA Kp button */}
        <button
          id="btn-refresh"
          onClick={onRefreshKp}
          title="새로고침"
          disabled={isRefreshing}
          className="p-2 rounded-lg text-[#a0aec0] hover:text-white hover:bg-[#252a36] transition-colors disabled:opacity-50"
        >
          <RotateCw size={19} className={isRefreshing ? 'animate-spin text-[#00E676]' : ''} />
        </button>
      </div>
    </header>
  );
};

