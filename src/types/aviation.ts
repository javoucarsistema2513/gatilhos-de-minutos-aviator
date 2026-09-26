export type SpeedUnit = 'kt' | 'kmh' | 'mph';
export type AltitudeUnit = 'ft' | 'm';
export type PressureUnit = 'hPa' | 'inHg';
export type FuelUnit = 'gal' | 'liters' | 'lbs' | 'kg';
export type FuelType = 'avgas' | 'jetA1'; // Avgas: 6.0 lbs/gal (0.72 kg/L), Jet-A1: 6.7 lbs/gal (0.804 kg/L)

export interface WindTriangleInput {
  desiredTrack: number; // 0 - 359 degrees
  trueAirspeed: number; // knots
  windDirection: number; // 0 - 360 degrees (wind FROM)
  windSpeed: number; // knots
}

export interface WindTriangleResult {
  windCorrectionAngle: number; // degrees (- left, + right)
  trueHeading: number; // 0 - 359 degrees
  groundSpeed: number; // knots
  crosswind: number; // knots (+ right, - left)
  headwind: number; // knots (+ headwind, - tailwind)
  isImpossible: boolean; // if wind exceeds TAS
}

export interface RunwayWindInput {
  runwayHeading: number; // 010 - 360 degrees
  windDirection: number; // 0 - 360 degrees
  windSpeed: number; // knots
  windGust?: number; // knots
  maxCrosswindLimit: number; // knots (e.g., 15 kt for C172)
}

export interface RunwayWindResult {
  relativeAngle: number; // -180 to +180
  crosswind: number; // knots
  headwind: number; // knots (+ headwind, - tailwind)
  gustCrosswind?: number; // knots
  gustHeadwind?: number; // knots
  crosswindSide: 'left' | 'right' | 'direct';
  headwindType: 'headwind' | 'tailwind' | 'calm';
  isCrosswindExceeded: boolean;
  isTailwindAlert: boolean; // tailwind > 5 or 10 kt
}

export interface AltitudePerformanceInput {
  indicatedAltitude: number; // ft
  qnh: number; // inHg or hPa
  qnhUnit: PressureUnit;
  oatCelsius: number; // °C
  casKt: number; // calibrated airspeed in kt
}

export interface AltitudePerformanceResult {
  pressureAltitude: number; // ft
  densityAltitude: number; // ft
  isaTemp: number; // °C
  isaDeviation: number; // °C
  trueAirspeed: number; // kt
  trueAirspeedKmh: number; // km/h
  machNumber: number;
  speedOfSound: number; // kt
  takeoffRollIncreasePct: number; // rough estimate based on DA
  rateOfClimbDegradationPct: number; // rough estimate based on DA
}

export interface DescentInput {
  cruiseAltitude: number; // ft
  targetAltitude: number; // ft
  groundSpeed: number; // kt
  descentAngleDeg: number; // typically 3.0°
  targetRateFpm?: number; // optional direct VSI in ft/min
}

export interface DescentResult {
  altitudeToLose: number; // ft
  todDistanceNm: number; // NM before target waypoint
  descentTimeMin: number; // minutes
  requiredVsiFpm: number; // ft/min
  gradientFtPerNm: number; // ft/NM
  gradientPct: number; // %
}

export interface FuelPlanningInput {
  fuelOnBoard: number; // quantity in current unit
  fuelUnit: FuelUnit;
  fuelType: FuelType;
  fuelBurnRatePerHour: number; // per hour in current unit
  distanceNm: number; // NM
  groundSpeed: number; // kt
  reserveMinutes: number; // 30 (VFR day), 45 (VFR night / IFR)
}

export interface FuelPlanningResult {
  totalEnduranceHours: number; // decimal hours
  totalEnduranceString: string; // HH:MM
  eteHours: number; // decimal hours
  eteString: string; // HH:MM
  tripFuelBurn: number;
  reserveFuelRequired: number;
  fuelRemainingAtDestination: number;
  isReserveIntact: boolean;
  isFuelExhausted: boolean;
  maxRangeNm: number;
}

export interface WeightStation {
  id: string;
  name: string;
  weight: number; // lbs
  arm: number; // inches from datum
  maxWeight?: number;
}

export interface AircraftPreset {
  id: string;
  name: string;
  category: string;
  cruiseSpeedKt: number;
  fuelBurnGph: number;
  maxCrosswindKt: number;
  bewLbs: number;
  bewArm: number;
  mtowLbs: number;
  cgForwardLimit: number; // inches
  cgAftLimit: number; // inches
  stations: WeightStation[];
}
