// 2025 Tax Data
const taxData = {
  taxYear: 2025,

  // Standard Deduction
  standardDeduction: {
    single: 15750,
    mfj: 31500,
    mfs: 15750,
    hoh: 23625
  },

  // Income Tax Brackets
  brackets: {
    single: [
      { threshold: 0, rate: 0.10 },
      { threshold: 11925, rate: 0.12 },
      { threshold: 48475, rate: 0.22 },
      { threshold: 103350, rate: 0.24 },
      { threshold: 197300, rate: 0.32 },
      { threshold: 250525, rate: 0.35 },
      { threshold: 626350, rate: 0.37 }
    ],
    mfj: [
      { threshold: 0, rate: 0.10 },
      { threshold: 23850, rate: 0.12 },
      { threshold: 96950, rate: 0.22 },
      { threshold: 206700, rate: 0.24 },
      { threshold: 394600, rate: 0.32 },
      { threshold: 501050, rate: 0.35 },
      { threshold: 751600, rate: 0.37 }
    ],
    mfs: [
      { threshold: 0, rate: 0.10 },
      { threshold: 11925, rate: 0.12 },
      { threshold: 48475, rate: 0.22 },
      { threshold: 103350, rate: 0.24 },
      { threshold: 197300, rate: 0.32 },
      { threshold: 250525, rate: 0.35 },
      { threshold: 375800, rate: 0.37 }
    ],
    hoh: [
      { threshold: 0, rate: 0.10 },
      { threshold: 17000, rate: 0.12 },
      { threshold: 64850, rate: 0.22 },
      { threshold: 103350, rate: 0.24 },
      { threshold: 197300, rate: 0.32 },
      { threshold: 250500, rate: 0.35 },
      { threshold: 626350, rate: 0.37 }
    ]
  },

  // Capital Gains Tax
  capitalGains: {
    single: { "0%": 48350, "15%": 533400 },
    mfj: { "0%": 96700, "15%": 600050 },
    mfs: { "0%": 48350, "15%": 300000 },
    hoh: { "0%": 64750, "15%": 566700 }
  },

  // Net Investment Income Tax
  netInvestmentIncomeTax: {
    threshold: {
      single: 200000,
      mfj: 250000,
      mfs: 125000,
      hoh: 200000
    },
    rate: 0.038
  },

  // Additional Medicare Tax
  additionalMedicareTax: {
    threshold: {
      single: 200000,
      mfj: 250000,
      mfs: 125000,
      hoh: 200000
    },
    rate: 0.009
  },

  // Self-Employment Tax
  selfEmploymentTax: {
    threshold: 400,
    adjustmentRate: 0.9235,
    socialSecurityWageBase: 176100,
    socialSecurityRate: 0.124,
    medicareRate: 0.029
  },

  // Qualified Business Income
  qbi: {
    rate: 0.20
  },

  retirementContributionLimits: {
    base: 23500,
    standardCatchUp: 7500, // Age 50-59, 64+
    enhancedCatchUp: 11250 // Age 60-63
  }
};
