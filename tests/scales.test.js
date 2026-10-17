import test from 'node:test';
import assert from 'node:assert/strict';
import { bodies } from '../src/data.js';
import { TRUE_SCALE_KM_PER_UNIT, getBodyDimensions } from '../src/scales.js';

const byId = Object.fromEntries(bodies.map(body => [body.id, body]));
const dimensions = (id, mode = 'real') => getBodyDimensions(byId[id], bodies, mode);
const approximately = (actual, expected, message) => {
  const tolerance = Math.max(Math.abs(expected) * 1e-12, 1e-14);
  assert.ok(Number.isFinite(actual), `${message}: expected a finite number`);
  assert.ok(Math.abs(actual - expected) <= tolerance,
    `${message}: expected ${expected}, received ${actual}`);
};

test('all 23 bodies use one kilometre unit for radius and parent-centre orbit', () => {
  assert.equal(bodies.length, 23, 'the complete first-version catalogue is covered');
  assert.equal(TRUE_SCALE_KM_PER_UNIT, 1000);
  for (const body of bodies) {
    const { radius, orbit } = getBodyDimensions(body, bodies, 'real');
    assert.ok(radius > 0, `${body.id}: nonzero radius`);
    assert.ok(orbit >= 0, `${body.id}: nonnegative orbit`);
    approximately(radius * TRUE_SCALE_KM_PER_UNIT, body.radiusKm,
      `${body.id}: recover physical radius`);
    approximately(orbit * TRUE_SCALE_KM_PER_UNIT, body.distanceKm,
      `${body.id}: recover distance from parent centre`);
    if (body.parent) {
      approximately(orbit / radius, body.distanceKm / body.radiusKm,
        `${body.id}: orbit and body size share a scale`);
    }
  }
});

test('Earth and Moon retain distance-to-diameter and relative diameter ratios', () => {
  const earth = dimensions('earth');
  const moon = dimensions('moon');
  approximately(moon.orbit / (2 * earth.radius),
    byId.moon.distanceKm / (2 * byId.earth.radiusKm),
    'Earth-Moon distance in Earth diameters');
  approximately(moon.orbit / (2 * moon.radius),
    byId.moon.distanceKm / (2 * byId.moon.radiusKm),
    'Earth-Moon distance in Moon diameters');
  approximately(earth.radius / moon.radius,
    byId.earth.radiusKm / byId.moon.radiusKm, 'Earth-Moon diameter ratio');
  assert.ok(moon.orbit > earth.radius + moon.radius,
    'Moon orbit is a centre distance and does not intersect Earth');
});

test('Sun and Earth retain distance-to-diameter and relative diameter ratios', () => {
  const sun = dimensions('sun');
  const earth = dimensions('earth');
  assert.equal(sun.orbit, 0, 'the Sun has no parent orbit');
  approximately(earth.orbit / (2 * sun.radius),
    149600000 / 1391400, 'Sun-Earth distance in solar diameters');
  approximately(earth.orbit / (2 * earth.radius),
    byId.earth.distanceKm / (2 * byId.earth.radiusKm),
    'Sun-Earth distance in Earth diameters');
  approximately(sun.radius / earth.radius,
    byId.sun.radiusKm / byId.earth.radiusKm, 'Sun-Earth diameter ratio');
});

test('Deimos is not clamped and Triton keeps a local Neptune-centred orbit', () => {
  const deimos = dimensions('deimos');
  approximately(deimos.radius, 0.0062, 'Deimos physical radius');
  approximately(deimos.orbit, 23.457, 'Deimos distance from Mars centre');
  assert.ok(deimos.radius < dimensions('deimos', 'observation').radius,
    'the smallest moon loses its observation-mode visibility enlargement');

  const triton = dimensions('triton');
  approximately(triton.radius, 1.3526, 'Triton physical radius');
  approximately(triton.orbit, 354.76, 'Triton distance from Neptune centre');
  approximately(dimensions('neptune').orbit, 4515000, 'outermost planet orbit');
  assert.ok(triton.orbit < dimensions('neptune').orbit / 1000,
    'satellite orbit does not include the heliocentric distance');
});

test('observation mode preserves its established compressed layout', () => {
  assert.deepEqual(dimensions('sun', 'observation'), { radius: 6.5, orbit: 0 });
  assert.deepEqual(dimensions('earth', 'observation'), { radius: 1.45, orbit: 37 });
  assert.deepEqual(dimensions('neptune', 'observation'), { radius: 2.4, orbit: 150 });
  approximately(dimensions('deimos', 'observation').radius, 0.14,
    'small moons retain the observation-mode minimum radius');
  for (const body of bodies) {
    assert.deepEqual(getBodyDimensions(body, bodies),
      getBodyDimensions(body, bodies, 'observation'),
      `${body.id}: default mode remains observation`);
  }
});

test('repeated switching computes both modes without drift or catalogue mutation', () => {
  const originalCatalogue = structuredClone(bodies);
  const observationBefore = bodies.map(body => getBodyDimensions(body, bodies, 'observation'));
  const realBefore = bodies.map(body => getBodyDimensions(body, bodies, 'real'));
  for (let round = 0; round < 3; round++) {
    assert.deepEqual(bodies.map(body => getBodyDimensions(body, bodies, 'observation')),
      observationBefore, `round ${round}: restore observation dimensions`);
    assert.deepEqual(bodies.map(body => getBodyDimensions(body, bodies, 'real')),
      realBefore, `round ${round}: restore real dimensions`);
  }
  assert.deepEqual(bodies, originalCatalogue, 'display calculations preserve source measurements');
});

test('unsupported scale modes fail explicitly', () => {
  for (const mode of ['invalid', 'size', 'REAL', '', null]) {
    assert.throws(() => getBodyDimensions(byId.earth, bodies, mode),
      `${String(mode)} must not silently select an unrelated scale`);
  }
});
