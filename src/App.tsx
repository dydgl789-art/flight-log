import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ScreenType, KpData, Equipment, FlightLogRecord, WeatherData, AirspaceCheckResult } from './types';
import { Header } from './components/Header';
import { DashboardScreen } from './components/DashboardScreen';
import { HudScreen } from './components/HudScreen';
import { FlightLogsScreen } from './components/FlightLogsScreen';
import { AirspaceMapScreen } from './components/AirspaceMapScreen';
import { FlightCompleteModal } from './components/FlightCompleteModal';
import { EquipmentModal } from './components/EquipmentModal';
import { fetchNoaaKpData, evaluateKp, formatDuration } from './utils/noaa';
import { fetchWeatherData } from './utils/weather';
import { checkAirspace } from './utils/airspace';
import {
  getStoredLogs,
  saveFlightLog,
  deleteFlightLog,
  getStoredEquipment,
  saveEquipment,
} from './utils/storage';
import {
  playTakeoffSound,
  playLandingSound,
  playLowBatteryWarningSound,
} from './utils/audio';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('dashboard');

  // NOAA Kp Data
  const [kpData, setKpData] = useState<KpData>(() =>
    evaluateKp(1.67, `${new Date().toISOString().replace('T', ' ').substring(0, 19)} (로컬 모드)`, true)
  );
  const [isRefreshingKp, setIsRefreshingKp] = useState(false);

  // Weather & Wind Speed State
  const [currentLocationName, setCurrentLocationName] = useState('서울 한강 드론공원 (광나루)');
  const [currentLat, setCurrentLat] = useState(37.5512);
  const [currentLng, setCurrentLng] = useState(127.1265);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [isRefreshingWeather, setIsRefreshingWeather] = useState(false);
  const [airspaceResult, setAirspaceResult] = useState<AirspaceCheckResult>(() =>
    checkAirspace(37.5512, 127.1265)
  );

  // Equipment Data
  const [equipment, setEquipment] = useState<Equipment>(() => getStoredEquipment());
  const [isEquipmentModalOpen, setIsEquipmentModalOpen] = useState(false);

  // Flight HUD & Timer
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [startBattery, setStartBattery] = useState(100);
  const [currentBattery, setCurrentBattery] = useState(95);
  const timerRef = useRef<number | null>(null);

  // Flight Logs & Modal
  const [flightLogs, setFlightLogs] = useState<FlightLogRecord[]>(() => getStoredLogs());
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);

  // Sound cues
  const [soundEnabled, setSoundEnabled] = useState(true);
  const lastWarnedBatteryRef = useRef<number | null>(null);

  // Load live NOAA Kp data
  const loadKpData = useCallback(async () => {
    setIsRefreshingKp(true);
    try {
      const data = await fetchNoaaKpData();
      setKpData(data);
    } catch {
      // Fallback
    } finally {
      setIsRefreshingKp(false);
    }
  }, []);

  // Load live weather & wind data
  const loadWeatherData = useCallback(
    async (lat = currentLat, lng = currentLng, locName = currentLocationName) => {
      setIsRefreshingWeather(true);
      try {
        const weather = await fetchWeatherData(lat, lng, locName);
        setWeatherData(weather);
        setAirspaceResult(checkAirspace(lat, lng));
      } catch {
        // Fallback handled in weather util
      } finally {
        setIsRefreshingWeather(false);
      }
    },
    [currentLat, currentLng, currentLocationName]
  );

  useEffect(() => {
    loadKpData();
    loadWeatherData();
  }, [loadKpData, loadWeatherData]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Handle Takeoff
  const handleTakeoff = () => {
    if (airspaceResult.badgeColor === 'danger') {
      alert('현재 위치는 비행 금지 구역입니다. 특별 비행 승인 없이 이륙할 수 없습니다.');
      return;
    }
    if (soundEnabled) {
      playTakeoffSound();
    }
    setElapsedSeconds(0);
    setStartBattery(currentBattery);
    setCurrentScreen('hud');

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    timerRef.current = window.setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
  };

  // Handle Landing
  const handleLand = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (soundEnabled) {
      playLandingSound();
    }

    setIsCompleteModalOpen(true);
  };

  // Battery warning sound
  const handleBatteryWarning = useCallback(() => {
    if (!soundEnabled) return;
    if (lastWarnedBatteryRef.current === null || lastWarnedBatteryRef.current - currentBattery >= 3) {
      lastWarnedBatteryRef.current = currentBattery;
      playLowBatteryWarningSound();
    }
  }, [soundEnabled, currentBattery]);

  // Save flight log
  const handleSaveFlightLog = (location: string, notes: string, windSpeed?: number) => {
    const consumed = Math.max(0, startBattery - currentBattery);
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
      now.getDate()
    ).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}`;

    const newRecord: FlightLogRecord = {
      id: `log-${Date.now()}`,
      date: dateStr,
      timestampMs: Date.now(),
      droneModel: equipment.droneModel,
      batteryModel: equipment.batteryModel,
      durationSeconds: elapsedSeconds,
      durationFormatted: formatDuration(elapsedSeconds),
      startBattery,
      endBattery: currentBattery,
      consumedBattery: consumed,
      kpValue: kpData.value,
      kpStatus: kpData.badgeText,
      windSpeed: windSpeed ?? weatherData?.windSpeed,
      location: location.trim(),
      notes: notes.trim(),
    };

    const updated = saveFlightLog(newRecord);
    setFlightLogs(updated);
    setIsCompleteModalOpen(false);
    setCurrentScreen('dashboard');
  };

  const handleCloseWithoutSaving = () => {
    setIsCompleteModalOpen(false);
    setCurrentScreen('dashboard');
  };

  const handleDeleteLog = (id: string) => {
    if (window.confirm('이 비행 일지를 삭제하시겠습니까?')) {
      const updated = deleteFlightLog(id);
      setFlightLogs(updated);
    }
  };

  const handleSaveEquipment = (newEq: Equipment) => {
    setEquipment(newEq);
    saveEquipment(newEq);
  };

  const handleSimulateKp = (level: 'safe' | 'caution' | 'danger') => {
    const nowStr = `${new Date().toISOString().replace('T', ' ').substring(0, 19)} (시연 모드)`;
    if (level === 'safe') {
      setKpData(evaluateKp(1.67, nowStr, true));
    } else if (level === 'caution') {
      setKpData(evaluateKp(4.33, nowStr, true));
    } else {
      setKpData(evaluateKp(6.67, nowStr, true));
    }
  };

  const handleSelectLocationFromMap = (
    locName: string,
    lat: number,
    lng: number,
    weather: WeatherData
  ) => {
    setCurrentLocationName(locName);
    setCurrentLat(lat);
    setCurrentLng(lng);
    setWeatherData(weather);
    setAirspaceResult(checkAirspace(lat, lng));
  };

  return (
    <div className="min-h-screen bg-[#101216] text-[#f0f2f5] flex justify-center selection:bg-[#00E676] selection:text-black font-sans">
      <div
        id="app-container"
        className="w-full max-w-[480px] min-h-screen bg-[#12141a] flex flex-col relative border-x border-[#222632] shadow-[0_0_30px_rgba(0,0,0,0.5)]"
      >
        {/* Header */}
        <Header
          currentScreen={currentScreen}
          onNavigate={(screen) => {
            if (currentScreen === 'hud' && screen !== 'hud') {
              if (window.confirm('현재 비행 기록이 진행 중입니다. 착륙 후 이동하시겠습니까?')) {
                handleLand();
              }
              return;
            }
            setCurrentScreen(screen);
          }}
          onRefreshKp={() => {
            loadKpData();
            loadWeatherData();
          }}
          isRefreshing={isRefreshingKp || isRefreshingWeather}
          logCount={flightLogs.length}
          soundEnabled={soundEnabled}
          onToggleSound={() => setSoundEnabled(!soundEnabled)}
          onOpenEquipmentModal={() => setIsEquipmentModalOpen(true)}
        />

        {/* Dashboard Screen */}
        {currentScreen === 'dashboard' && (
          <DashboardScreen
            kpData={kpData}
            equipment={equipment}
            weatherData={weatherData}
            airspaceResult={airspaceResult}
            currentLocationName={currentLocationName}
            onTakeoff={handleTakeoff}
            onEditEquipment={() => setIsEquipmentModalOpen(true)}
            onOpenMap={() => setCurrentScreen('map')}
            onRefreshWeather={() => loadWeatherData()}
            isRefreshingWeather={isRefreshingWeather}
            onSimulateKp={handleSimulateKp}
          />
        )}

        {/* Airspace Map & Weather Inspection Screen */}
        {currentScreen === 'map' && (
          <AirspaceMapScreen
            initialLat={currentLat}
            initialLng={currentLng}
            initialLocationName={currentLocationName}
            onBack={() => setCurrentScreen('dashboard')}
            onSelectLocation={handleSelectLocationFromMap}
            onTakeoff={() => {
              setCurrentScreen('dashboard');
              handleTakeoff();
            }}
          />
        )}

        {/* HUD Flight Timer Screen */}
        {currentScreen === 'hud' && (
          <HudScreen
            equipment={equipment}
            elapsedSeconds={elapsedSeconds}
            currentBattery={currentBattery}
            startBattery={startBattery}
            locationName={currentLocationName}
            windSpeed={weatherData?.windSpeed}
            onBatteryChange={(val) => setCurrentBattery(val)}
            onLand={handleLand}
            onBatteryWarning={handleBatteryWarning}
          />
        )}

        {/* Flight Logs Screen */}
        {currentScreen === 'logs' && (
          <FlightLogsScreen
            logs={flightLogs}
            onBackToDashboard={() => setCurrentScreen('dashboard')}
            onDeleteLog={handleDeleteLog}
          />
        )}

        {/* Flight Completion Result Modal */}
        <FlightCompleteModal
          isOpen={isCompleteModalOpen}
          equipment={equipment}
          elapsedSeconds={elapsedSeconds}
          startBattery={startBattery}
          currentBattery={currentBattery}
          kpValue={kpData.value}
          initialLocation={currentLocationName}
          initialWindSpeed={weatherData?.windSpeed}
          onSaveAndClose={handleSaveFlightLog}
          onCloseWithoutSaving={handleCloseWithoutSaving}
        />

        {/* Equipment Configuration Modal */}
        <EquipmentModal
          isOpen={isEquipmentModalOpen}
          equipment={equipment}
          onSave={handleSaveEquipment}
          onClose={() => setIsEquipmentModalOpen(false)}
        />
      </div>
    </div>
  );
}
