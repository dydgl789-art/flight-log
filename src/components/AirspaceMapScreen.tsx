import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { AirspaceZone, AirspaceCheckResult, WeatherData } from '../types';
import { KOREA_AIRSPACE_ZONES, checkAirspace } from '../utils/airspace';
import { fetchWeatherData, PRESET_LOCATIONS } from '../utils/weather';
import {
  MapPin,
  Crosshair,
  Wind,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Compass,
  ArrowLeft,
  Navigation,
  RotateCw,
} from 'lucide-react';

interface AirspaceMapScreenProps {
  onBack: () => void;
  onSelectLocation: (locationName: string, lat: number, lng: number, weather: WeatherData) => void;
  onTakeoff: () => void;
  initialLat?: number;
  initialLng?: number;
  initialLocationName?: string;
}

export const AirspaceMapScreen: React.FC<AirspaceMapScreenProps> = ({
  onBack,
  onSelectLocation,
  onTakeoff,
  initialLat = 37.5512,
  initialLng = 127.1265,
  initialLocationName = '서울 한강 드론공원 (광나루)',
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const circlesRef = useRef<L.Circle[]>([]);

  const [currentLat, setCurrentLat] = useState<number>(initialLat);
  const [currentLng, setCurrentLng] = useState<number>(initialLng);
  const [currentLocationName, setCurrentLocationName] = useState<string>(initialLocationName);
  const [checkResult, setCheckResult] = useState<AirspaceCheckResult>(() =>
    checkAirspace(initialLat, initialLng)
  );
  const [spotWeather, setSpotWeather] = useState<WeatherData | null>(null);
  const [isLoadingWeather, setIsLoadingWeather] = useState<boolean>(false);
  const [isLocatingGps, setIsLocatingGps] = useState<boolean>(false);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Avoid double instantiation
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
    }

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 12,
      zoomControl: false,
    });

    // Clean Dark/Subdued Map Tiles (CartoDB Dark Matter / OSM)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
      maxZoom: 19,
    }).addTo(map);

    // Zoom control at top-right
    L.control.zoom({ position: 'topright' }).addTo(map);

    // Add airspace circles
    circlesRef.current = [];
    KOREA_AIRSPACE_ZONES.forEach((zone: AirspaceZone) => {
      const circle = L.circle([zone.lat, zone.lng], {
        radius: zone.radiusMeters,
        color: zone.color,
        fillColor: zone.color,
        fillOpacity: zone.type === 'drone_park' ? 0.35 : 0.18,
        weight: 2,
        dashArray: zone.type === 'control_zone' ? '5, 5' : undefined,
      }).addTo(map);

      // Popup for each zone
      circle.bindPopup(`
        <div style="font-family: sans-serif; color: #111; min-width: 170px;">
          <div style="font-weight: 800; font-size: 13px; color: ${zone.color};">${zone.code} ${zone.typeLabel}</div>
          <div style="font-weight: 700; font-size: 12px; margin-top: 2px;">${zone.name}</div>
          <div style="font-size: 11px; color: #555; margin-top: 4px;">${zone.description}</div>
          <div style="font-size: 10px; color: #777; margin-top: 4px; font-weight: 600;">관할: ${zone.approvalAuthority}</div>
        </div>
      `);

      circlesRef.current.push(circle);
    });

    // Custom Aircraft / Drone Pin
    const droneIcon = L.divIcon({
      className: 'drone-pin',
      html: `
        <div style="display:flex; flex-direction:column; align-items:center; transform: translate(-50%, -100%);">
          <div style="background:#1E88E5; color:#ffffff; font-weight:800; font-size:11px; padding:3px 8px; border-radius:12px; border:2px solid #ffffff; box-shadow:0 3px 10px rgba(0,0,0,0.6); display:flex; align-items:center; gap:4px; white-space:nowrap;">
            <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:#00E676; animation:pulse 1.5s infinite;"></span>
            내 드론 위치
          </div>
          <div style="width:0; height:0; border-left:6px solid transparent; border-right:6px solid transparent; border-top:8px solid #1E88E5;"></div>
        </div>
      `,
      iconSize: [0, 0],
      iconAnchor: [0, 0],
    });

    const marker = L.marker([initialLat, initialLng], {
      icon: droneIcon,
      draggable: true,
    }).addTo(map);

    marker.on('dragend', () => {
      const pos = marker.getLatLng();
      handleLocationChange(pos.lat, pos.lng, `지정 위치 (${pos.lat.toFixed(3)}, ${pos.lng.toFixed(3)})`);
    });

    markerRef.current = marker;

    // Map click handler
    map.on('click', (e) => {
      marker.setLatLng(e.latlng);
      handleLocationChange(
        e.latlng.lat,
        e.latlng.lng,
        `선택 위치 (${e.latlng.lat.toFixed(3)}, ${e.latlng.lng.toFixed(3)})`
      );
    });

    mapInstanceRef.current = map;

    // Initial weather fetch
    loadWeather(initialLat, initialLng, initialLocationName);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  const loadWeather = async (lat: number, lng: number, locName: string) => {
    setIsLoadingWeather(true);
    try {
      const data = await fetchWeatherData(lat, lng, locName);
      setSpotWeather(data);
    } catch {
      // Handled in weather util fallback
    } finally {
      setIsLoadingWeather(false);
    }
  };

  const handleLocationChange = (lat: number, lng: number, name: string) => {
    setCurrentLat(lat);
    setCurrentLng(lng);
    setCurrentLocationName(name);

    const result = checkAirspace(lat, lng);
    setCheckResult(result);

    loadWeather(lat, lng, name);
  };

  const jumpToPreset = (preset: { name: string; lat: number; lng: number }) => {
    if (!mapInstanceRef.current || !markerRef.current) return;
    mapInstanceRef.current.flyTo([preset.lat, preset.lng], 13, { duration: 1 });
    markerRef.current.setLatLng([preset.lat, preset.lng]);
    handleLocationChange(preset.lat, preset.lng, preset.name);
  };

  const handleGetCurrentGps = () => {
    if (!navigator.geolocation) {
      alert('현재 브라우저에서 GPS 위치 기능을 지원하지 않습니다.');
      return;
    }
    setIsLocatingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocatingGps(false);
        const { latitude, longitude } = pos.coords;
        if (mapInstanceRef.current && markerRef.current) {
          mapInstanceRef.current.flyTo([latitude, longitude], 14, { duration: 1 });
          markerRef.current.setLatLng([latitude, longitude]);
        }
        handleLocationChange(latitude, longitude, '현재 내 GPS 위치');
      },
      (err) => {
        setIsLocatingGps(false);
        console.warn('GPS Error:', err.message);
        alert('GPS 위치를 가져올 수 없습니다. 지도를 직접 터치하여 위치를 지정해 주세요.');
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  const handleApplyLocation = () => {
    if (spotWeather) {
      onSelectLocation(currentLocationName, currentLat, currentLng, spotWeather);
    }
    onBack();
  };

  return (
    <div id="screen-airspace-map" className="flex-1 flex flex-col relative bg-[#12141a] text-white">
      {/* Top Map Header */}
      <div className="h-[54px] bg-[#191c24]/95 backdrop-blur-md px-4 flex items-center justify-between border-b border-[#252a36] z-20">
        <div className="flex items-center gap-2">
          <button
            id="btn-map-back"
            onClick={onBack}
            className="p-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-[#252a36] transition-colors"
            title="대시보드로 돌아가기"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-sm font-bold text-white flex items-center gap-1.5">
              <span>드론 비행 금지 구역 & 실시간 풍속</span>
            </h1>
            <p className="text-[10px] text-gray-400">지도를 클릭하여 공역 및 기상을 확인하세요</p>
          </div>
        </div>

        <button
          id="btn-gps-locate"
          onClick={handleGetCurrentGps}
          disabled={isLocatingGps}
          className="p-2 rounded-lg bg-[#252a36] hover:bg-[#2d3444] text-[#00E676] text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
          title="내 GPS 현재 위치 찾기"
        >
          <Crosshair size={16} className={isLocatingGps ? 'animate-spin' : ''} />
          <span className="hidden sm:inline">내 위치</span>
        </button>
      </div>

      {/* Preset quick jump chips */}
      <div className="bg-[#151821] py-2 px-3 flex gap-2 overflow-x-auto scrollbar-none border-b border-[#252a36] z-20 text-xs">
        {PRESET_LOCATIONS.map((preset) => {
          const isSelected = currentLocationName === preset.name;
          return (
            <button
              key={preset.name}
              onClick={() => jumpToPreset(preset)}
              className={`px-2.5 py-1 rounded-full whitespace-nowrap transition-colors flex items-center gap-1 text-[11px] ${
                isSelected
                  ? 'bg-[#1E88E5] text-white font-bold'
                  : 'bg-[#1e2330] text-gray-300 hover:text-white hover:bg-[#282f40]'
              }`}
            >
              <MapPin size={11} />
              {preset.name}
            </button>
          );
        })}
      </div>

      {/* Leaflet Map Canvas Container */}
      <div className="flex-1 relative w-full h-[320px] min-h-[300px]">
        <div ref={mapContainerRef} className="w-full h-full" style={{ zIndex: 1 }} />

        {/* Floating Map Legend Overlay */}
        <div className="absolute top-2 left-2 bg-[#191c24]/90 backdrop-blur-md p-2 rounded-lg border border-[#252a36] text-[10px] z-10 space-y-1 shadow-lg">
          <div className="flex items-center gap-1.5 font-bold text-gray-300 mb-1">
            <Compass size={11} className="text-[#00E676]" />
            <span>공역 범례</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FF1744]"></span>
            <span className="text-gray-200">비행금지 (P-73/원전)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FF9100]"></span>
            <span className="text-gray-200">공항 관제권 (반경 9.3km)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00E676]"></span>
            <span className="text-gray-200">드론 전용 공원 (자유 비행)</span>
          </div>
        </div>
      </div>

      {/* Selected Location Status & Weather Detail Card */}
      <div className="bg-[#191c24] border-t border-[#252a36] p-3.5 space-y-3 z-20 shadow-[0_-5px_20px_rgba(0,0,0,0.5)]">
        {/* Airspace Verdict Badge */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1">
              {checkResult.badgeColor === 'danger' && (
                <ShieldAlert size={18} className="text-[#FF1744] shrink-0" />
              )}
              {checkResult.badgeColor === 'caution' && (
                <AlertTriangle size={18} className="text-[#FF9100] shrink-0" />
              )}
              {checkResult.badgeColor === 'safe' && (
                <ShieldCheck size={18} className="text-[#00E676] shrink-0" />
              )}
              <span className="font-extrabold text-sm text-white truncate">
                {currentLocationName}
              </span>
            </div>
            <p className="text-[11px] text-gray-300 leading-relaxed">{checkResult.details}</p>
          </div>

          <span
            className={`px-2.5 py-1 rounded-full text-[11px] font-bold shrink-0 border ${
              checkResult.badgeColor === 'danger'
                ? 'bg-[#FF1744]/20 text-[#FF1744] border-[#FF1744]/40'
                : checkResult.badgeColor === 'caution'
                ? 'bg-[#FF9100]/20 text-[#FF9100] border-[#FF9100]/40'
                : 'bg-[#00E676]/20 text-[#00E676] border-[#00E676]/40'
            }`}
          >
            {checkResult.statusText}
          </span>
        </div>

        {/* Real-time Weather & Wind Speed Box */}
        <div className="bg-[#12141a] rounded-xl p-2.5 border border-[#232936] text-xs">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-gray-400 font-semibold">
              <Wind size={14} className="text-[#00E676]" />
              <span>실시간 풍속 및 기상 상태</span>
              {isLoadingWeather && <RotateCw size={12} className="animate-spin text-gray-400" />}
            </div>
            {spotWeather && (
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  spotWeather.windLevel === 'safe'
                    ? 'bg-[#00E676]/20 text-[#00E676]'
                    : spotWeather.windLevel === 'caution'
                    ? 'bg-[#FFD600]/20 text-[#FFD600]'
                    : 'bg-[#FF1744]/20 text-[#FF1744]'
                }`}
              >
                풍속: {spotWeather.windBadgeText}
              </span>
            )}
          </div>

          {spotWeather ? (
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="bg-[#191c24] p-1.5 rounded-lg border border-[#252a36]">
                <div className="text-[10px] text-gray-400">평균 풍속</div>
                <div
                  className="text-sm font-extrabold"
                  style={{
                    color:
                      spotWeather.windLevel === 'safe'
                        ? '#00E676'
                        : spotWeather.windLevel === 'caution'
                        ? '#FFD600'
                        : '#FF1744',
                  }}
                >
                  {spotWeather.windSpeed} <span className="text-[10px] font-normal">m/s</span>
                </div>
              </div>

              <div className="bg-[#191c24] p-1.5 rounded-lg border border-[#252a36]">
                <div className="text-[10px] text-gray-400">돌풍 (Gusts)</div>
                <div className="text-sm font-bold text-gray-200">
                  {spotWeather.windGusts} <span className="text-[10px] font-normal">m/s</span>
                </div>
              </div>

              <div className="bg-[#191c24] p-1.5 rounded-lg border border-[#252a36]">
                <div className="text-[10px] text-gray-400">풍향</div>
                <div className="text-xs font-bold text-gray-200 flex items-center justify-center gap-0.5">
                  <Navigation
                    size={10}
                    style={{ transform: `rotate(${spotWeather.windDirection}deg)` }}
                    className="text-[#1E88E5]"
                  />
                  <span>{spotWeather.windDirectionText.split(' ')[0]}</span>
                </div>
              </div>

              <div className="bg-[#191c24] p-1.5 rounded-lg border border-[#252a36]">
                <div className="text-[10px] text-gray-400">기온 / 상태</div>
                <div className="text-xs font-bold text-gray-200">
                  {spotWeather.temperature}°C
                </div>
              </div>
            </div>
          ) : (
            <div className="py-2 text-center text-gray-500 text-[11px]">기상 데이터 조회 중...</div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            id="btn-apply-location"
            onClick={handleApplyLocation}
            className="h-[42px] bg-[#252a36] hover:bg-[#2f3545] text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors"
          >
            <MapPin size={14} className="text-[#00E676]" />
            <span>이 위치를 비행지로 설정</span>
          </button>

          <button
            id="btn-map-takeoff"
            onClick={() => {
              handleApplyLocation();
              onTakeoff();
            }}
            disabled={checkResult.badgeColor === 'danger'}
            className={`h-[42px] font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-md ${
              checkResult.badgeColor === 'danger'
                ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                : 'bg-[#1E88E5] hover:bg-[#1976D2] text-white'
            }`}
          >
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M2.5 19h19v2h-19zm19.57-9.36c-.21-.8-1.04-1.28-1.84-1.06L14.92 10l-6.9-6.4-1.92.51 4.25 7.42-4.57 1.22-1.98-1.54-1.4.38 1.47 3.65 1.54.41 13.91-3.72c.79-.22 1.27-1.04 1.05-1.84z" />
            </svg>
            <span>이 위치에서 이륙 (Takeoff)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
