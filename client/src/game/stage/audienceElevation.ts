export const AUDIENCE_RUNWAY = {
  centerX: 0,
  centerZ: 0.45,
  width: 7.8,
  depth: 17,
  topElevation: 0.16
} as const;

export const AUDIENCE_PODIUM_CENTER_Z = 9.55;
export const AUDIENCE_AVATAR_FOOT_CLEARANCE = 0.1;

export const AUDIENCE_PODIUM_STEPS = [
  { id: 'outer', radius: 6, topElevation: 0.12, color: '#080A18', rimColor: '#00F0FF' },
  { id: 'middle', radius: 5.65, topElevation: 0.26, color: '#0B0D20', rimColor: '#FF007F' },
  { id: 'main', radius: 5.3, topElevation: 0.44, color: '#0D0A24', rimColor: '#9D5CFF' }
] as const;

export const getAudienceElevation = (x: number, z: number): number => {
  if (!Number.isFinite(x) || !Number.isFinite(z)) return 0;

  const halfRunwayWidth = AUDIENCE_RUNWAY.width / 2;
  const halfRunwayDepth = AUDIENCE_RUNWAY.depth / 2;
  const insideRunway = (
    Math.abs(x - AUDIENCE_RUNWAY.centerX) <= halfRunwayWidth &&
    Math.abs(z - AUDIENCE_RUNWAY.centerZ) <= halfRunwayDepth
  );

  let elevation = insideRunway ? AUDIENCE_RUNWAY.topElevation : 0;
  const podiumDistance = Math.hypot(x, z - AUDIENCE_PODIUM_CENTER_Z);

  for (const step of AUDIENCE_PODIUM_STEPS) {
    if (podiumDistance <= step.radius) {
      elevation = Math.max(elevation, step.topElevation);
    }
  }

  return elevation;
};

export const getAudiencePlayerElevation = (x: number, z: number): number => {
  const surfaceElevation = getAudienceElevation(x, z);
  return surfaceElevation > 0
    ? surfaceElevation + AUDIENCE_AVATAR_FOOT_CLEARANCE
    : 0;
};
