import React, { useState } from 'react';
import { FlightLogRecord } from '../types';
import { formatDuration } from '../utils/noaa';
import {
  ArrowLeft,
  Download,
  Trash2,
  Clock,
  BatteryCharging,
  Plane,
  Calendar,
  MapPin,
  Search,
  CheckCircle2,
} from 'lucide-react';

interface FlightLogsScreenProps {
  logs: FlightLogRecord[];
  onBackToDashboard: () => void;
  onDeleteLog: (id: string) => void;
}

export const FlightLogsScreen: React.FC<FlightLogsScreenProps> = ({
  logs,
  onBackToDashboard,
  onDeleteLog,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Statistics
  const totalSeconds = logs.reduce((acc, cur) => acc + cur.durationSeconds, 0);
  const totalBatteryConsumed = logs.reduce((acc, cur) => acc + cur.consumedBattery, 0);
  const avgBattery = logs.length > 0 ? Math.round(totalBatteryConsumed / logs.length) : 0;

  const filteredLogs = logs.filter(
    (log) =>
      log.droneModel.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.location && log.location.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (log.notes && log.notes.toLowerCase().includes(searchTerm.toLowerCase())) ||
      log.date.includes(searchTerm)
  );

  const handleExportCSV = () => {
    if (logs.length === 0) return;
    const headers = [
      '일시',
      '기체',
      '배터리',
      '비행시간(초)',
      '비행시간',
      '시작배터리(%)',
      '종료배터리(%)',
      '소모(%)',
      'NOAA_Kp',
      '관측풍속(m/s)',
      '비행장소',
      '비고',
    ];
    const rows = logs.map((l) => [
      `"${l.date}"`,
      `"${l.droneModel}"`,
      `"${l.batteryModel}"`,
      l.durationSeconds,
      `"${l.durationFormatted}"`,
      l.startBattery,
      l.endBattery,
      l.consumedBattery,
      l.kpValue,
      l.windSpeed !== undefined ? l.windSpeed : '',
      `"${l.location || ''}"`,
      `"${l.notes || ''}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SkyLog_FlightLogs_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div id="screen-logs" className="flex-1 flex flex-col p-[18px]">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onBackToDashboard}
          className="flex items-center gap-1.5 text-sm text-[#00E676] hover:underline"
        >
          <ArrowLeft size={16} />
          <span>대시보드로 돌아가기</span>
        </button>

        {logs.length > 0 && (
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1 px-2.5 py-1 text-xs bg-[#191c24] hover:bg-[#252a36] text-gray-300 rounded-lg border border-[#2e3648] transition-colors"
          >
            <Download size={13} />
            <span>CSV 내보내기</span>
          </button>
        )}
      </div>

      <h1 className="text-xl font-extrabold text-white mb-3 flex items-center gap-2">
        <Plane size={20} className="text-[#00E676]" />
        비행 일지 목록 (Flight Logs)
      </h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-[#191c24] p-3 rounded-xl border border-[#252a36] text-center">
          <div className="text-[0.7rem] text-[#718096] uppercase font-bold">총 비행 횟수</div>
          <div className="text-lg font-extrabold text-[#00E676] mt-0.5">{logs.length}회</div>
        </div>
        <div className="bg-[#191c24] p-3 rounded-xl border border-[#252a36] text-center">
          <div className="text-[0.7rem] text-[#718096] uppercase font-bold">누적 비행시간</div>
          <div className="text-sm font-extrabold text-white mt-1 font-mono">
            {formatDuration(totalSeconds)}
          </div>
        </div>
        <div className="bg-[#191c24] p-3 rounded-xl border border-[#252a36] text-center">
          <div className="text-[0.7rem] text-[#718096] uppercase font-bold">평균 배터리 소모</div>
          <div className="text-lg font-extrabold text-[#FFD600] mt-0.5">{avgBattery}%</div>
        </div>
      </div>

      {/* Search box */}
      <div className="relative mb-3">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="기체명, 장소, 메모 검색..."
          className="w-full bg-[#191c24] border border-[#252a36] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#00E676]"
        />
      </div>

      {/* Logs List */}
      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
        {filteredLogs.length === 0 ? (
          <div className="text-center py-12 text-gray-500 text-xs bg-[#191c24]/50 rounded-xl border border-[#252a36]">
            {logs.length === 0 ? '기록된 비행 일지가 없습니다.' : '검색 결과가 없습니다.'}
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div
              key={log.id}
              className="bg-[#191c24] rounded-xl p-3.5 border border-[#252a36] hover:border-[#353c4d] transition-all"
            >
              <div className="flex justify-between items-start mb-1.5">
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                  <Calendar size={13} className="text-[#4fd1c5]" />
                  <span>{log.date}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[0.7rem] px-2 py-0.5 rounded-full bg-[#00E676]/15 text-[#00E676] border border-[#00E676]/30 font-bold">
                    Kp {log.kpValue}
                  </span>
                  <button
                    onClick={() => onDeleteLog(log.id)}
                    title="일지 삭제"
                    className="text-gray-500 hover:text-[#FF1744] p-0.5 transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              <div className="font-bold text-sm text-white mb-2 flex items-center gap-1.5">
                <Plane size={14} className="text-[#4fd1c5]" />
                <span>{log.droneModel}</span>
              </div>

              {/* Badges */}
              <div className="grid grid-cols-2 gap-2 text-xs bg-[#12141a] p-2 rounded-lg mb-2">
                <div className="flex items-center gap-1.5 text-gray-300">
                  <Clock size={13} className="text-[#00E676]" />
                  <span>비행: <strong className="font-mono text-white">{log.durationFormatted}</strong></span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-300">
                  <BatteryCharging size={13} className="text-[#FFD600]" />
                  <span>소모: <strong className="text-white">{log.consumedBattery}%</strong> ({log.startBattery}➔{log.endBattery}%)</span>
                </div>
                {log.windSpeed !== undefined && (
                  <div className="flex items-center gap-1.5 text-gray-300 col-span-2 border-t border-[#1e2330] pt-1">
                    <span className="text-[#00E676] font-bold text-[11px]">관측 풍속:</span>
                    <span className="text-white font-mono">{log.windSpeed} m/s</span>
                  </div>
                )}
              </div>

              {/* Location and Notes */}
              {log.location && (
                <div className="text-[0.75rem] text-gray-400 flex items-center gap-1 mb-1">
                  <MapPin size={11} className="text-gray-500 shrink-0" />
                  <span className="truncate">{log.location}</span>
                </div>
              )}

              {log.notes && (
                <div className="text-[0.73rem] text-[#cbd5e0] bg-[#161a23] p-1.5 rounded text-xs">
                  {log.notes}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
