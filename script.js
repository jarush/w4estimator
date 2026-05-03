const data = {
  input: {
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

$(document).ready(function() {
  // Navigation
  $(document).on('click', '.btn-nav', function() {
    navigateToStep($(this).data('next'));
  });

  // Data Binding  
  $(document).on('input', '[data-bind]', function () {
    const $el = $(this);
    const path = $el.data('bind');
    const value = parseValue($el);
    
    setPath(data, path, value);
  });

  // Step1: Add Job
  $('#btnAddJob').on('click', function() {
    addJob();
  });

  // Step1: Remove Job
  $(document).on('click', '.remove-job', function() {
    const $job = $(this).closest('.job');
    const index = $job.index();
    removeJob(index);
  });

  // Step 4: Calculate Results
  $('#btnCalc').on('click', performFullCalculation);

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
 * Set a nested value on an object using a dot path.
 *
 * @param {Object} obj - Target object to modify
 * @param {string} path - Dot-separated path (e.g. "jobs.1.income")
 * @param {*} value - Value to assign at path
 */
function setPath(obj, path, value) {
  const keys = path.split('.');

  let current = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    current = current[keys[i]];
  }

  current[keys[keys.length - 1]] = value;
}

/**
 * Get a nested value from an object using a dot path.
 *
 * @param {Object} obj - Source object
 * @param {string} path - Dot-separated path (e.g. "jobs.0.income")
 * @returns {*} Value at the given path
 */
function getPath(obj, path) {
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
 * @param {jQuery} $el - The jQuery-wrapped input/select/checkbox element
 * @returns {*} Parsed value (string, number, or boolean)
 */
function parseValue($el) {
  const tag = $el.prop('tagName').toLowerCase();
  const type = $el.attr('type');
  const val = $el.val();

  // Select Return whatever type the select value is
  if (tag === 'select') {
    return val;
  }

  // Checkbox 
  if (type === 'checkbox') {
    return $el.is(':checked');
  }

  // Number input
  if (type === 'number') {
    return val === '' ? 0 : Number(val);
  }

  // Default to a string
  return val;
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

    // Copy data into the DOM
    $job.find('[data-bind]').each(function () {
      const $el = $(this);
      const path = $el.data('bind');

      const value = getPath(data, path);
      if (value !== undefined && value !== null) {
        $el.val(value);
      }
    });

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

  // FIXME This doesn't update the results if we were on that page
}

// 2026 Tax Data (Married Filing Jointly)
const TAX_2026 = {
  mfjStandardDeduction: 32200,
  mfjBrackets: [
    { threshold: 0, rate: 0.10 },
    { threshold: 24800, rate: 0.12 },
    { threshold: 100800, rate: 0.22 },
    { threshold: 211400, rate: 0.24 },
    { threshold: 403550, rate: 0.32 },
    { threshold: 512450, rate: 0.35 },
    { threshold: 768700, rate: 0.37 }
  ],
  mfsStandardDeduction: 16100,
  mfsBrackets: [
    { threshold: 0, rate: 0.10 },
    { threshold: 12400, rate: 0.12 },
    { threshold: 50400, rate: 0.22 },
    { threshold: 105700, rate: 0.24 },
    { threshold: 201775, rate: 0.32 },
    { threshold: 256225, rate: 0.35 },
    { threshold: 384350, rate: 0.37 }
  ]
};

function calculateFederalTax(taxableIncome, brackets) {
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
 * @param {number} magi - Modified Adjusted Gross Income.
 * @param {number} netInvestmentIncome - Total qualifying investment income.
 * @returns {number} The calculated NIIT amount.
 */
function calculateNetInvestmentTaxes(magi, netInvestmentIncome) {
  const THRESHOLD = 250000; // Threshold for Married Filing Jointly
  const RATE = 0.038;       // 3.8% Tax Rate

  // Calculate how much the MAGI exceeds the threshold
  const magiOverage = Math.max(0, magi - THRESHOLD);

  // Calculate the lesser of the overage or the investment income
  const amountSubjectToTax = Math.min(magiOverage, Math.max(0, netInvestmentIncome));

  // Apply the surtax
  return amountSubjectToTax * RATE;
}

/**
 * Calculates the Additional Medicare Tax.
 * 
 * @param {number} medicareTaxibleWages W-2 wages taxible by medicare
 * @returns {number} The calculated tax amount.
 */
function calculateAdditionalMedicareTax(medicareTaxibleWages, totalSelfEmploymentIncome) {
  const THRESHOLD = 250000; // Threshold for Married Filing Jointly
  const RATE = 0.009;       // 0.9% Tax Rate

  // Calculate how much the combined wages exceed the threshold
  const combinedEarnedIncome = medicareTaxibleWages + totalSelfEmploymentIncome;
  const overage = Math.max(0, combinedEarnedIncome - THRESHOLD);

  // Apply the surtax
  return overage * RATE;
}

/**
 * Calculates the Self-Employment Tax.
 * 
 * @param {number} selfEmploymentIncome - Net profit from self-employment
 * @param {number} w2Wages Total W-2 wages earned for the self-employment person
 * @returns {number} The calculated tax amount.
 */
function calculateSelfEmploymentTax(selfEmploymentIncome, w2Wages = 0) {
  const SE_THRESHOLD = 400;     // Self-Employment income threshold for the tax
  const SE_ADJUSTMENT = 0.9235; // 92.35% multiplier
  const SS_WAGE_BASE = 184500;  // Social Security Cap
  const SS_RATE = 0.124;        // 12.4%
  const MED_RATE = 0.029;       // 2.9%

  // Check if the income meets the threshold for additional tax
  if (selfEmploymentIncome < SE_THRESHOLD) {
    return 0;
  }

  // Calculate Earnings Subject to Tax
  const taxableEarnings = selfEmploymentIncome * SE_ADJUSTMENT;

  // Social Security Portion (capped to SS wage base)
  const remainingSSCap = Math.max(0, SS_WAGE_BASE - w2Wages);
  const amountSubjectToSS = Math.min(taxableEarnings, remainingSSCap);
  const ssTax = amountSubjectToSS * SS_RATE;

  // Medicare Portion (no cap)
  const medTax = taxableEarnings * MED_RATE;

  return ssTax + medTax;
}

/**
 * Calculates the 2026 QBI Deduction.
 * 
 * Note: This is a simplified calculation that gives an estimate. This function
 * just takes 20% of the Self-Employment income after Self-Employment
 * adjustments, and it ignores various QBI threshold.
 */
function calculateQbiDeduction(selfEmploymentIncome, selfEmploymentAdjustment) {
    const QBI_RATE = 0.20; 
    
    // QBI is net business income after adjustments
    const qualifiedBusinessIncome =
          selfEmploymentIncome
        - selfEmploymentAdjustment;

    return qualifiedBusinessIncome * QBI_RATE;
}

function getJobProjections(jobs, results) {
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
 * Calculates the final W-4 adjustments needed for the primary job.
 */
function calculateW4Adjustments() {
  const inputJob1 = data.input.jobs[0];
  const resultsJob1 = data.results.jobs[0];

  /*
   * Calculate the tax for job1 using the Married Filing Separately (which is
   * what the W4 Box 2(c) does). Divide that tax by the paycheck frequency to
   * that by the paycheck frequency to get the new estimated withholding.  
   */
  const estimatedNewWithholding = calculateFederalTax(
      Math.max(0, resultsJob1.taxibleWages + data.results.totalOtherIncome - TAX_2026.mfsStandardDeduction), TAX_2026.mfsBrackets)
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

function performFullCalculation() {
  data.results = {};
  
  getJobProjections(data.input.jobs, data.results);
  
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
  
  data.results.standardDeduction = TAX_2026.mfjStandardDeduction;

  const totalSelfEmploymentIncome =
        data.input.otherIncome.selfEmploymentIncome
      + data.input.otherIncome.spouseSelfEmploymentIncome;
  data.results.qbiDeduction = calculateQbiDeduction(totalSelfEmploymentIncome,
      data.results.selfEmploymentAdjustment);

  data.results.deductions = data.results.standardDeduction + data.results.qbiDeduction;
  
  data.results.taxableIncome = Math.max(0, data.results.agi - data.results.deductions);
  
  data.results.incomeTax = calculateFederalTax(data.results.taxableIncome, TAX_2026.mfjBrackets);
  const investmentIncome =
        data.input.otherIncome.interestIncome
      + data.input.otherIncome.shortTermGains
      + data.input.otherIncome.longTermGains;
  data.results.netInvestmentIncomeTax = calculateNetInvestmentTaxes(data.results.agi,
      investmentIncome);
  data.results.additionalMedicareTax = calculateAdditionalMedicareTax(
      data.results.totalMedicareTaxibleWages,
      data.input.otherIncome.selfEmploymentIncome + data.input.otherIncome.spouseSelfEmploymentIncome);
  data.results.taxesBeforeCredits = data.results.incomeTax
      + data.results.selfEmploymentTax
      + data.results.netInvestmentIncomeTax
      + data.results.additionalMedicareTax;

  data.results.credits = data.input.credits.foreignTaxCredit;
  
  data.results.totalTaxes = Math.max(0, data.results.taxesBeforeCredits - data.results.credits);
  data.results.difference = data.results.totalFedTaxWithheld - data.results.totalTaxes;
  
  calculateW4Adjustments();

  renderResults();

  navigateToStep(4);
}

/**
 * Formatter that returns a number formatted as a USD formatted currency string.
 */
function toCurrency(value) {
  return Number(value).toLocaleString('en-US', { 
    style: 'currency', 
    currency: 'USD' 
  });
}

/**
 * jQuery Currency Formatter that sets an element's text to a USD formatted
 * currency string.
 * 
 * @example $('#price').currency(0); // Sets text to "$0.00"
 */
$.fn.currency = function(value) {
  return this.text(toCurrency(value));
};

function renderResults() {
  $(document).find('span[data-bind]').each(function () {
    const $el = $(this);
    const path = $el.data('bind');

    const value = getPath(data, path);

    if (value !== undefined && value !== null) {
      $el.currency(value);
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

  const json = JSON.stringify(data, null, 2);
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

  $(document).find('[data-bind]').each(function () {
    const $el = $(this);
    const path = $el.data('bind');

    const value = getPath(data, path);

    if (value !== undefined && value !== null) {
      $el.val(value);
    }
  });
}
