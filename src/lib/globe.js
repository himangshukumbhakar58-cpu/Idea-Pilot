const clamp = value => Math.max(0, Math.min(1, value));
const mix = (a, b, amount) => a + (b - a) * amount;

// Waypoint coordinates belong to the document. After docking, the globe stays
// with the agent map instead of following the visitor through later sections.
export function getGlobePose(scrollY, viewportHeight, waypoints, reducedMotion = false) {
  if (!waypoints.length) return null;
  const stops = waypoints.map((point, index) => ({ ...point, stop: index === 0 ? 0 : Math.max(1, point.y - viewportHeight * .53) }));
  for (let index = 1; index < stops.length; index++) stops[index].stop = Math.max(stops[index].stop, stops[index - 1].stop + 1);
  const final = stops[stops.length - 1];
  const overall = clamp(scrollY / Math.max(1, final.stop));
  const revealDistance = Math.min(560, viewportHeight * .7);
  const connections = reducedMotion ? 1 : clamp((scrollY - final.stop + revealDistance) / Math.max(1, revealDistance));
  if (reducedMotion || scrollY >= final.stop) return { x: final.x, y: final.y - scrollY, radius: final.radius, progress: overall, connections, docked: true };
  const index = Math.max(1, stops.findIndex(point => point.stop > scrollY));
  const from = stops[index - 1], to = stops[index];
  const amount = clamp((scrollY - from.stop) / Math.max(1, to.stop - from.stop));
  const eased = amount * amount * (3 - 2 * amount);
  return { x: mix(from.x, to.x, eased), y: mix(from.y, to.y, amount) - scrollY, radius: mix(from.radius, to.radius, eased), progress: overall, connections, docked: false };
}

export function spherePoints(count) {
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  return Array.from({ length: count }, (_, index) => {
    const y = 1 - 2 * (index + .5) / count;
    const ring = Math.sqrt(Math.max(0, 1 - y * y));
    const angle = goldenAngle * index;
    return { x: Math.cos(angle) * ring, y, z: Math.sin(angle) * ring };
  });
}
