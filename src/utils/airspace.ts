import { AirspaceZone, AirspaceCheckResult } from '../types';

export const KOREA_AIRSPACE_ZONES: AirspaceZone[] = [
  // 1. 비행 금지 구역 (Prohibited - P)
  {
    id: 'zone-p73',
    name: 'P-73 수도권 비행금지구역 (용산/청와대)',
    code: 'P-73',
    type: 'prohibited',
    typeLabel: '비행 금지 구역',
    description: '국가 중요 시설 및 대통령실 보호 구역. 미승인 비행 시 군사 작전 및 과태료 부과 대상.',
    lat: 37.5342,
    lng: 126.9782,
    radiusMeters: 3704, // 2NM inner core
    permissionRequired: true,
    approvalAuthority: '국방부 / 수도방위사령부',
    color: '#FF1744',
  },
  {
    id: 'zone-p518',
    name: 'P-518 휴전선 접경 비행금지구역',
    code: 'P-518',
    type: 'prohibited',
    typeLabel: '비행 금지 구역',
    description: '군사분계선(MDL) 인근 민통선 북방 한계 구역. 민간 무인비행장치 비행 엄격 금지.',
    lat: 37.9500,
    lng: 126.9000,
    radiusMeters: 15000,
    permissionRequired: true,
    approvalAuthority: '합동참모본부 / 관할 군단',
    color: '#FF1744',
  },
  {
    id: 'zone-p61',
    name: 'P-61 고리·새울 원자력발전소',
    code: 'P-61',
    type: 'prohibited',
    typeLabel: '원전 비행금지구역',
    description: '국가 핵심 기반 시설(원자력 발전소). 반경 내 미승인 비행 엄격 금지.',
    lat: 35.3217,
    lng: 129.2942,
    radiusMeters: 18520, // 10NM
    permissionRequired: true,
    approvalAuthority: '원자력안전위원회 / 관할 군부대',
    color: '#FF1744',
  },
  {
    id: 'zone-p62',
    name: 'P-62 월성 원자력발전소',
    code: 'P-62',
    type: 'prohibited',
    typeLabel: '원전 비행금지구역',
    description: '국가 보안시설 경주 월성 원전 상공.',
    lat: 35.7128,
    lng: 129.4756,
    radiusMeters: 18520,
    permissionRequired: true,
    approvalAuthority: '원자력안전위원회 / 관할 군부대',
    color: '#FF1744',
  },
  {
    id: 'zone-p63',
    name: 'P-63 한빛(영광) 원자력발전소',
    code: 'P-63',
    type: 'prohibited',
    typeLabel: '원전 비행금지구역',
    description: '전남 영광 한빛 원자력 발전소 상공.',
    lat: 35.4150,
    lng: 126.4214,
    radiusMeters: 18520,
    permissionRequired: true,
    approvalAuthority: '원자력안전위원회 / 관할 군부대',
    color: '#FF1744',
  },
  {
    id: 'zone-p64',
    name: 'P-64 한울(울진) 원자력발전소',
    code: 'P-64',
    type: 'prohibited',
    typeLabel: '원전 비행금지구역',
    description: '경북 울진 한울 원자력 발전소 상공.',
    lat: 37.0950,
    lng: 129.3833,
    radiusMeters: 18520,
    permissionRequired: true,
    approvalAuthority: '원자력안전위원회 / 관할 군부대',
    color: '#FF1744',
  },
  {
    id: 'zone-p65',
    name: 'P-65 한국원자력연구원 (대전 유성)',
    code: 'P-65',
    type: 'prohibited',
    typeLabel: '원전 연구 비행금지구역',
    description: '대전 대덕연구개발특구 내 한국원자력연구원 주변.',
    lat: 36.3883,
    lng: 127.3697,
    radiusMeters: 3704,
    permissionRequired: true,
    approvalAuthority: '원자력안전위원회 / 국방부',
    color: '#FF1744',
  },

  // 2. 공항 관제권 (Control Zone - 관제탑 반경 9.3km / 5NM)
  {
    id: 'zone-rkss',
    name: '김포국제공항 관제권 (RKSS)',
    code: 'RKSS CTR',
    type: 'control_zone',
    typeLabel: '공항 관제권',
    description: '항공기 이착륙 안전을 위한 관제 구역. 반경 9.3km 이내 비행 승인 필수(드론원스탑).',
    lat: 37.5583,
    lng: 126.7906,
    radiusMeters: 9300,
    permissionRequired: true,
    approvalAuthority: '서울지방항공청 / 김포관제탑',
    color: '#FF9100',
  },
  {
    id: 'zone-rksm',
    name: '서울공항(성남) 군 관제권 (RKSM)',
    code: 'RKSM CTR',
    type: 'control_zone',
    typeLabel: '군 비행장 관제권',
    description: '공군 제15특수임무비행단 관제 구역. 강남·송파·성남 일대 포함. 사전 승인 필수.',
    lat: 37.4447,
    lng: 127.1108,
    radiusMeters: 9300,
    permissionRequired: true,
    approvalAuthority: '공군 제15특수임무비행단',
    color: '#FF9100',
  },
  {
    id: 'zone-rksi',
    name: '인천국제공항 관제권 (RKSI)',
    code: 'RKSI CTR',
    type: 'control_zone',
    typeLabel: '국제공항 관제권',
    description: '대한민국 주 관문 공항. 영종도 전역 및 인근 해상 비행 승인 필수.',
    lat: 37.4692,
    lng: 126.4505,
    radiusMeters: 9300,
    permissionRequired: true,
    approvalAuthority: '서울지방항공청 / 인천관제탑',
    color: '#FF9100',
  },
  {
    id: 'zone-rkpc',
    name: '제주국제공항 관제권 (RKPC)',
    code: 'RKPC CTR',
    type: 'control_zone',
    typeLabel: '공항 관제권',
    description: '제주 시내 및 해안가 인근 관제 구역. 사전 비행 승인 필수.',
    lat: 33.5113,
    lng: 126.4930,
    radiusMeters: 9300,
    permissionRequired: true,
    approvalAuthority: '제주지방항공청',
    color: '#FF9100',
  },
  {
    id: 'zone-rkpk',
    name: '김해국제공항 관제권 (RKPK)',
    code: 'RKPK CTR',
    type: 'control_zone',
    typeLabel: '공항 관제권',
    description: '부산 강서구 및 낙동강 하류 관제 구역. 사전 승인 필수.',
    lat: 35.1795,
    lng: 128.9382,
    radiusMeters: 9300,
    permissionRequired: true,
    approvalAuthority: '부산지방항공청 / 공군 김해기지',
    color: '#FF9100',
  },

  // 3. 비행 승인 불필요 - 드론 전용 공원 (Drone Parks)
  {
    id: 'park-gwangnaru',
    name: '광나루 한강 드론공원 (서울)',
    code: 'DRONE-PARK-01',
    type: 'drone_park',
    typeLabel: '드론 전용 비행장',
    description: '서울 한강사업본부 인가 공식 드론공원. 12kg 이하 기체 150m 미만 자유 비행 가능 (예약제 운영).',
    lat: 37.5512,
    lng: 127.1265,
    radiusMeters: 500,
    permissionRequired: false,
    approvalAuthority: '서울특별시 한강사업본부 (자유 비행 구역)',
    color: '#00E676',
  },
  {
    id: 'park-daedeok',
    name: '고양 대덕 한강 드론비행장',
    code: 'DRONE-PARK-02',
    type: 'drone_park',
    typeLabel: '드론 전용 비행장',
    description: '고양시 한강변 대덕 생태공원 내 드론 전용 비행장. 활주로 및 레이싱 코스 완비.',
    lat: 37.5872,
    lng: 126.8375,
    radiusMeters: 600,
    permissionRequired: false,
    approvalAuthority: '고양산업진흥원 (자유 비행 구역)',
    color: '#00E676',
  },
  {
    id: 'park-siheung',
    name: '시흥 배곧 드론 교육훈련센터',
    code: 'DRONE-PARK-03',
    type: 'drone_park',
    typeLabel: '드론 전용 비행장',
    description: '국가 자격 실기시험장 및 시민 자율 비행 구역. 안전 그물망 및 관제 시설 보유.',
    lat: 37.3712,
    lng: 126.7212,
    radiusMeters: 800,
    permissionRequired: false,
    approvalAuthority: '한국교통안전공단 / 시흥시',
    color: '#00E676',
  },
  {
    id: 'park-gapcheon',
    name: '대전 갑천 드론공원',
    code: 'DRONE-PARK-04',
    type: 'drone_park',
    typeLabel: '드론 전용 비행장',
    description: '대전 엑스포다리 하류 수변공원. 사전 승인 없이 상시 자유 비행 가능 구역.',
    lat: 36.3685,
    lng: 127.3789,
    radiusMeters: 450,
    permissionRequired: false,
    approvalAuthority: '대전광역시청 (자율 비행 구역)',
    color: '#00E676',
  },
];

export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function checkAirspace(lat: number, lng: number): AirspaceCheckResult {
  // 1. Check if inside a designated drone park first
  const parkMatch = KOREA_AIRSPACE_ZONES.find(
    (z) => z.type === 'drone_park' && calculateDistanceKm(lat, lng, z.lat, z.lng) * 1000 <= z.radiusMeters
  );
  if (parkMatch) {
    return {
      isSafe: true,
      statusText: '비행 가능 (드론 전용 공원)',
      badgeColor: 'safe',
      matchedZone: parkMatch,
      distanceToZoneKm: 0,
      details: `${parkMatch.name} 구역 내입니다. 별도 원스탑 승인 없이 고도 150m 미만 자율 비행이 가능합니다.`,
    };
  }

  // 2. Check if inside a prohibited zone
  const prohibitedMatch = KOREA_AIRSPACE_ZONES.find(
    (z) => z.type === 'prohibited' && calculateDistanceKm(lat, lng, z.lat, z.lng) * 1000 <= z.radiusMeters
  );
  if (prohibitedMatch) {
    return {
      isSafe: false,
      statusText: '비행 절대 금지 구역',
      badgeColor: 'danger',
      matchedZone: prohibitedMatch,
      distanceToZoneKm: 0,
      details: `[${prohibitedMatch.code}] ${prohibitedMatch.name} 반경 내입니다. 국방부/원안위의 특별 허가 없이 비행 시 법적 처벌(과태료/형사입건)을 받습니다.`,
    };
  }

  // 3. Check if inside an airport control zone
  const controlZoneMatch = KOREA_AIRSPACE_ZONES.find(
    (z) => z.type === 'control_zone' && calculateDistanceKm(lat, lng, z.lat, z.lng) * 1000 <= z.radiusMeters
  );
  if (controlZoneMatch) {
    return {
      isSafe: false,
      statusText: '공항 관제권 (비행 승인 필수)',
      badgeColor: 'caution',
      matchedZone: controlZoneMatch,
      distanceToZoneKm: 0,
      details: `[${controlZoneMatch.code}] ${controlZoneMatch.name} (반경 9.3km) 내입니다. '드론원스탑' 민원서비스에서 지방항공청의 사전 비행 승인을 득해야 합니다.`,
    };
  }

  // 4. If outside, find the closest restricted or prohibited zone to give warning proximity
  let closestZone: AirspaceZone | null = null;
  let minDistanceKm = Infinity;

  KOREA_AIRSPACE_ZONES.forEach((z) => {
    if (z.type !== 'drone_park') {
      const dist = calculateDistanceKm(lat, lng, z.lat, z.lng);
      if (dist < minDistanceKm) {
        minDistanceKm = dist;
        closestZone = z;
      }
    }
  });

  const roundedDist = Math.round(minDistanceKm * 10) / 10;

  return {
    isSafe: true,
    statusText: '일반 개방 공역 (비행 가능)',
    badgeColor: 'safe',
    matchedZone: closestZone,
    distanceToZoneKm: roundedDist,
    details: `관제권 및 비행금지구역 외곽입니다. 조종자 준수사항(고도 150m 이하, 시계비행, 야간비행 금지) 준수 시 비행 승인 없이 비행 가능합니다. (가장 가까운 제한구역: ${closestZone?.name} 약 ${roundedDist}km)`,
  };
}
