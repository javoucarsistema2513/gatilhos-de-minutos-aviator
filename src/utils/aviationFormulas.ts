import {
  WindTriangleInput,
  WindTriangleResult,
  RunwayWindInput,
  RunwayWindResult,
  AltitudePerformanceInput,
  AltitudePerformanceResult,
  DescentInput,
  DescentResult,
  FuelPlanningInput,
  FuelPlanningResult,
} from '../types/aviation';

/**
 * Degrees to Radians
 */
export function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * Radians to Degrees
 */
export function toDeg(rad: number): number {
  return (rad * 180) / Math.PI;
}

/**
 * Normalize angle to 0 - 359.99 degrees
 */
export function normalizeHeading(deg: number): number {
  let h = deg % 360;
  if (h < 0) h += 360;
  return h;
}

/**
 * Calculates the Wind Triangle (E6B Navigation Computer)
 * Real-time calculation of WCA, True Heading, Ground Speed, Crosswind & Headwind.
 */
export function calculateWindTriangle(input: WindTriangleInput): WindTriangleResult {
  const track = normalizeHeading(input.desiredTrack);
  const tas = Math.max(1, input.trueAirspeed);
  const windDir = normalizeHeading(input.windDirection);
  const windSpeed = Math.max(0, input.windSpeed);

  // Relative wind angle theta = WindDir - Track
  // Wind direction is WHERE IT BLOWS FROM
  const angleDiff = normalizeHeading(windDir - track);
  const angleDiffRad = toRad(angleDiff);

  // Components relative to track:
  // Headwind > 0 (blowing in the face), Tailwind < 0
  const headwind = windSpeed * Math.cos(angleDiffRad);
  // Crosswind from right > 0, from left < 0
  const crosswind = windSpeed * Math.sin(angleDiffRad);

  // sin(WCA) = crosswind / TAS
  const sinWca = crosswind / tas;

  if (Math.abs(sinWca) > 1) {
    // Wind is too strong, cannot hold course
    return {
      windCorrectionAngle: 0,
      trueHeading: track,
      groundSpeed: 0,
      crosswind: Math.round(crosswind * 10) / 10,
      headwind: Math.round(headwind * 10) / 10,
      isImpossible: true,
    };
  }

  const wcaRad = Math.asin(sinWca);
  const wcaDeg = toDeg(wcaRad);

  // True Heading = Track + WCA
  const trueHeading = normalizeHeading(track + wcaDeg);

  // Ground Speed = TAS * cos(WCA) - Headwind
  const groundSpeed = Math.max(0, tas * Math.cos(wcaRad) - headwind);

  return {
    windCorrectionAngle: Math.round(wcaDeg * 10) / 10,
    trueHeading: Math.round(trueHeading),
    groundSpeed: Math.round(groundSpeed * 10) / 10,
    crosswind: Math.round(crosswind * 10) / 10,
    headwind: Math.round(headwind * 10) / 10,
    isImpossible: false,
  };
}

/**
 * Calculates Runway Crosswind & Headwind/Tailwind Components
 */
export function calculateRunwayWind(input: RunwayWindInput): RunwayWindResult {
  const rwyHdg = normalizeHeading(input.runwayHeading);
  const windDir = normalizeHeading(input.windDirection);
  const windSpeed = Math.max(0, input.windSpeed);
  const gust = input.windGust && input.windGust > windSpeed ? input.windGust : undefined;

  // Angle difference between runway direction and wind FROM direction
  let angleDiff = windDir - rwyHdg;
  while (angleDiff > 180) angleDiff -= 360;
  while (angleDiff < -180) angleDiff += 360;

  const angleRad = toRad(angleDiff);

  const headwind = windSpeed * Math.cos(angleRad);
  const crosswind = Math.abs(windSpeed * Math.sin(angleRad));

  let gustHeadwind: number | undefined;
  let gustCrosswind: number | undefined;

  if (gust) {
    gustHeadwind = Math.round(gust * Math.cos(angleRad) * 10) / 10;
    gustCrosswind = Math.round(Math.abs(gust * Math.sin(angleRad)) * 10) / 10;
  }

  const crosswindSide: 'left' | 'right' | 'direct' =
    Math.sin(angleRad) > 0.05 ? 'right' : Math.sin(angleRad) < -0.05 ? 'left' : 'direct';

  const headwindType: 'headwind' | 'tailwind' | 'calm' =
    headwind > 0.5 ? 'headwind' : headwind < -0.5 ? 'tailwind' : 'calm';

  const effectiveCrosswind = gustCrosswind || crosswind;
  const isCrosswindExceeded = effectiveCrosswind > input.maxCrosswindLimit;
  // Tailwind > 5 kt is a caution, > 10 kt is dangerous
  const isTailwindAlert = headwind < -5;

  return {
    relativeAngle: Math.round(angleDiff),
    crosswind: Math.round(crosswind * 10) / 10,
    headwind: Math.round(headwind * 10) / 10,
    gustCrosswind,
    gustHeadwind,
    crosswindSide,
    headwindType,
    isCrosswindExceeded,
    isTailwindAlert,
  };
}

/**
 * Calculates Pressure Altitude, Density Altitude, TAS & Mach
 */
export function calculateAltitudePerformance(
  input: AltitudePerformanceInput
): AltitudePerformanceResult {
  const alt = input.indicatedAltitude;
  // Convert QNH to inHg and hPa
  let qnhHpa = input.qnh;
  if (input.qnhUnit === 'inHg') {
    qnhHpa = input.qnh * 33.863886666667;
  }

  // Pressure altitude: PA = Alt + (1013.25 - QNH_hPa) * 30 (or exact ICAO formula)
  // Exact barometric formula:
  const pressureAltitude = alt + (1013.25 - qnhHpa) * 30;

  // ISA standard temperature at pressure altitude: 15°C - 1.98°C per 1000 ft
  const isaTemp = 15 - 1.98 * (pressureAltitude / 1000);
  const isaDeviation = input.oatCelsius - isaTemp;

  // Density Altitude: DA = PA + 118.8 * (OAT - ISA_temp)
  const densityAltitude = pressureAltitude + 118.8 * isaDeviation;

  // Temperature in Kelvin:
  const oatKelvin = input.oatCelsius + 273.15;
  const isaKelvin = isaTemp + 273.15;

  // Local speed of sound: a = 38.967 * sqrt(T_Kelvin) knots
  const speedOfSound = 38.967 * Math.sqrt(Math.max(1, oatKelvin));

  // True Airspeed (TAS)
  // Standard atmospheric density ratio approximation:
  // rho / rho0 = (P / P0) * (T0 / T)
  // TAS = CAS * sqrt(rho0 / rho)
  const pRatio = Math.pow(Math.max(0.01, 1 - 0.0000068756 * pressureAltitude), 5.2559);
  const tRatio = Math.max(0.1, oatKelvin / (15 + 273.15));
  const densityRatio = Math.max(0.01, pRatio / tRatio);
  const tas = input.casKt / Math.sqrt(densityRatio);

  const machNumber = tas / speedOfSound;

  // Rough estimation of performance impact:
  // Decolagem: ~10% de aumento no comprimento de pista para cada 1000 ft de DA acima do nível do mar
  const daOverSeaLevel = Math.max(0, densityAltitude);
  const takeoffRollIncreasePct = Math.round((daOverSeaLevel / 1000) * 10 * 10) / 10;
  // Razão de subida degrada ~7% por 1000 ft de DA
  const rateOfClimbDegradationPct = Math.min(100, Math.round((daOverSeaLevel / 1000) * 7 * 10) / 10);

  return {
    pressureAltitude: Math.round(pressureAltitude),
    densityAltitude: Math.round(densityAltitude),
    isaTemp: Math.round(isaTemp * 10) / 10,
    isaDeviation: Math.round(isaDeviation * 10) / 10,
    trueAirspeed: Math.round(tas * 10) / 10,
    trueAirspeedKmh: Math.round(tas * 1.852 * 10) / 10,
    machNumber: Math.round(machNumber * 1000) / 1000,
    speedOfSound: Math.round(speedOfSound * 10) / 10,
    takeoffRollIncreasePct,
    rateOfClimbDegradationPct,
  };
}

/**
 * Calculates Top of Descent (TOD) and Required Descent Rate
 */
export function calculateDescent(input: DescentInput): DescentResult {
  const altToLose = Math.max(0, input.cruiseAltitude - input.targetAltitude);
  const gs = Math.max(20, input.groundSpeed);
  const angleDeg = Math.max(0.5, Math.min(10, input.descentAngleDeg));

  // If user provided targetRateFpm, calculate distance based on that:
  let todDistanceNm: number;
  let requiredVsiFpm: number;
  let descentTimeMin: number;

  if (input.targetRateFpm && input.targetRateFpm > 0) {
    requiredVsiFpm = input.targetRateFpm;
    descentTimeMin = altToLose / requiredVsiFpm;
    todDistanceNm = (descentTimeMin / 60) * gs;
  } else {
    // 3° standard glideslope = ~318 ft per NM (tan(3°) * 6076.115 ft/NM = 318.4 ft/NM)
    // Distance = altToLose / (tan(angle) * 6076.115)
    const ftPerNm = Math.tan(toRad(angleDeg)) * 6076.115;
    todDistanceNm = altToLose / ftPerNm;
    descentTimeMin = (todDistanceNm / gs) * 60;
    requiredVsiFpm = descentTimeMin > 0 ? altToLose / descentTimeMin : 0;
  }

  const gradientFtPerNm = todDistanceNm > 0 ? altToLose / todDistanceNm : 0;
  const gradientPct = (gradientFtPerNm / 6076.115) * 100;

  return {
    altitudeToLose: Math.round(altToLose),
    todDistanceNm: Math.round(todDistanceNm * 10) / 10,
    descentTimeMin: Math.round(descentTimeMin * 10) / 10,
    requiredVsiFpm: Math.round(requiredVsiFpm),
    gradientFtPerNm: Math.round(gradientFtPerNm),
    gradientPct: Math.round(gradientPct * 10) / 10,
  };
}

/**
 * Calculates Fuel Endurance, ETE, Burn & Reserves
 */
export function calculateFuel(input: FuelPlanningInput): FuelPlanningResult {
  const fuelQty = Math.max(0, input.fuelOnBoard);
  const burnRate = Math.max(0.1, input.fuelBurnRatePerHour);
  const distance = Math.max(0, input.distanceNm);
  const gs = Math.max(10, input.groundSpeed);

  // Total endurance in hours
  const totalEnduranceHours = fuelQty / burnRate;
  const enduranceHrsInt = Math.floor(totalEnduranceHours);
  const enduranceMinsInt = Math.round((totalEnduranceHours - enduranceHrsInt) * 60);
  const totalEnduranceString = `${enduranceHrsInt}h ${String(enduranceMinsInt).padStart(2, '0')}m`;

  // Estimated Time Enroute (ETE)
  const eteHours = distance / gs;
  const eteHrsInt = Math.floor(eteHours);
  const eteMinsInt = Math.round((eteHours - eteHrsInt) * 60);
  const eteString = `${eteHrsInt}h ${String(eteMinsInt).padStart(2, '0')}m`;

  // Trip fuel burn
  const tripFuelBurn = eteHours * burnRate;

  // Regulatory Reserve fuel
  const reserveHours = input.reserveMinutes / 60;
  const reserveFuelRequired = reserveHours * burnRate;

  // Remaining fuel upon arrival
  const fuelRemainingAtDestination = fuelQty - tripFuelBurn;

  const isFuelExhausted = fuelRemainingAtDestination <= 0;
  const isReserveIntact = fuelRemainingAtDestination >= reserveFuelRequired;

  // Maximum Range in Still Air
  const maxRangeNm = totalEnduranceHours * gs;

  return {
    totalEnduranceHours: Math.round(totalEnduranceHours * 100) / 100,
    totalEnduranceString,
    eteHours: Math.round(eteHours * 100) / 100,
    eteString,
    tripFuelBurn: Math.round(tripFuelBurn * 10) / 10,
    reserveFuelRequired: Math.round(reserveFuelRequired * 10) / 10,
    fuelRemainingAtDestination: Math.round(fuelRemainingAtDestination * 10) / 10,
    isReserveIntact,
    isFuelExhausted,
    maxRangeNm: Math.round(maxRangeNm),
  };
}

/**
 * Presets of common general aviation & turboprop aircraft
 */
export const AIRCRAFT_PRESETS = [
  {
    id: 'c172',
    name: 'Cessna 172 Skyhawk',
    category: 'Monomotor a Pistão',
    cruiseSpeedKt: 115,
    fuelBurnGph: 8.5,
    maxCrosswindKt: 15,
    bewLbs: 1650,
    bewArm: 39.5,
    mtowLbs: 2550,
    cgForwardLimit: 35.0,
    cgAftLimit: 47.3,
    stations: [
      { id: 'bew', name: 'Peso Vazio Básico (BEW)', weight: 1650, arm: 39.5 },
      { id: 'front', name: 'Piloto e Copiloto (Assentos Dianteiros)', weight: 340, arm: 37.0, maxWeight: 400 },
      { id: 'rear', name: 'Passageiros Traseiros', weight: 160, arm: 73.0, maxWeight: 400 },
      { id: 'fuel', name: 'Combustível Útil (53 gal @ 6 lbs/gal)', weight: 240, arm: 47.9, maxWeight: 318 },
      { id: 'baggage1', name: 'Bagageiro Área 1', weight: 40, arm: 95.0, maxWeight: 120 },
      { id: 'baggage2', name: 'Bagageiro Área 2', weight: 0, arm: 123.0, maxWeight: 50 },
    ],
  },
  {
    id: 'pa28',
    name: 'Piper PA-28-181 Archer',
    category: 'Monomotor a Pistão',
    cruiseSpeedKt: 125,
    fuelBurnGph: 10.0,
    maxCrosswindKt: 17,
    bewLbs: 1600,
    bewArm: 87.0,
    mtowLbs: 2550,
    cgForwardLimit: 82.0,
    cgAftLimit: 93.0,
    stations: [
      { id: 'bew', name: 'Peso Vazio Básico (BEW)', weight: 1600, arm: 87.0 },
      { id: 'front', name: 'Assentos Dianteiros', weight: 340, arm: 80.5, maxWeight: 400 },
      { id: 'rear', name: 'Assentos Traseiros', weight: 150, arm: 118.1, maxWeight: 400 },
      { id: 'fuel', name: 'Combustível (48 gal @ 6 lbs/gal)', weight: 288, arm: 95.0, maxWeight: 288 },
      { id: 'baggage', name: 'Compartimento de Bagagem', weight: 30, arm: 142.8, maxWeight: 200 },
    ],
  },
  {
    id: 'be58',
    name: 'Beechcraft Baron 58',
    category: 'Bimotor a Pistão',
    cruiseSpeedKt: 195,
    fuelBurnGph: 32.0,
    maxCrosswindKt: 22,
    bewLbs: 3950,
    bewArm: 78.5,
    mtowLbs: 5500,
    cgForwardLimit: 74.0,
    cgAftLimit: 86.0,
    stations: [
      { id: 'bew', name: 'Peso Vazio Básico (BEW)', weight: 3950, arm: 78.5 },
      { id: 'front', name: 'Piloto & Copiloto', weight: 340, arm: 85.0, maxWeight: 400 },
      { id: 'middle', name: 'Passageiros Meio', weight: 170, arm: 121.0, maxWeight: 400 },
      { id: 'rear', name: 'Passageiros Traseiros', weight: 0, arm: 157.0, maxWeight: 400 },
      { id: 'fuel', name: 'Combustível (166 gal)', weight: 600, arm: 75.0, maxWeight: 996 },
      { id: 'nose_bag', name: 'Bagageiro Dianteiro (Nariz)', weight: 50, arm: 20.0, maxWeight: 300 },
      { id: 'aft_bag', name: 'Bagageiro Traseiro', weight: 40, arm: 180.0, maxWeight: 400 },
    ],
  },
  {
    id: 'tbm930',
    name: 'Daher TBM 930',
    category: 'Monomotor Turboélice',
    cruiseSpeedKt: 320,
    fuelBurnGph: 60.0,
    maxCrosswindKt: 20,
    bewLbs: 4629,
    bewArm: 188.0,
    mtowLbs: 7394,
    cgForwardLimit: 182.0,
    cgAftLimit: 195.0,
    stations: [
      { id: 'bew', name: 'Peso Vazio Básico (BEW)', weight: 4629, arm: 188.0 },
      { id: 'front', name: 'Cockpit (Piloto & Copiloto)', weight: 360, arm: 130.0, maxWeight: 440 },
      { id: 'pax', name: 'Cabine Passageiros', weight: 350, arm: 198.0, maxWeight: 800 },
      { id: 'fuel', name: 'Combustível Jet-A1 (282 gal @ 6.7 lbs)', weight: 1200, arm: 189.0, maxWeight: 1890 },
      { id: 'baggage', name: 'Bagagem Traseira', weight: 100, arm: 245.0, maxWeight: 300 },
    ],
  },
];
