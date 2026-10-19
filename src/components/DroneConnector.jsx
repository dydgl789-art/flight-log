import React, { useState, useRef, useEffect } from 'react';

export default function DroneConnector({ onTelemetryUpdate, onFlightStatusChange }) {
  const [isConnected, setIsConnected] = useState(false);
  const [baudRate, setBaudRate] = useState(57600); // SiK 무선 텔레메트리: 57600, USB 직결: 115200
  const [telemetry, setTelemetry] = useState({
    armed: false,
    voltage: 0,
    batteryRemaining: 0,
    lat: 0,
    lon: 0,
    alt: 0,
  });

  const portRef = useRef(null);
  const readerRef = useRef(null);
  const isReadingRef = useRef(false);

  // MAVLink v1 기본 패킷 파싱 로직
  const parseMavlinkV1 = (buffer) => {
    let i = 0;
    while (i < buffer.length) {
      // 0xFE: MAVLink v1 시작 바이트
      if (buffer[i] === 0xFE) {
        if (i + 5 >= buffer.length) break;
        const payloadLength = buffer[i + 1];
        const packetLength = 6 + payloadLength + 2; // Header(6) + Payload + CRC(2)

        if (i + packetLength > buffer.length) break;

        const msgId = buffer[i + 5];
        const payload = buffer.slice(i + 6, i + 6 + payloadLength);
        const view = new DataView(payload.buffer, payload.byteOffset, payload.byteLength);

        // 1. 하트비트 메시지 (Msg ID: 0) - 시동 여부 및 기체 모드
        if (msgId === 0 && payload.length >= 6) {
          const baseMode = view.getUint8(4);
          const isArmed = (baseMode & 128) !== 0; // MAV_MODE_FLAG_SAFETY_ARMED
          setTelemetry((prev) => {
            if (prev.armed !== isArmed && onFlightStatusChange) {
              onFlightStatusChange(isArmed);
            }
            return { ...prev, armed: isArmed };
          });
        }

        // 2. 배터리 상태 (SYS_STATUS - Msg ID: 1)
        if (msgId === 1 && payload.length >= 31) {
          const voltage = view.getUint16(14, true) / 1000; // mV -> V (리틀 엔디안)
          const remaining = view.getInt8(30); // %
          setTelemetry((prev) => ({
            ...prev,
            voltage: voltage.toFixed(1),
            batteryRemaining: remaining > 0 ? remaining : 0,
          }));
        }

        // 3. GPS 및 고도 (GLOBAL_POSITION_INT - Msg ID: 33)
        if (msgId === 33 && payload.length >= 28) {
          const lat = view.getInt32(4, true) / 1e7;
          const lon = view.getInt32(8, true) / 1e7;
          const relativeAlt = view.getInt32(16, true) / 1000; // mm -> m

          setTelemetry((prev) => {
            const updated = {
              ...prev,
              lat: lat.toFixed(6),
              lon: lon.toFixed(6),
              alt: relativeAlt.toFixed(1),
            };
            if (onTelemetryUpdate) onTelemetryUpdate(updated);
            return updated;
          });
        }

        i += packetLength;
      } else {
        i++;
      }
    }
  };

  // 시리얼 연결 함수
  const handleConnect = async () => {
    if (!('serial' in navigator)) {
      alert('현재 브라우저는 Web Serial을 지원하지 않습니다. Chrome 또는 Edge 브라우저를 사용해 주세요.');
      return;
    }

    try {
      // 사용자 브라우저 팝업으로 포트 선택
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

  // 스트림 읽기 루프
  const readStream = async (port) => {
    let accumulatedBuffer = new Uint8Array(0);

    while (port.readable && isReadingRef.current) {
      readerRef.current = port.readable.getReader();
      try {
        while (true) {
          const { value, done } = await readerRef.current.read();
          if (done) break;
          if (value) {
            // 청크 합치기
            const newBuf = new Uint8Array(accumulatedBuffer.length + value.length);
            newBuf.set(accumulatedBuffer);
            newBuf.set(value, accumulatedBuffer.length);
            accumulatedBuffer = newBuf;

            // 파싱
            parseMavlinkV1(accumulatedBuffer);

            // 버퍼가 과도하게 쌓이지 않도록 주기적 정리
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

  // 연결 해제
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
      // 컴포넌트 언마운트 시 시리얼 포트 정리
      if (isConnected) handleDisconnect();
    };
  }, [isConnected]);

  return (
    <div style={{ padding: '16px', background: '#1e293b', color: '#fff', borderRadius: '10px', margin: '16px 0' }}>
      <h3 style={{ margin: '0 0 12px 0', fontSize: '18px', fontWeight: 'bold' }}>📡 드론 실시간 연동 (Web Serial)</h3>

      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '16px' }}>
        <select
          value={baudRate}
          onChange={(e) => setBaudRate(e.target.value)}
          disabled={isConnected}
          style={{ padding: '8px', borderRadius: '6px', background: '#334155', color: '#fff', border: 'none' }}
        >
          <option value={57600}>57600 bps (SiK 무선 텔레메트리)</option>
          <option value={115200}>115200 bps (USB 직접 연결)</option>
        </select>

        {!isConnected ? (
          <button
            onClick={handleConnect}
            style={{ padding: '8px 16px', borderRadius: '6px', background: '#2563eb', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
          >
            드론 연결
          </button>
        ) : (
          <button
            onClick={handleDisconnect}
            style={{ padding: '8px 16px', borderRadius: '6px', background: '#ef4444', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
          >
            연결 해제
          </button>
        )}
      </div>

      {/* 상태 대시보드 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
        <div style={{ background: '#0f172a', padding: '10px', borderRadius: '6px' }}>
          <div style={{ fontSize: '12px', color: '#94a3b8' }}>시동 상태</div>
          <div style={{ fontSize: '16px', fontWeight: 'bold', color: telemetry.armed ? '#4ade80' : '#f87171' }}>
            {telemetry.armed ? 'ARMED (비행 중)' : 'DISARMED (대기)'}
          </div>
        </div>

        <div style={{ background: '#0f172a', padding: '10px', borderRadius: '6px' }}>
          <div style={{ fontSize: '12px', color: '#94a3b8' }}>배터리 전압 / 잔량</div>
          <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
            {telemetry.voltage}V ({telemetry.batteryRemaining}%)
          </div>
        </div>

        <div style={{ background: '#0f172a', padding: '10px', borderRadius: '6px' }}>
          <div style={{ fontSize: '12px', color: '#94a3b8' }}>상대 고도</div>
          <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{telemetry.alt} m</div>
        </div>

        <div style={{ background: '#0f172a', padding: '10px', borderRadius: '6px' }}>
          <div style={{ fontSize: '12px', color: '#94a3b8' }}>GPS 좌표</div>
          <div style={{ fontSize: '13px', fontWeight: 'bold' }}>
            {telemetry.lat !== 0 ? `${telemetry.lat}, ${telemetry.lon}` : '위성 탐색 중...'}
          </div>
        </div>
      </div>
    </div>
  );
}
