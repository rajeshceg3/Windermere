export default function handler(req: any, res: any) {
  res.status(200).json({
    featureFlags: {
      enableVolumetricFog: true,
      enableSkyDome: true,
      enableStarfield: true,
    }
  });
}
