import test from 'node:test';
import assert from 'node:assert/strict';
import { bodies, bodyById } from '../src/data.js';
import { diameterRatio, sizeLayout, distancePosition, validateCatalog } from '../src/math.js';

function closeTo(actual, expected, relativeTolerance = 1e-10) {
  assert.ok(Number.isFinite(actual), 'calculation must return a finite number');
  const tolerance = relativeTolerance * Math.max(1, Math.abs(expected));
  assert.ok(Math.abs(actual - expected) <= tolerance,
    `expected ${actual} to be within ${tolerance} of ${expected}`);
}

test('catalog contains the agreed 23 unique bodies and valid parent relationships', () => {
  assert.equal(bodies.length, 23);
  assert.equal(new Set(bodies.map(body => body.id)).size, bodies.length);
  assert.equal(bodies.filter(body => body.type === 'star').length, 1);
  assert.equal(bodies.filter(body => body.type === 'planet').length, 8);
  assert.equal(bodies.filter(body => body.type === 'moon').length, 14);
  assert.equal(bodyById.sun.parent, null);

  for (const body of bodies) {
    if (body.type === 'planet') assert.equal(body.parent, 'sun', body.id);
    if (body.type === 'moon') assert.equal(bodyById[body.parent]?.type, 'planet', body.id);

    const visited = new Set();
    let current = body;
    while (current) {
      assert.ok(!visited.has(current.id), `parent cycle involving ${body.id}`);
      visited.add(current.id);
      if (current.parent == null) break;
      assert.ok(bodyById[current.parent], `missing parent for ${current.id}`);
      current = bodyById[current.parent];
    }
    assert.ok(visited.has('sun'), `${body.id} must ultimately belong to the Sun's system`);
  }
});

test('physical values remain finite and parented bodies have positive orbital values', () => {
  for (const body of bodies) {
    assert.ok(Number.isFinite(body.radiusKm) && body.radiusKm > 0, body.id);
    assert.ok(Number.isFinite(body.dayHours) && body.dayHours > 0, body.id);
    if (body.parent != null) {
      assert.ok(Number.isFinite(body.distanceKm) && body.distanceKm > 0, body.id);
      assert.ok(Number.isFinite(body.orbitalDays) && body.orbitalDays > 0, body.id);
    }
  }
  assert.equal(bodyById.sun.orbitalDays, 0);
  assert.equal(bodyById.sun.distanceKm, 0);
  assert.equal(bodyById.triton.retrograde, true);
});

test('planet distances increase in the familiar Mercury-to-Neptune order', () => {
  const order = ['mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune'];
  for (let i = 1; i < order.length; i++) {
    assert.ok(bodyById[order[i]].distanceKm > bodyById[order[i - 1]].distanceKm,
      `${order[i]} must be farther from the Sun than ${order[i - 1]}`);
  }
});

test('diameter comparison preserves Earth-Moon and Sun-Earth ratios', () => {
  const earthMoon = diameterRatio(bodyById.earth, bodyById.moon);
  assert.ok(earthMoon > 3.65 && earthMoon < 3.68, 'Earth is about 3.67 Moon diameters wide');
  const sunEarth = diameterRatio(bodyById.sun, bodyById.earth);
  assert.ok(sunEarth > 108 && sunEarth < 110, 'Sun is about 109 Earth diameters wide');
  closeTo(diameterRatio(bodyById.moon, bodyById.earth), earthMoon);
  closeTo(diameterRatio(bodyById.earth, bodyById.earth), 1);
});

for (const [firstId, secondId] of [
  ['earth', 'moon'],
  ['moon', 'earth'],
  ['sun', 'earth'],
  ['earth', 'sun'],
  ['earth', 'earth'],
]) {
  test(`size layout uses one linear scale for ${firstId} and ${secondId}`, () => {
    const first = bodyById[firstId];
    const second = bodyById[secondId];
    const layout = sizeLayout(first, second);
    assert.equal(layout.length, 2);
    assert.deepEqual(layout.map(item => item.id), [first.id, second.id]);
    for (const item of layout) {
      assert.ok(Number.isFinite(item.r) && item.r > 0, 'visible radius must remain positive');
      assert.ok(Number.isFinite(item.x) && Number.isFinite(item.y), 'centers must be finite');
    }
    closeTo(Math.max(...layout.map(item => item.r)), 3.25);
    closeTo(layout[0].r / layout[1].r, first.radiusKm / second.radiusKm);
    closeTo(layout[0].r / first.radiusKm, layout[1].r / second.radiusKm);
  });
}

test('distance placement has exact endpoints and preserves real distance differences', () => {
  const maxKm = bodyById.neptune.distanceKm;
  closeTo(distancePosition(0, maxKm), -12);
  closeTo(distancePosition(maxKm, maxKm), 12);
  closeTo(distancePosition(maxKm / 2, maxKm), 0);

  const stepKm = bodyById.earth.distanceKm;
  const p0 = distancePosition(0, maxKm);
  const p1 = distancePosition(stepKm, maxKm);
  const p2 = distancePosition(stepKm * 2, maxKm);
  const p4 = distancePosition(stepKm * 4, maxKm);
  closeTo(p1 - p0, p2 - p1);
  closeTo(p4 - p2, 2 * (p2 - p1));

  closeTo(distancePosition(0, maxKm, 60), -30);
  closeTo(distancePosition(maxKm, maxKm, 60), 30);
});

test('catalog validator accepts the delivered data and rejects structural corruption', () => {
  assert.equal(validateCatalog(bodies), true);
  const duplicate = [...bodies, { ...bodyById.earth }];
  const missingParent = bodies.map(body => body.id === 'moon' ? { ...body, parent: 'missing' } : body);
  const cycle = bodies.map(body => body.id === 'earth' ? { ...body, parent: 'moon' } : body);
  const invalidRadius = bodies.map(body => body.id === 'earth' ? { ...body, radiusKm: 0 } : body);
  const invalidPeriod = bodies.map(body => body.id === 'moon' ? { ...body, orbitalDays: -1 } : body);
  for (const [label, candidate] of Object.entries({ duplicate, missingParent, cycle, invalidRadius, invalidPeriod })) {
    assert.throws(() => validateCatalog(candidate), Error, `validator must report ${label}`);
  }
});
