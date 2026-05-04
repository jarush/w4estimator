// Data model for inputs and results
const data = {
  input: {
    filingStatus: null,
    selfBirthDate: null,
    spouseBirthDate: null,

    jobs: [
    ],

    otherIncome: {
      selfEmploymentIncome: null,
      spouseSelfEmploymentIncome: null,
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
  const $taxibleWagesDetails = $('#taxible-wages-details');

  // Clear all the containers before rendering
  $jobs.empty();
  $grossWagesDetails.empty();
  $preTaxDeductionsDetails.empty();
  $taxibleWagesDetails.empty();

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
    const taxibleWagesDetailHtml = $('#taxible-wages-detail-template').html();
    const $taxibleWagesDetail = $(taxibleWagesDetailHtml.replaceAll('{{INDEX}}', index).replaceAll('{{PERSON}}', job.person));

    // Add the DOM to the container      
    $taxibleWagesDetails.append($taxibleWagesDetail);
  });
}

/**
 * Calculates Federal Income Tax.
 * 
 * @param {number} taxableIncome - Taxible Income (AGI after deductions).
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
 * @param {number} medicareTaxibleWages W-2 wages taxible by medicare
 * @returns {number} The calculated tax amount.
 */
function calculateAdditionalMedicareTax(filingStatus, medicareTaxibleWages, totalSelfEmploymentIncome) {
  // Calculate the combined earned income (e.g., megicare wages + self-employment income)
  const combinedEarnedIncome = medicareTaxibleWages + totalSelfEmploymentIncome;

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

function calculateJobProjections(jobs, results) {
  results.jobs = [];
  results.totalGrossWages = 0;
  results.selfGrossWages = 0;
  results.spouseGrossWages = 0;
  results.totalPreTaxDeductions = 0;
  results.totalFedTaxWithheld = 0;
  results.totalTaxibleWages = 0;
  results.totalMedicareTaxibleWages = 0;

  const endOfYear = new Date('2026-12-31');

  jobs.forEach(job => {
      // Compute the number of days from this pay-date till the next year
      const lastPayDate = new Date(job.paycheckDate);
      const nextYear = lastPayDate.getFullYear() + 1;
      const jan1NextYear = new Date(nextYear, 0, 1);
      const msPerDay = 1000 * 60 * 60 * 24;
      const daysRemaining = Math.max(0, (jan1NextYear - lastPayDate) / msPerDay);

      // Convert the pay frequency to days in period
      const periodDaysMap = {
          52: 7,  // Weekly
          26: 14, // Bi-weekly
          24: 15, // Semi-monthly (Average)
          12: 30  // Monthly (Average)
      };
      const daysInPeriod = periodDaysMap[job.paycheckFreq] || 14;

      // Compute the number of paychecks remaining this year
      const paychecksRemaining = Math.floor(daysRemaining / daysInPeriod);
      
      const grossWages =
            job.ytdGrossWages
          + (job.currentGrossWages * paychecksRemaining);
      const preTaxRetirementDeductions =
            job.ytdPreTaxRetirementDeductions
          + (job.currentPreTaxRetirementDeductions * paychecksRemaining);
      const preTaxMedicalDeductions =
            job.ytdPreTaxMedicalDeductions
          + (job.currentPreTaxMedicalDeductions * paychecksRemaining);
      const preTaxDeductions =
            preTaxRetirementDeductions
          + preTaxMedicalDeductions;
      const fedTaxWithheld =
            job.ytdFedTaxWithheld
          + (job.currentFedTaxWithheld * paychecksRemaining);
      
      const taxibleWages = grossWages - preTaxDeductions;
      const medicareTaxibleWages = grossWages - preTaxMedicalDeductions;
      
      results.jobs.push({
        lastPayDate: lastPayDate,
        paychecksRemaining: paychecksRemaining,
        grossWages: grossWages,
        preTaxDeductions: preTaxDeductions,
        preTaxRetirementDeductions: preTaxRetirementDeductions,
        preTaxMedicalDeductions: preTaxMedicalDeductions,
        fedTaxWithheld: fedTaxWithheld,
        taxibleWages: taxibleWages,
        medicareTaxibleWages: medicareTaxibleWages
      });

      results.totalGrossWages += grossWages;
      results.totalPreTaxDeductions += preTaxDeductions;
      results.totalFedTaxWithheld += fedTaxWithheld;
      results.totalTaxibleWages += taxibleWages;
      results.totalMedicareTaxibleWages += medicareTaxibleWages;
      
      if (job.person == "Self") {
        results.selfGrossWages += grossWages;
      } else {
        results.spouseGrossWages += grossWages;
      }
  });
}

/**
 * Calculates tje W-4 adjustments needed for the primary job.
 * 
 * @param {String} filingStatus - Filing status (single, mfj, mfs, hoh)
 */
function calculateW4Adjustments(filingStatus) {
  // If there are no jobs, we can't calculate a W-4 adjustment
  if (data.input.jobs.length == 0) {
    data.results.w4WxtraPerCheck = 0;
    return;  
  }

  const inputJob1 = data.input.jobs[0];
  const resultsJob1 = data.results.jobs[0];

  let standardDeduction = taxData.standardDeduction[filingStatus];
  let brackets = taxData.brackets[filingStatus];
  if (data.input.jobs.length > 1) {
    /*
     * If there are multiple jobs, we'll be checking the W5 box 2c, which uses the
     * Married Filing Single tax tables for figuring withholding.
     */
    standardDeduction = taxData.standardDeduction["mfs"];
    brackets = taxData.brackets["mfs"];
  }

  /*
   * Calculate the annual income tax for job 1 and divide by the paycheck frequency to
   * get the new estimated withholding.
   */
  const estimatedNewWithholding = calculateIncomeTax(
      Math.max(0, resultsJob1.taxibleWages + data.results.totalOtherIncome - standardDeduction), brackets)
      / inputJob1.paycheckFreq;

  // Calculate projected withholding for all other jobs
  let otherJobsAnnualWithholding = 0;
  for (let i = 1; i < data.results.jobs.length; i++) {
    otherJobsAnnualWithholding += data.results.jobs[i].fedTaxWithheld;
  }

  // Find the gap: Total Owed - (Other Jobs + Job 1's new projected withholding)
  const projectedTotalWithholding = otherJobsAnnualWithholding + 
      (resultsJob1.fedTaxWithheld - (inputJob1.currentFedTaxWithheld * resultsJob1.paychecksRemaining)) +
      (estimatedNewWithholding * resultsJob1.paychecksRemaining);

  const annualGap = data.results.totalTaxes - projectedTotalWithholding;
  data.results.w4WxtraPerCheck = Math.max(0, Math.ceil(annualGap / resultsJob1.paychecksRemaining));
}

function calculateResults() {
  data.results = {};
  
  calculateJobProjections(data.input.jobs, data.results);
  
  data.results.totalOtherIncome =
        data.input.otherIncome.selfEmploymentIncome
      + data.input.otherIncome.spouseSelfEmploymentIncome
      + data.input.otherIncome.interestIncome
      + data.input.otherIncome.shortTermGains
      + data.input.otherIncome.longTermGains; // FIXME Not taxed at tax bracket, 15%?

  data.results.selfEmploymentTax =
        calculateSelfEmploymentTax(data.input.otherIncome.selfEmploymentIncome, data.results.selfGrossWages)
      + calculateSelfEmploymentTax(data.input.otherIncome.spouseSelfEmploymentIncome, data.results.spouseGrossWages);

  data.results.selfEmploymentAdjustment = data.results.selfEmploymentTax / 2;
  data.results.adjustments = data.results.selfEmploymentAdjustment;

  data.results.agi =
        data.results.totalTaxibleWages
      + data.results.totalOtherIncome
      - data.results.adjustments;
  
  data.results.standardDeduction = taxData.standardDeduction[data.input.filingStatus];

  const totalSelfEmploymentIncome =
        data.input.otherIncome.selfEmploymentIncome
      + data.input.otherIncome.spouseSelfEmploymentIncome;
  data.results.qbiDeduction = calculateQbiDeduction(totalSelfEmploymentIncome,
      data.results.selfEmploymentAdjustment);

  data.results.deductions = data.results.standardDeduction + data.results.qbiDeduction;
  
  data.results.taxableIncome = Math.max(0, data.results.agi - data.results.deductions);
  
  data.results.incomeTax = calculateIncomeTax(
      data.results.taxableIncome,
      taxData.brackets[data.input.filingStatus]);

  const investmentIncome =
        data.input.otherIncome.interestIncome
      + data.input.otherIncome.shortTermGains
      + data.input.otherIncome.longTermGains;
  data.results.netInvestmentIncomeTax = calculateNetInvestmentTaxes(
      data.input.filingStatus,
      data.results.agi,
      investmentIncome);

  data.results.additionalMedicareTax = calculateAdditionalMedicareTax(
      data.input.filingStatus,
      data.results.totalMedicareTaxibleWages,
      data.input.otherIncome.selfEmploymentIncome + data.input.otherIncome.spouseSelfEmploymentIncome);

  data.results.taxesBeforeCredits = data.results.incomeTax
      + data.results.selfEmploymentTax
      + data.results.netInvestmentIncomeTax
      + data.results.additionalMedicareTax;

  data.results.credits = data.input.credits.foreignTaxCredit;
  
  data.results.totalTaxes = Math.max(0, data.results.taxesBeforeCredits - data.results.credits);
  data.results.difference = data.results.totalFedTaxWithheld - data.results.totalTaxes;

  calculateW4Adjustments(data.input.filingStatus);

  renderResults();

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
