export const TIERS = {
  FREE: {
    maxLocations: 3,
    maxTeamMembers: 1,
  },
  PRO: {
    maxLocations: Infinity,
    maxTeamMembers: 5,
    monthly: {
      price_id: "price_1Sz2PXBarnpPSLEkARaviN8t",
      amount: 19,
    },
    annual: {
      price_id: "price_1Sz2QkBarnpPSLEkmNjK14sW",
      amount: 190,
      savings: "2 months free",
    },
    product_ids: ["prod_TwwIJJoTzZZyir", "prod_TwwJRCI1bbgJqf"],
  },
} as const;
