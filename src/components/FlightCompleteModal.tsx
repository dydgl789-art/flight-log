import React, { useState } from 'react';
import { Equipment } from '../types';
import { formatDuration } from '../utils/noaa';
import { CheckCircle2, MapPin, FileText } from 'lucide-react';

interface FlightCompleteModalProps {
  isOpen: boolean;
  equipment: Equipment;
  elapsedSeconds: number;
  startBattery: number;
  currentBattery: number;
  kpValue: number;
  initialLocation?: string;
  initialWindSpeed?: number;
  onSaveAndClose: (location: string, notes: string, windSpeed?: number) => void;
  onCloseWithoutSaving: () => void;
}

export const FlightCompleteModal: React.FC<FlightCompleteModalProps> = ({
  isOpen,
  equipment,
  elapsedSeconds,
  startBattery,
  currentBattery,
  kpValue,
  initialLocation = '한강 드론 공원 (광나루)',
  initialWindSpeed = 2.4,
  onSaveAndClose,
  onCloseWithoutSaving,
}) => {
  const [location, setLocation] = useState(initialLocation);
  const [windSpeed, setWindSpeed] = useState<number>(initialWindSpeed);
  const [notes, setNotes] = useState('정상 비행 완료, 풍속 및 기체 거동 안정적임');

  if (!isOpen) return null;

  const consumed = Math.max(0, startBattery - currentBattery);

  return (
    <div
      id="modal"
      className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-5 backdrop-blur-xs"
    >
      <div className="bg-[#1a1e28] rounded-[20px] max-w-[380px] w-full p-6 border border-[#2e3648] shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <h3 className="flex items-center gap-2 text-[1.15rem] font-bold mb-[14px] text-[#00E676]">
          <svg className="w-[22px] h-[22px] fill-current" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
          </svg>
          <span>비행 완료 & 일지 기록</span>
        </h3>

        {/* Content list matching exact format */}
        <div id="modal-summary" className="text-[0.88rem] leading-[1.8] text-[#cbd5e0] mb-[18px]">
          <div>
            • 기체: <span className="font-semibold text-white">{equipment.droneModel}</span>
          </div>
          <div>
            • 총 비행 시간:{' '}
            <strong className="text-[#00E676] font-extrabold text-base">
              {formatDuration(elapsedSeconds)}
            </strong>
          </div>
          <div>
            • 배터리 소모:{' '}
            <strong className="text-[#FFD600] font-bold">{consumed}%</strong> ({startBattery}% ➔{' '}
            {currentBattery}%)
          </div>
          <div>
            • 지자기 Kp 지수: <span className="text-gray-300">{kpValue.toFixed(2)} Kp</span>
          </div>
          <div>
            • 관측 풍속: <span className="text-[#00E676] font-semibold">{windSpeed} m/s</span>
          </div>
        </div>

        {/* Quick Log Inputs */}
        <div className="space-y-2 mb-4 pt-3 border-t border-[#252a36]">
          <div>
            <label className="text-xs text-gray-400 flex items-center gap-1 mb-1">
              <MapPin size={12} className="text-[#4fd1c5]" /> 비행 장소
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="비행 장소 입력..."
              className="w-full bg-[#12141a] border border-[#2b3142] rounded-lg px-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#00E676]"
            />
          </div>

          <div>
            <label className="text-xs text-gray-400 flex items-center gap-1 mb-1">
              <FileText size={12} className="text-[#4fd1c5]" /> 비행 특이사항 / 메모
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="풍속, 미션 내용 등..."
              className="w-full bg-[#12141a] border border-[#2b3142] rounded-lg px-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#00E676]"
            />
          </div>
        </div>

        {/* Primary Action Button */}
        <button
          id="btn-modal-close"
          onClick={() => onSaveAndClose(location, notes, windSpeed)}
          className="w-full h-[46px] bg-[#00E676] hover:bg-[#00c853] text-black font-extrabold rounded-[12px] text-[0.95rem] cursor-pointer transition-colors shadow-md shadow-[#00E676]/20 mb-2 flex items-center justify-center gap-1.5"
        >
          <CheckCircle2 size={18} />
          <span>비행 일지 저장 및 복귀</span>
        </button>

        <button
          onClick={onCloseWithoutSaving}
          className="w-full py-2 text-xs text-[#718096] hover:text-white transition-colors text-center"
        >
          저장하지 않고 대시보드로 돌아가기
        </button>
      </div>
    </div>
  );
};
