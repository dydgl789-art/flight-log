import React, { useState, useRef, useEffect } from 'react';

// Web Serial 브라우저 API 타입 선언 (TS 컴파일 통과용)
declare global {
  interface Navigator {
    serial?: {
      requestPort: () => Promise<any>;
    };
  }
}

export interface TelemetryData {
  lat: string;
  lon: string;
  alt: string;
  batteryRemaining: number;
}

interface DroneConnectorProps {
  onTelemetryUpdate?: (data: TelemetryData) => void;
  onFlightStatusChange?: (isArmed: boolean) => void;
}

export default function DroneConnector({ onTelemetryUpdate, onFlightStatusChange }: DroneConnectorProps) {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [baudRate, setBaudRate] = useState<number>(57600);
  const [telemetry, setTelemetry] = useState<{
    armed: boolean;
    voltage: string;
    batteryRemaining: number;
    lat: string;
    lon: string;
    alt: string;
  }>({
    armed: false,
    voltage: '0.0',
    batteryRemaining: 0,
    lat: '0.000000',
    lon: '0.000000',
    alt: '0.0',
  });

  const portRef = useRef<any>(null);
  const readerRef = useRef<any>(null);
  const isReadingRef = useRef<boolean>(false);

  // MAVLink v1 기본 패킷 파싱 로직
  const parseMavlinkV1 = (buffer: Uint8Array) => {
    let i = 0;
    while (i < buffer.length) {
      if (buffer[i] === 0xfe) {
        if (i + 5 >= buffer.length) break;
        const payloadLength = buffer[i + 1];
        const packetLength = 6 + payloadLength + 2;

        if (i + packetLength > buffer.length) break;

        const msgId = buffer[i + 5];
        const payload = buffer.slice(i + 6, i + 6 + payloadLength);
        const view = new DataView(payload.buffer, payload.byteOffset, payload.byteLength);

        // 1. 하트비트 메시지 (Msg ID: 0)
        if (msgId === 0 && payload.length >= 6) {
          const baseMode = view.getUint8(4);
          const isArmed = (baseMode & 128) !== 0;
          setTelemetry((prev) => {
            if (prev.armed !== isArmed && onFlightStatusChange) {
              onFlightStatusChange(isArmed);
            }
            return { ...prev, armed: isArmed };
          });
        }

        // 2. 배터리 상태 (SYS_STATUS - Msg ID: 1)
        if (msgId === 1 && payload.length >= 31) {
          const voltage = (view.getUint16(14, true) / 1000).toFixed(1);
          const remaining = view.getInt8(30);
          setTelemetry((prev) => ({
            ...prev,
            voltage,
            batteryRemaining: remaining > 0 ? remaining : 0,
          }));
        }

        // 3. GPS 및 고도 (GLOBAL_POSITION_INT - Msg ID: 33)
        if (msgId === 33 && payload.length >= 28) {
          const lat = (view.getInt32(4, true) / 1e7).toFixed(6);
          const lon = (view.getInt32(8, true) / 1e7).toFixed(6);
          const relativeAlt = (view.getInt32(16, true) / 1000).toFixed(1);

          setTelemetry((prev) => {
            const updated = {
              ...prev,
              lat,
              lon,
              alt: relativeAlt,
            };
            if (onTelemetryUpdate) {
              onTelemetryUpdate({
                lat,
                lon,
                alt: relativeAlt,
                batteryRemaining: prev.batteryRemaining,
              });
            }
            return updated;
          });
        }

        i += packetLength;
      } else {
        i++;
      }
    }
  };

  const handleConnect = async () => {
    if (!navigator.serial) {
      alert('현재 브라우저는 Web Serial을 지원하지 않습니다. Chrome 또는 Edge 브라우저를 사용해 주세요.');
      return;
    }

    try {
      const port = await navigator.serial.requestPort();
      await port.open({ baudRate: Number(baudRate) });

      portRef.current = port;
      isReadingRef.current = true;
      setIsConnected(true);

      readStream(port);
    } catch (err) {
      console.error('시리얼 포트 연결 실패:', err);
    }
  };

  const readStream = async (port: any) => {
    let accumulatedBuffer = new Uint8Array(0);

    while (port.readable && isReadingRef.current) {
      readerRef.current = port.readable.getReader();
      try {
        while (true) {
          const { value, done } = await readerRef.current.read();
          if (done) break;
          if (value) {
            const newBuf = new Uint8Array(accumulatedBuffer.length + value.length);
            newBuf.set(accumulatedBuffer);
            newBuf.set(value, accumulatedBuffer.length);
            accumulatedBuffer = newBuf;

            parseMavlinkV1(accumulatedBuffer);

            if (accumulatedBuffer.length > 2048) {
              accumulatedBuffer = accumulatedBuffer.slice(-512);
            }
          }
        }
      } catch (err) {
        console.error('스트림 수신 오류:', err);
        break;
      } finally {
        readerRef.current.releaseLock();
      }
    }
  };

  const handleDisconnect = async () => {
    isReadingRef.current = false;
    if (readerRef.current) {
      await readerRef.current.cancel();
    }
    if (portRef.current) {
      await portRef.current.close();
      portRef.current = null;
    }
    setIsConnected(false);
  };

  useEffect(() => {
    return () => {
      if (isConnected) handleDisconnect();
    };
  }, [isConnected]);

  return (
    <div className="bg-[#1a1f2c] border border-[#2b3347] rounded-xl p-3 text-white mb-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-bold tracking-wider text-[#00E676] flex items-center gap-1.5 uppercase">
          <span className="w-2 h-2 rounded-full bg-[#00E676] animate-pulse"></span>
          드론 하드웨어 연동 (Web Serial)
        </h3>
        <span className="text-[10px] text-gray-400">MAVLink v1</span>
      </div>

      <div className="flex gap-2 items-center mb-3">
        <select
          value={baudRate}
          onChange={(e) => setBaudRate(Number(e.target.value))}
          disabled={isConnected}
          className="flex-1 bg-[#12141a] text-xs text-gray-200 border border-[#333c52] rounded-lg px-2.5 py-2 outline-none"
        >
          <option value={57600}>57600 bps (무선 텔레메트리 SiK)</option>
          <option value={115200}>115200 bps (USB 직접 연결)</option>
        </select>

        {!isConnected ? (
          <button
            onClick={handleConnect}
            className="px-3.5 py-2 rounded-lg bg-[#00E676] text-black font-semibold text-xs transition hover:brightness-110 active:scale-95 shadow-sm"
          >
            연결
          </button>
        ) : (
          <button
            onClick={handleDisconnect}
            className="px-3.5 py-2 rounded-lg bg-[#ef4444] text-white font-semibold text-xs transition hover:brightness-110 active:scale-95 shadow-sm"
          >
            해제
          </button>
        )}
      </div>

      <div className="grid grid-cols-4 gap-1.5">
        <div className="bg-[#12141a] p-2 rounded-lg text-center border border-[#22283a]">
          <div className="text-[10px] text-gray-400">모터 시동</div>
          <div className={`text-xs font-bold mt-0.5 ${telemetry.armed ? 'text-[#00E676]' : 'text-red-400'}`}>
            {telemetry.armed ? 'ARMED' : 'DISARM'}
          </div>
        </div>

        <div className="bg-[#12141a] p-2 rounded-lg text-center border border-[#22283a]">
          <div className="text-[10px] text-gray-400">배터리</div>
          <div className="text-xs font-bold text-gray-100 mt-0.5">
            {telemetry.batteryRemaining}%
          </div>
        </div>

        <div className="bg-[#12141a] p-2 rounded-lg text-center border border-[#22283a]">
          <div className="text-[10px] text-gray-400">상대고도</div>
          <div className="text-xs font-bold text-cyan-400 mt-0.5">{telemetry.alt}m</div>
        </div>

        <div className="bg-[#12141a] p-2 rounded-lg text-center border border-[#22283a]">
          <div className="text-[10px] text-gray-400">전압</div>
          <div className="text-xs font-bold text-yellow-400 mt-0.5">{telemetry.voltage}V</div>
        </div>
      </div>
    </div>
  );
}
