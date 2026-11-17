import test from 'node:test';
import assert from 'node:assert/strict';
import { buildStrategy, calculateScore, normaliseSavedIds, opportunities, scoreWeights } from '../src/data/demo.js';
import { buildResearchRequest, createResearchDraft } from '../src/lib/research.js';
import { getGlobePose, spherePoints } from '../src/lib/globe.js';
import { isPublicUrl, readStored, validateReferences, writeStored } from '../src/lib/storage.js';
import { BackendUnavailableError, requestResearch } from '../src/services/api.js';

test('opportunity scoring uses the exact 30/25/20/15/10 framework', () => {
  assert.deepEqual(scoreWeights.map(item => item.weight), [30,25,20,15,10]);
  assert.equal(calculateScore({ demand: 100, trend: 0, difference: 0, gap: 0, evidence: 0 }), 30);
  assert.equal(calculateScore({ demand: 0, trend: 100, difference: 0, gap: 0, evidence: 0 }), 25);
  assert.equal(calculateScore(opportunities[0].scores), 87);
  assert.equal(calculateScore({ demand: 999, trend: -20, difference: 'oops' }), 30);
});
test('five opportunities are ranked by their calculated score', () => {
  assert.equal(opportunities.length, 5);
  assert.equal(new Set(opportunities.map(item => item.id)).size, 5);
  const scores = opportunities.map(item => calculateScore(item.scores));
  assert.deepEqual(scores, [...scores].sort((a,b) => b-a));
  for (const item of opportunities) assert.ok(item.angle && item.reasoning && item.confidence && item.format);
});
test('strategy has seven connected days and prioritises locally selected opportunities', () => {
  const plan = buildStrategy(['week-experiment']);
  assert.deepEqual(plan.map(item => item.day), [1,2,3,4,5,6,7]);
  assert.equal(plan[0].opportunityId, 'week-experiment');
  assert.equal(plan[3].kind, 'Research');
  assert.equal(plan[6].kind, 'Review');
  for (const day of plan) assert.ok(day.topic && day.platform && day.format && day.angle && day.objective && day.reason);
  assert.equal(buildStrategy(['unknown-id']).length, 7);
});
test('reference inputs allow public HTTP URLs and reject unsafe protocols', () => {
  assert.ok(isPublicUrl('https://www.youtube.com/@creator'));
  assert.ok(isPublicUrl(''));
  assert.equal(isPublicUrl('javascript:alert(1)'), false);
  assert.equal(isPublicUrl('file:///secret'), false);
  assert.equal(isPublicUrl('not a URL'), false);
  assert.ok(validateReferences({ channelUrl: 'https://youtube.com', competitors: 'https://example.com\njavascript:alert(1)' }));
  assert.equal(validateReferences({ channelUrl: '', competitors: 'https://example.com, https://youtube.com' }), '');
});

test('strategy objectives follow their topics for every first priority', () => {
  const expected = {
    'student-ai': 'Help viewers choose useful tools',
    'notes-workflow': 'Demonstrate a repeatable study workflow',
    'free-vs-paid': 'Address the budget question',
    'ai-mistakes': 'Teach a verification habit',
    'week-experiment': 'Build trust through a documented experiment',
  };
  for (const priority of opportunities) {
    const plan = buildStrategy([priority.id]);
    const publications = plan.filter(day => day.kind === 'Publish');
    assert.equal(publications.length, 5);
    assert.equal(new Set(publications.map(day => day.opportunityId)).size, 5);
    for (const day of publications) assert.equal(day.objective, expected[day.opportunityId]);
    assert.ok(plan[3].reason.includes(publications[0].topic));
    assert.ok(plan[3].reason.includes(publications[2].topic));
  }
  const budgetFirst = buildStrategy(['free-vs-paid']);
  assert.equal(budgetFirst[2].objective, expected['notes-workflow']);
  assert.equal(budgetFirst[3].format, 'Story question / audience feedback');
});

test('invalid and duplicate saved ideas cannot duplicate strategy topics', () => {
  assert.deepEqual(normaliseSavedIds(['free-vs-paid', 'unknown', 'free-vs-paid', null]), ['free-vs-paid']);
  assert.deepEqual(buildStrategy(['free-vs-paid', 'free-vs-paid', 'unknown']), buildStrategy(['free-vs-paid']));
});

test('completion identity changes when a different topic replaces a day', () => {
  const original = buildStrategy();
  const reordered = buildStrategy(['free-vs-paid']);
  assert.notEqual(original[0].id, reordered[0].id);
  assert.equal(original[5].id, reordered[5].id);
  assert.equal(new Set(original.map(day => day.id)).size, 7);
});

test('research requests retain the complete creator context and local draft overrides', () => {
  const profile = { name: 'Creator', platform: 'YouTube', niche: 'Technology', audience: 'Students', language: 'Bengali', goal: 'Build Authority', channelUrl: 'https://www.youtube.com/@creator', contentUrl: '', competitors: 'https://example.com/a\nhttps://example.com/b, https://example.com/a' };
  const draft = createResearchDraft(profile, { platform: 'Instagram / Reels', topic: '  Study workflows  ', language: 'Hindi', unsupported: 'drop this' });
  const payload = buildResearchRequest(draft, profile);
  assert.equal(payload.topic, 'Study workflows');
  assert.equal(payload.platform, 'Instagram / Reels');
  assert.equal(payload.creatorProfile.platform, payload.platform);
  assert.equal(payload.creatorProfile.language, 'Hindi');
  assert.equal(payload.creatorProfile.goal, 'Build Authority');
  assert.equal(payload.creatorProfile.channelUrl, profile.channelUrl);
  assert.deepEqual(payload.creatorProfile.competitors, ['https://example.com/a', 'https://example.com/b']);
  assert.ok(!('unsupported' in draft));
  assert.equal(createResearchDraft(profile, { language: null }).language, 'Bengali');
});
test('browser storage fails safely and preserves JSON values', () => {
  const entries = new Map();
  globalThis.localStorage = { getItem: key => entries.get(key), setItem: (key,value) => entries.set(key,value) };
  assert.ok(writeStored('test', { name: 'Creator' }));
  assert.deepEqual(readStored('test', {}), { name: 'Creator' });
  entries.set('ideapilot:broken', '{bad');
  assert.equal(readStored('broken', 'fallback'), 'fallback');
  globalThis.localStorage = { getItem() { throw new Error('unavailable'); }, setItem() { throw new Error('quota'); } };
  assert.equal(readStored('test', 'fallback'), 'fallback');
  assert.equal(writeStored('test', {}), false);
  delete globalThis.localStorage;
});
test('research service refuses to pretend the backend is connected', async () => {
  await assert.rejects(requestResearch({topic:'AI'}), BackendUnavailableError);
});

const globeStops = [{ x: 1100, y: 300, radius: 120 }, { x: 150, y: 1300, radius: 110 }, { x: 1050, y: 2200, radius: 120 }, { x: 640, y: 3400, radius: 100 }];
test('scroll globe follows its waypoints and remains attached to the agent map after docking', () => {
  const start = getGlobePose(0, 800, globeStops);
  assert.equal(start.x, 1100); assert.equal(start.y, 300); assert.equal(start.docked, false);
  const moving = getGlobePose(500, 800, globeStops);
  assert.ok(moving.x > 150 && moving.x < 1100);
  assert.equal(moving.connections, 0);
  const dock = getGlobePose(3100, 800, globeStops);
  const past = getGlobePose(3900, 800, globeStops);
  assert.equal(dock.x, 640); assert.equal(dock.y, 300); assert.equal(dock.radius, 100);
  assert.equal(dock.connections, 1); assert.equal(dock.docked, true);
  assert.equal(past.y, dock.y - 800);
  assert.equal(getGlobePose(0, 800, []), null);
});

test('reduced motion keeps the globe at its final document position without a travel sequence', () => {
  const top = getGlobePose(0, 800, globeStops, true);
  const scrolled = getGlobePose(1000, 800, globeStops, true);
  assert.equal(top.x, 640); assert.equal(top.radius, 100); assert.equal(top.connections, 1);
  assert.equal(top.y, 3400); assert.equal(scrolled.y, 2400);
  assert.equal(scrolled.docked, true);
});

test('globe particles form a deterministic unit sphere without random layout changes', () => {
  const points = spherePoints(100);
  assert.equal(points.length, 100);
  assert.deepEqual(points, spherePoints(100));
  for (const point of points) assert.ok(Math.abs(Math.hypot(point.x, point.y, point.z) - 1) < 1e-10);
});
