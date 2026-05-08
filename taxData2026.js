// 2026 Tax Data
const taxData = {
  taxYear: 2026,

  // Standard Deduction
  standardDeduction: {
    single: 16100,
    mfj: 32200,
    mfs: 16100,
    hoh: 24150
  },

  // Income Tax Brackets
  brackets: {
    single: [
      { threshold: 0, rate: 0.10 },
      { threshold: 12400, rate: 0.12 },
      { threshold: 50400, rate: 0.22 },
      { threshold: 105700, rate: 0.24 },
      { threshold: 201775, rate: 0.32 },
      { threshold: 256225, rate: 0.35 },
      { threshold: 640600, rate: 0.37 }
    ],
    mfj: [
      { threshold: 0, rate: 0.10 },
      { threshold: 24800, rate: 0.12 },
      { threshold: 100800, rate: 0.22 },
      { threshold: 211400, rate: 0.24 },
      { threshold: 403550, rate: 0.32 },
      { threshold: 512450, rate: 0.35 },
      { threshold: 768700, rate: 0.37 }
    ],
    mfs: [
      { threshold: 0, rate: 0.10 },
      { threshold: 12400, rate: 0.12 },
      { threshold: 50400, rate: 0.22 },
      { threshold: 105700, rate: 0.24 },
      { threshold: 201775, rate: 0.32 },
      { threshold: 256225, rate: 0.35 },
      { threshold: 384350, rate: 0.37 }
    ],
    hoh: [
      { threshold: 0, rate: 0.10 },
      { threshold: 17700, rate: 0.12 },
      { threshold: 67450, rate: 0.22 },
      { threshold: 105700, rate: 0.24 },
      { threshold: 201750, rate: 0.32 },
      { threshold: 256200, rate: 0.35 },
      { threshold: 640600, rate: 0.37 }
    ]
  },

  // Capital Gains Tax
  capitalGains: {
    single: { "0%": 49450, "15%": 545500 },
    mfj: { "0%": 98900, "15%": 613700 },
    mfs: { "0%": 49450, "15%": 306850 },
    hoh: { "0%": 66200, "15%": 579600 }
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
    socialSecurityWageBase: 184500,
    socialSecurityRate: 0.124,
    medicareRate: 0.029
  },

  // Qualified Business Income
  qbi: {
    rate: 0.20
  },

  retirementContributionLimits: {
    base: 24500,
    standardCatchUp: 8000, // Age 50-59, 64+
    enhancedCatchUp: 11250 // Age 60-63
  }
};
