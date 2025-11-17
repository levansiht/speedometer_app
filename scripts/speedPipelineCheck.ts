import {
  calculateSpeedFromDelta,
  resetSpeedCalculationState,
} from '../src/utils/speedMath';
import { SpeedFilter } from '../src/utils/speedFilter';

type TestResult = {
  name: string;
  passed: boolean;
  details: string;
};

const BASE_POINT = {
  latitude: 10.762622,
  longitude: 106.660172,
};

const ONE_DEGREE_LAT_METERS = 111320;

function moveNorth(point: typeof BASE_POINT, meters: number) {
  return {
    latitude: point.latitude + meters / ONE_DEGREE_LAT_METERS,
    longitude: point.longitude,
  };
}

function moveEast(point: typeof BASE_POINT, meters: number) {
  const metersPerDegreeLon =
    ONE_DEGREE_LAT_METERS * Math.cos((point.latitude * Math.PI) / 180);
  return {
    latitude: point.latitude,
    longitude: point.longitude + meters / metersPerDegreeLon,
  };
}

function approxEqual(a: number, b: number, tolerance: number) {
  return Math.abs(a - b) <= tolerance;
}

function runDdDtBaseline(): TestResult {
  resetSpeedCalculationState();
  const startTime = 0;
  calculateSpeedFromDelta(BASE_POINT, startTime);
  const nextPoint = moveNorth(BASE_POINT, 100);
  const speed = calculateSpeedFromDelta(nextPoint, startTime + 5000);
  const expected = 20;
  const passed = approxEqual(speed, expected, 0.3);

  return {
    name: 'dd/dt 100m over 5s',
    passed,
    details: `expected ≈${expected.toFixed(
      1
    )} m/s, received ${speed.toFixed(3)} m/s`,
  };
}

function runDdDtHighway(): TestResult {
  resetSpeedCalculationState();
  const startTime = 0;
  calculateSpeedFromDelta(BASE_POINT, startTime);
  const fastPoint = moveNorth(BASE_POINT, 27.78);
  const speed = calculateSpeedFromDelta(fastPoint, startTime + 1000);
  const expected = 27.78;
  const passed = approxEqual(speed, expected, 0.5);

  return {
    name: 'dd/dt 100km/h snapshot',
    passed,
    details: `expected ≈${expected.toFixed(
      2
    )} m/s, received ${speed.toFixed(3)} m/s`,
  };
}

function runFilterConvergence(): TestResult {
  const filter = new SpeedFilter();
  let timestamp = 0;
  let location = BASE_POINT;
  let filtered = 0;
  const targetSpeed = 15;

  for (let i = 0; i < 10; i++) {
    location = moveNorth(location, targetSpeed);
    timestamp += 1000;
    filtered = filter.filter(targetSpeed, 5, location, timestamp);
  }

  const passed = approxEqual(filtered, targetSpeed, 0.8);

  return {
    name: 'Kalman + EMA convergence',
    passed,
    details: `target ${targetSpeed} m/s, filtered ${filtered.toFixed(3)} m/s`,
  };
}

function runPoorAccuracyRejection(): TestResult {
  const filter = new SpeedFilter();
  const timestamp = 0;
  const baseline = filter.filter(12, 5, BASE_POINT, timestamp + 1000);
  const noisy = filter.filter(5, 120, BASE_POINT, timestamp + 2000);
  const passed = approxEqual(noisy, baseline, 1e-6);

  return {
    name: 'Reject poor GPS accuracy',
    passed,
    details: `baseline ${baseline.toFixed(3)} m/s, noisy ${noisy.toFixed(
      3
    )} m/s`,
  };
}

function runSpeedJumpRejection(): TestResult {
  const filter = new SpeedFilter();
  let timestamp = 0;
  let location = BASE_POINT;
  const stable = filter.filter(12, 5, location, (timestamp += 1000));
  location = moveNorth(location, 12);
  const reference = filter.filter(13, 5, location, (timestamp += 1000));
  location = moveNorth(location, 30);
  const jump = filter.filter(30, 5, location, (timestamp += 1000));
  const passed = approxEqual(jump, reference, 1e-6) || approxEqual(jump, stable, 1e-6);

  return {
    name: 'Reject sudden speed jump',
    passed,
    details: `reference ${reference.toFixed(
      3
    )} m/s, jump output ${jump.toFixed(3)} m/s`,
  };
}

function runGpsJumpRejection(): TestResult {
  const filter = new SpeedFilter();
  const start = filter.filter(5, 5, BASE_POINT, 1000);
  const jumpPoint = moveEast(BASE_POINT, 50);
  const jump = filter.filter(5, 5, jumpPoint, 1050);
  const passed = approxEqual(jump, start, 1e-6);

  return {
    name: 'Reject impossible GPS jump',
    passed,
    details: `start ${start.toFixed(3)} m/s, jump ${jump.toFixed(3)} m/s`,
  };
}

function runUnrealisticClamp(): TestResult {
  const filter = new SpeedFilter();
  const result = filter.filter(80, 5, BASE_POINT, 1000);
  const passed = result <= 55.5 + 1e-6;

  return {
    name: 'Clamp unrealistic speeds',
    passed,
    details: `filtered ${result.toFixed(3)} m/s`,
  };
}

function runStationarySnap(): TestResult {
  const filter = new SpeedFilter();
  let location = BASE_POINT;
  let timestamp = 0;
  filter.filter(1, 5, location, (timestamp += 1000));
  let result = 0;
  for (let i = 0; i < 8; i++) {
    location = moveNorth(location, 0.05);
    result = filter.filter(0.05, 5, location, (timestamp += 1000));
  }
  result = filter.filter(0, 5, location, (timestamp += 1000));
  const passed = result === 0;

  return {
    name: 'Snap to zero when stationary',
    passed,
    details: `filtered ${result.toFixed(3)} m/s`,
  };
}

function main() {
  const tests = [
    runDdDtBaseline,
    runDdDtHighway,
    runFilterConvergence,
    runPoorAccuracyRejection,
    runSpeedJumpRejection,
    runGpsJumpRejection,
    runUnrealisticClamp,
    runStationarySnap,
  ];

  const results = tests.map((test) => test());
  const failed = results.filter((result) => !result.passed);

  results.forEach((result) => {
    const status = result.passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} - ${result.name} :: ${result.details}`);
  });

  if (failed.length) {
    console.error(`\n${failed.length} scenario(s) failed. Review the outputs above.`);
    process.exit(1);
  }

  console.log('\nAll speed pipeline checks passed.');
}

main();

