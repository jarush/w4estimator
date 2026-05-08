// Data model for inputs and results
const data = {
  input: {
    filingStatus: null,
    selfBirthDate: null,
    spouseBirthDate: null,

    jobs: [
    ],

    otherIncome: {
      selfEmploymentIncomeSelf: null,
      selfEmploymentIncomeSpouse: null,
      interestIncome: null,
      shortTermGains: null,
      longTermGains: null
    },

    credits: {
      foreignTaxCredit: null
    }
  },

  results: {
  }
};

// 2026 Tax Data (Married Filing Jointly)
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

$(document).ready(function() {
  // Navigation
  $(document).on('click', '.btn-nav', function() {
    navigateToStep($(this).data('next'));
  });

  // Data Binding  
  $(document).on('input', '[data-bind]', function () {
    const $element = $(this);
    const path = $element.data('bind');
    const value = parseValue($element);
    
    setModelValue(data, path, value);

    // Automatically show/hide things depending on values in the model
    $('[data-show-if="'+path+'"]').each(function() {
      const $element = $(this);
      const requiredValue = $element.data('required-value');
      $(this).toggleClass('d-none', value !== requiredValue);
    });
  });

  // Add Job
  $('#btnAddJob').on('click', function() {
    addJob();
  });

  // Remove Job
  $(document).on('click', '.remove-job', function() {
    const $job = $(this).closest('.job');
    const index = $job.index();
    removeJob(index);
  });

  // Calculate Results
  $('#btnCalc').on('click', calculateResults);

  // Save Data
  $('#btnSaveData').on('click', saveData);

  // Import Data triggers a click on the hidden file input
  $('#btnImportData').on('click', () => $('#fileInput').click());

  // Reset the file input value so the change event triggers for the same file
  $('#fileInput').on('click', function() {
    $(this).val(''); // Resets the input every time you click "Import"
  });

  // Load the file when the hidden file input changes it's file selction
  $('#fileInput').on('change', function(e) {
    const reader = new FileReader();
    reader.onload = function(event) {
      const newInput = JSON.parse(event.target.result);
      importData(newInput);
    };
    reader.readAsText(e.target.files[0]);
  });
});

function navigateToStep(stepNumber) {
  $('.step').removeClass('active-step');
  $('#step' + stepNumber).addClass('active-step');
}

/**
 * Set a nested value on the model using a dot path.
 *
 * @param {Object} obj - Target object to modify
 * @param {string} path - Dot-separated path (e.g. "jobs.1.income")
 * @param {*} value - Value to assign at path
 */
function setModelValue(obj, path, value) {
  const keys = path.split('.');

  let current = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    current = current[keys[i]];
  }

  current[keys[keys.length - 1]] = value;
}

/**
 * Get a nested value from the model using a dot path.
 *
 * @param {Object} obj - Source object
 * @param {string} path - Dot-separated path (e.g. "jobs.0.income")
 * @returns {*} Value at the given path
 */
function getModelValue(obj, path) {
  const keys = path.split('.');

  let current = obj;
  for (let i = 0; i < keys.length; i++) {
    if (!Object.hasOwn(current, keys[i])) {
      return undefined;
    }
    current = current[keys[i]];
  }

  return current;
}

/**
 * Parses a form element value based on its input type.
 *
 * @param {jQuery} $element - The jQuery-wrapped input/select/checkbox element
 * @returns {*} Parsed value (string, number, or boolean)
 */
function parseValue($element) {
  const tag = $element.prop('tagName').toLowerCase();
  const type = $element.attr('type');
  const val = $element.val();

  // Select Return whatever type the select value is
  if (tag === 'select') {
    return val;
  }

  // Checkbox 
  if (type === 'checkbox') {
    return $element.is(':checked');
  }

  // Number input
  if (type === 'number') {
    return val === '' ? 0 : Number(val);
  }

  // Default to a string
  return val;
}

function updateDomFromModel($element) {
  // Copy data from the model into the DOM
  $element.find('[data-bind]').each(function () {
    const $element = $(this);
    const path = $element.data('bind');

    const value = getModelValue(data, path);
    if (value !== undefined && value !== null) {
      $element.val(value);
    }
  });
}

function updateDomVisibilityFromMode($element) {
  $element.find('[data-show-if]').each(function () {
    const $element = $(this);
    const path = $element.data('show-if');
    const value = getModelValue(data, path);
    const requiredValue = $element.data('required-value');
    $(this).toggleClass('d-none', value !== requiredValue);
  });
}

/**
 * Adds a new job to data and triggers a full re-render.
 */
function addJob() {
  // Add a job to the input data
  data.input.jobs.push({
    person: "Self",
    paycheckFreq: 26,
    paycheckDate: null,
    currentGrossWages: null,
    ytdGrossWages: null,
    currentPreTaxRetirementDeductions: null,
    ytdPreTaxRetirementDeductions: null,
    currentPreTaxMedicalDeductions: null,
    ytdPreTaxMedicalDeductions: null,
    currentFedTaxWithheld: null,
    ytdFedTaxWithheld: null,
  });
  
  // Re-render all the jovs
  renderJobs();
}

/**
 * Removes a job at the given index and re-renders UI.
 *
 * @param {number} index - Index of job to remove
 */
function removeJob(index) {
  // Remove the job at the provided index
  data.input.jobs.splice(index, 1);
  
  // Re-render all the jovs
  renderJobs();
}

/**
 * Renders all jobs from data into the DOM using a template. Fully re-renders
 * to keep UI in sync with data.
 */
function renderJobs() {
  // Get all the containers that have job specific info
  const $jobs = $('#jobs');
  const $grossWagesDetails = $('#gross-wages-details');
  const $preTaxDeductionsDetails = $('#pre-tax-deductions-details');
  const $taxableWagesDetails = $('#taxable-wages-details');

  // Clear all the containers before rendering
  $jobs.empty();
  $grossWagesDetails.empty();
  $preTaxDeductionsDetails.empty();
  $taxableWagesDetails.empty();

  // Add all the jobs to the container
  data.input.jobs.forEach((job, index) => {
    // Get the HTML template, update placeholders, and append
    const jobHtml = $('#job-template').html();
    const $job = $(jobHtml.replaceAll('{{INDEX}}', index));

    // Update the DOM from the model
    updateDomFromModel($job);

    // Update the DOM visibility from the model
    updateDomVisibilityFromMode($job);

    // Add the job DOM to the container      
    $jobs.append($job);

    // Get the HTML template, update placeholders, and append
    const grossWagesDetailHtml = $('#gross-wages-detail-template').html();
    const $grossWagesDetail = $(grossWagesDetailHtml.replaceAll('{{INDEX}}', index).replaceAll('{{PERSON}}', job.person));

    // Add the DOM to the container      
    $grossWagesDetails.append($grossWagesDetail);

    // Get the HTML template, update placeholders, and append
    const preTaxDeductionsDetailHtml = $('#pre-tax-deductions-detail-template').html();
    const $preTaxDeductionsDetail = $(preTaxDeductionsDetailHtml.replaceAll('{{INDEX}}', index).replaceAll('{{PERSON}}', job.person));

    // Add the DOM to the container
    $preTaxDeductionsDetails.append($preTaxDeductionsDetail);

    // Get the HTML template, update placeholders, and append
    const taxableWagesDetailHtml = $('#taxable-wages-detail-template').html();
    const $taxableWagesDetail = $(taxableWagesDetailHtml.replaceAll('{{INDEX}}', index).replaceAll('{{PERSON}}', job.person));

    // Add the DOM to the container      
    $taxableWagesDetails.append($taxableWagesDetail);
  });
}

/**
 * Gets the annual retirement contribution limit.
 *
 * @param {string} birthDate - ISO birth date string
 * @param {number} taxYear - Tax year being calculated
 * @returns {number} Annual contribution limit
 */
function getRetirementContributionLimit(birthDate, taxYear) {
  let limit = taxData.retirementContributionLimits.base;

  // Calculate the age as of the end of the tax year
  const birth = new Date(birthDate);
  const age = taxYear - birth.getFullYear();

  // Add age-based catch-up
  if (age >= 60 && age <= 63) {
    // SECURE 2.0 enhanced catch-up
    limit += taxData.retirementContributionLimits.enhancedCatchUp;
  } else if (age >= 50) {
    // Standard catch-up
    limit += taxData.retirementContributionLimits.standardCatchUp;
  }

  return limit;
}

function projectJobs(input, results) {
  results.jobs = [];
  input.jobs.forEach(job => {
    const projected = projectSingleJob(job);
    results.jobs.push(projected);
  });
}

/**
 * Estimates remaining paychecks for the tax year.
 *
 * @param {string} paycheckDate - Most recent paycheck date (ISO string)
 * @param {number} paycheckFreq - Annual paycheck frequency
 * @param {number} taxYear - Tax year being projected
 * @returns {number} Estimated remaining paychecks
 */
function calculateRemainingPaychecks(paycheckDate, paycheckFreq, taxYear) {
  const lastPayDate = new Date(paycheckDate + "T00:00:00Z");
  
  // End of the tax year (Jan 1st of next tax year, to handle an early paycheck)
  const endOfYear = new Date(Date.UTC(taxYear + 1, 0, 1));
  
  // Milliseconds per day
  const msPerDay = 1000 * 60 * 60 * 24;
  
  // Days remaining in the year
  const daysRemaining = Math.max(0, (endOfYear - lastPayDate) / msPerDay);
  
  // Approximate days per pay period
  const periodDaysMap = {52: 7,   // Weekly
                         26: 14,  // Bi-weekly
                         24: 15,  // Semi-monthly
                         12: 30   // Monthly
  };
  const daysPerPeriod = periodDaysMap[paycheckFreq] || 14;
  
  // Estimated future paychecks
  return Math.floor(daysRemaining / daysPerPeriod);
}

function projectSingleJob(job) {
  const paychecksRemaining = calculateRemainingPaychecks(
      job.paycheckDate,
      job.paycheckFreq,
      taxData.taxYear);
  return {
    person: job.person,
    paychecksRemaining: paychecksRemaining,
    grossWages: job.ytdGrossWages + (job.currentGrossWages * paychecksRemaining),
    preTaxRetirementDeductions: job.ytdPreTaxRetirementDeductions + (job.currentPreTaxRetirementDeductions * paychecksRemaining),
    preTaxMedicalDeductions: job.ytdPreTaxMedicalDeductions + (job.currentPreTaxMedicalDeductions * paychecksRemaining),
    fedTaxWithheld: job.ytdFedTaxWithheld + (job.currentFedTaxWithheld * paychecksRemaining)
  };
}

/**
  * Applies IRS retirement contribution limits across all jobs per person.
  *
  * If projected contributions exceed the annual limit, all jobs for that
  * person are scaled proportionally.
  *
  * @param {Object} input - Input model
  * @param {Object} results - Results model
  */
function applyRetirementContributionCaps(input, results) {
  // Group projected jobs by person
  const groupedJobs = {
    Self: [],
    Spouse: []
  };

  input.jobs.forEach((inputJob, index) => {
    groupedJobs[inputJob.person].push({
      input: inputJob,
      result: results.jobs[index]
    });
  });

  // Apply limits independently for each person
  Object.entries(groupedJobs).forEach(([person, jobs]) => {
    if (jobs.length === 0) {
      return;
    }

    // Determine birth date for catch-up eligibility
    const birthDate = person === 'Self'
                    ? input.selfBirthDate
                    : input.spouseBirthDate;

    const limit = getRetirementContributionLimit(birthDate, taxData.taxYear);

    // Sum YTD and projected retirement contributions
    let totalYtd = 0;
    let totalProjected = 0;
    jobs.forEach(job => {
      totalYtd += job.input.ytdPreTaxRetirementDeductions;
      totalProjected += (job.input.currentPreTaxRetirementDeductions * job.result.paychecksRemaining);
    });

    // Scale future retirement contributions to max at the limit
    const remainingRoom = Math.max(0, limit - totalYtd);
    if (totalProjected > remainingRoom) {
      const scaleFactor = remainingRoom / totalProjected;
      jobs.forEach(job => {
        job.result.preTaxRetirementDeductions =
              job.input.ytdPreTaxRetirementDeductions
            + (job.input.currentPreTaxRetirementDeductions * job.result.paychecksRemaining * scaleFactor);
      });
    }
  });
}

function computeJobTaxableWages(results) {
  results.jobs.forEach(job => {
    job.preTaxDeductions = job.preTaxRetirementDeductions + job.preTaxMedicalDeductions;
    job.taxableWages = job.grossWages - job.preTaxDeductions;

    // Simplified medicare taxable wages
    job.medicareTaxableWages = job.grossWages - job.preTaxMedicalDeductions;

    // Simplified social secuqirty taxable wages
    job.socialSecurityTaxableWages  = job.grossWages - job.preTaxMedicalDeductions;
  });
}

function aggregateJobTotals(results) {
  results.totalGrossWages = 0;
  results.selfGrossWages = 0;
  results.spouseGrossWages = 0;
  results.totalPreTaxDeductions = 0;
  results.totalTaxableWages = 0;
  results.totalMedicareTaxableWages = 0;
  results.totalSocialSecurityTaxableWages = 0;
  results.selfSocialSecurityTaxableWages = 0;
  results.spouseSocialSecurityTaxableWages = 0;
  results.totalFedTaxWithheld = 0;
  
  results.jobs.forEach(job => {
    results.totalGrossWages += job.grossWages;
    results.totalPreTaxDeductions += job.preTaxDeductions;
    results.totalTaxableWages += job.taxableWages;
    results.totalMedicareTaxableWages += job.medicareTaxableWages;
    results.totalSocialSecurityTaxableWages += job.socialSecurityTaxableWages;
    results.totalFedTaxWithheld += job.fedTaxWithheld;
    if (job.person === 'Self') {
      results.selfGrossWages += job.grossWages;
      results.selfSocialSecurityTaxableWages += job.socialSecurityTaxableWages;
    } else {
      results.spouseGrossWages += job.grossWages;
      results.spouseSocialSecurityTaxableWages += job.socialSecurityTaxableWages;
    }
  });
}

function calculateOtherIncome(input, results) {
  results.totalOtherIncome =
        (input.otherIncome.selfEmploymentIncomeSelf || 0)
      + (input.otherIncome.selfEmploymentIncomeSpouse || 0)
      + (input.otherIncome.interestIncome || 0)
      + (input.otherIncome.shortTermGains || 0)
      + (input.otherIncome.longTermGains || 0);
}

/**
 * Calculates AGI adjustments. This also calculates the self-employment tax,
 * as that's needed to compute the adjustment.
 *
 * @param {Object} input - Input model
 * @param {Object} results - Results model
 */
function calculateAdjustments(input, results) {
  const selfEmploymentIncomeSelf =
      input.otherIncome.selfEmploymentIncomeSelf || 0;
  const selfEmploymentIncomeSpouse =
      input.otherIncome.selfEmploymentIncomeSpouse || 0;
  results.totalSelfEmploymentIncome =
        selfEmploymentIncomeSelf
      + selfEmploymentIncomeSpouse;

  // Calculate self-employment taxes separately per person
  const selfEmploymentTaxSelf = calculateSelfEmploymentTax(
      selfEmploymentIncomeSelf,
      results.selfSocialSecurityTaxableWages);
  const selfEmploymentTaxSpouse = calculateSelfEmploymentTax(
      selfEmploymentIncomeSpouse,
      results.spouseSocialSecurityTaxableWages);
  
  // Total self-employment tax
  results.selfEmploymentTax =
        selfEmploymentTaxSelf
      + selfEmploymentTaxSpouse;
  
  // Half of SE tax is deductible
  results.selfEmploymentAdjustment = results.selfEmploymentTax / 2;
  
  // TODO  Future adjustments can be added here
  
  // Total adjustments to income
  results.adjustments = results.selfEmploymentAdjustment;
}

/**
 * Calculates adjusted gross income.
 *
 * @param {Object} results - Results model
 */
function calculateAgi(results) {
  results.agi =
        results.totalTaxableWages
      + results.totalOtherIncome
      - results.adjustments;
}

/**
 * Calculates the QBI Deduction.
 * 
 * Note: This is a simplified calculation that gives an estimate. This function
 * just takes 20% of the Self-Employment income after Self-Employment
 * adjustments, and it ignores various QBI threshold.
 */
function calculateQbiDeduction(selfEmploymentIncome, selfEmploymentAdjustment) {
  // QBI is net business income after adjustments
  const qualifiedBusinessIncome =
        selfEmploymentIncome
      - selfEmploymentAdjustment;

  return qualifiedBusinessIncome * taxData.qbi.rate;
}

/**
 * Calculates deductions from AGI.
 *
 * @param {Object} input - Input model
 * @param {Object} results - Results model
 */
function calculateDeductions(input, results) {
  // Standard deduction based on filing status
  results.standardDeduction = taxData.standardDeduction[input.filingStatus];

  // Qualified Business Income deduction
  results.qbiDeduction = calculateQbiDeduction(
      results.totalSelfEmploymentIncome,
      results.selfEmploymentAdjustment);
  
  // TODO Future deductions
  
  // Total deductions
  results.deductions =
        results.standardDeduction
      + results.qbiDeduction;
}

/**
 * Calculates Federal Income Tax.
 * 
 * @param {number} taxableIncome - Taxable Income (AGI after deductions).
 * @param {number} brackets - Income tax brackets.
 * @returns {number} The calculated Income Tax amount.
 */
function calculateIncomeTax(taxableIncome, brackets) {
  let tax = 0;
  for (let i = brackets.length - 1; i >= 0; i--) {
    if (taxableIncome > brackets[i].threshold) {
      let taxedAtThisRate = taxableIncome - brackets[i].threshold;
      tax += taxedAtThisRate * brackets[i].rate;
      taxableIncome = brackets[i].threshold;
    }
  }
  return tax;
}

/**
 * Calculates the Net Investment Income Tax (NIIT).
 * 
 * @param {String} filingStatus - Filing status (single, mfj, mfs, hoh)
 * @param {number} magi - Modified Adjusted Gross Income.
 * @param {number} netInvestmentIncome - Total qualifying investment income.
 * @returns {number} The calculated NIIT amount.
 */
function calculateNetInvestmentTaxes(filingStatus, magi, netInvestmentIncome) {
  // Calculate how much the MAGI exceeds the threshold
  const magiOverage = Math.max(0, magi - taxData.netInvestmentIncomeTax.threshold[filingStatus]);

  // Calculate the lesser of the overage or the investment income
  const amountSubjectToTax = Math.min(magiOverage, Math.max(0, netInvestmentIncome));

  // Apply the surtax
  return amountSubjectToTax * taxData.netInvestmentIncomeTax.rate;
}

/**
 * Calculates the Additional Medicare Tax.
 * 
 * @param {String} filingStatus - Filing status (single, mfj, mfs, hoh)
 * @param {number} medicareTaxableWages W-2 wages taxable by medicare
 * @returns {number} The calculated tax amount.
 */
function calculateAdditionalMedicareTax(filingStatus, medicareTaxableWages, totalSelfEmploymentIncome) {
  // Calculate the combined earned income (e.g., megicare wages + self-employment income)
  const combinedEarnedIncome = medicareTaxableWages
      + (totalSelfEmploymentIncome * taxData.selfEmploymentTax.adjustmentRate);

  // Calculate how much the combined earned income exceeds the threshold
  const amountSubjectToTax = Math.max(0, combinedEarnedIncome - taxData.additionalMedicareTax.threshold[filingStatus]);

  // Apply the surtax
  return amountSubjectToTax * taxData.additionalMedicareTax.rate;
}

/**
 * Calculates the Self-Employment Tax.
 * 
 * @param {number} selfEmploymentIncome - Net profit from self-employment
 * @param {number} w2Wages Total W-2 wages earned for the self-employment person
 * @returns {number} The calculated tax amount.
 */
function calculateSelfEmploymentTax(selfEmploymentIncome, w2Wages = 0) {
  // Check if the income meets the threshold for additional tax
  if (selfEmploymentIncome < taxData.selfEmploymentTax.threshold) {
    return 0;
  }

  // Calculate Earnings Subject to Tax
  const taxableEarnings = selfEmploymentIncome * taxData.selfEmploymentTax.adjustmentRate;

  // Social Security Portion (capped to social security wage base)
  const remainingSSCap = Math.max(0, taxData.selfEmploymentTax.socialSecurityWageBase - w2Wages);
  const amountSubjectToSS = Math.min(taxableEarnings, remainingSSCap);
  const ssTax = amountSubjectToSS * taxData.selfEmploymentTax.socialSecurityRate;

  // Medicare Portion (no cap)
  const medTax = taxableEarnings * taxData.selfEmploymentTax.medicareRate;

  return ssTax + medTax;
}

/**
 * Calculates total federal tax liability.
 *
 * @param {Object} input - Input model
 * @param {Object} results - Results model
 */
function calculateTaxes(input, results) {
  // Taxable income after deductions
  results.taxableIncome = Math.max(0, results.agi - results.deductions);

  // FIXME taxibleIncome includes LTCG, which is taxed differently
  // Ordinary federal income tax
  results.incomeTax = calculateIncomeTax(results.taxableIncome,
      taxData.brackets[input.filingStatus]);

  // Investment income subject to NIIT
  const investmentIncome =
        (input.otherIncome.interestIncome || 0)
      + (input.otherIncome.shortTermGains || 0)
      + (input.otherIncome.longTermGains || 0);

  // Net Investment Income Tax
  results.netInvestmentIncomeTax = calculateNetInvestmentTaxes(
      input.filingStatus,
      results.agi,
      investmentIncome);

  // Additional Medicare surtax
  results.additionalMedicareTax = calculateAdditionalMedicareTax(
      input.filingStatus,
      results.totalMedicareTaxableWages,
      results.totalSelfEmploymentIncome);

  // Taxes before credits
  results.taxesBeforeCredits =
        results.incomeTax
      + results.selfEmploymentTax
      + results.netInvestmentIncomeTax
      + results.additionalMedicareTax;

  // Credits
  results.credits = (input.credits.foreignTaxCredit || 0);

  // Final tax liability
  results.totalTaxes = Math.max(0, results.taxesBeforeCredits - results.credits);
}

/**
 * Calculates tax payments and withholding.
 *
 * @param {Object} results - Results model
 */
function calculatePayments(results) {
  // TODO Future payments
  
  results.totalPayments = results.totalFedTaxWithheld;
}

/**
 * Calculates refund or balance due.
 *
 * @param {Object} results - Results model
 */
function calculateRefundOrBalance(results) {
  results.difference =
        results.totalPayments
      - results.totalTaxes;
}

/**
 * Calculates suggested W-4 extra withholding for the first job.
 *
 * @param {Object} input - User input model
 * @param {Object} results - Results model
 */
function calculateW4Adjustments(input, results) {
  // No jobs
  if (input.jobs.length === 0) {
    results.w4ExtraPerCheck = 0;
    return;
  }

  const primaryInputJob = input.jobs[0];
  const primaryResultJob = results.jobs[0];

  // If there are no paychecks remaining, we can't calculate W4 withholding
  if (primaryResultJob.paychecksRemaining <= 0) {
    results.w4ExtraPerCheck = 0;
    return;
  }

  // Determine deductions and withholding tables
  let standardDeduction = taxData.standardDeduction[input.filingStatus];
  let brackets = taxData.brackets[input.filingStatus];

  // If there are more than 1 job, switch to MFS info
  if (input.jobs.length > 1) {
    standardDeduction = taxData.standardDeduction.mfs;
    brackets = taxData.brackets.mfs;
  }

  /*
   * Estimate withholding for the primary job
   * using annualized wages.
   */
  const estimatedAnnualWithholding =
      calculateIncomeTax(
          Math.max(0, primaryResultJob.taxableWages + results.totalOtherIncome - standardDeduction),
          brackets
      );
  const estimatedPerPaycheckWithholding =
      estimatedAnnualWithholding / primaryInputJob.paycheckFreq;

  /*
   * Project total withholding if Job 1
   * switches to this new withholding level.
   */

  // Existing withholding from all other jobs
  let projectedOtherJobWithholding = 0;
  for (let i = 1; i < results.jobs.length; i++) {
    projectedOtherJobWithholding += results.jobs[i].fedTaxWithheld;
  }

  // Replace future withholding for Job 1
  const futurePrimaryWithholding =
      estimatedPerPaycheckWithholding * primaryResultJob.paychecksRemaining;

  const alreadyWithheldPrimary = primaryResultJob.fedTaxWithheld
      - (primaryInputJob.currentFedTaxWithheld
         * primaryResultJob.paychecksRemaining);

  const projectedTotalWithholding =
      projectedOtherJobWithholding
      + alreadyWithheldPrimary
      + futurePrimaryWithholding;

  // Calculate the gap between projected withholding and total taxes owed
  const annualGap = results.totalTaxes - projectedTotalWithholding;

  results.w4ExtraPerCheck = Math.max(0,
      Math.ceil(annualGap / primaryResultJob.paychecksRemaining));
}

function calculateResults() {
  const results = {};
  
  // Perform calculations
  projectJobs(data.input, results);
  applyRetirementContributionCaps(data.input, results);
  computeJobTaxableWages(results);
  aggregateJobTotals(results);
  calculateOtherIncome(data.input, results);
  calculateAdjustments(data.input, results);
  calculateAgi(results);
  calculateDeductions(data.input, results);
  calculateTaxes(data.input, results);
  calculatePayments(results);
  calculateRefundOrBalance(results);
  calculateW4Adjustments(data.input, results);

  // Save results
  data.results = results;

  // Update UI
  renderResults();

  // Navigate to results page
  navigateToStep(5);
}

/**
 * jQuery Currency Formatter that sets an element's text to a USD formatted
 * currency string.
 * 
 * @example $('#price').currency(0); // Sets text to "$0.00"
 */
$.fn.currency = function(value) {
  const str = Number(value).toLocaleString('en-US', { 
    style: 'currency', 
    currency: 'USD' 
  });
  return this.text(str);
};

function renderResults() {
  $(document).find('span[data-bind]').each(function () {
    const $element = $(this);
    const path = $element.data('bind');

    const value = getModelValue(data, path);

    if (value !== undefined && value !== null) {
      $element.currency(value);
    }
  });

  // Update the UI to reflect a refund or taxes owed
  const $card = $('#resultStatusCard');
  const $text = $('#resultStatusText');
  if (data.results.difference >= 0) {
    $text.text('Estimated Tax Refund');
    $card.removeClass('bg-danger').addClass('bg-success');
  } else {
    $text.text('Estimated Taxes Owed');
    $card.removeClass('bg-success').addClass('bg-danger');
  }
}

/**
 * Downloads current data as a JSON file.
 */
function saveData() {
  // Generate the date stamp (YYYY-MM-DD)
  const now = new Date();
  const dateStamp = now.toISOString().split('T')[0]; // Result: "2026-05-02"

  const json = JSON.stringify(data.input, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `w4-data-${dateStamp}.json`; 
  a.click();
}

/**
 * Replaces data and re-renders UI.
 *
 * @param {Object} newInput - Parsed JSON data
 */
function importData(newInput) {
  Object.assign(data.input, newInput);
  
  renderJobs(data);

  // Update the DOM from the model
  updateDomFromModel($(document));

  // Update the DOM visibility from the model
  updateDomVisibilityFromMode($(document));

  // Calculate the results, which will automatically move to the results page
  calculateResults();
}
