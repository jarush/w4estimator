$(document).ready(function() {
  // Navigation
  $(document).on('click', '.btn-nav', function() {
    navigateToStep($(this).data('next'));
  });

  // Step1: Add Job
  $('#btnAddJob').on('click', function() {
    const newJob = $('.jobEntry:first').clone();
    newJob.find('input').val('');
    newJob.find('.remove-job').removeClass('d-none');
    $('#jobsContainer').append(newJob);
  });

  // Step1: Remove Job
  $(document).on('click', '.remove-job', function() {
    $(this).closest('.jobEntry').remove();
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
      const data = JSON.parse(event.target.result);
      importData(data);
    };
    reader.readAsText(e.target.files[0]);
  });
});

function navigateToStep(stepNumber) {
  $('.step').removeClass('active-step');
  $('#step' + stepNumber).addClass('active-step');
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

function getJobProjections() {
  let results = {
    jobs: [],
    totalGrossWages: 0,
    selfGrossWages: 0,
    spouseGrossWages: 0,
    totalPreTaxDeductions: 0,
    totalFedTaxWithheld: 0,
    totalTaxibleWages: 0,
    totalMedicareTaxibleWages: 0
  };
  const endOfYear = new Date('2026-12-31');

  $('.jobEntry').each(function() {
      const person = $(this).find('.person').val();
      const currentGrossWages = parseFloat($(this).find('.currentGrossWages').val()) || 0;
      const ytdGrossWages = parseFloat($(this).find('.ytdGrossWages').val()) || 0;
      const currentPreTaxRetirementDeductions = parseFloat($(this).find('.currentPreTaxRetirementDeductions').val()) || 0;
      const ytdPreTaxRetirementDeductions = parseFloat($(this).find('.ytdPreTaxRetirementDeductions').val()) || 0;
      const currentPreTaxMedicalDeductions = parseFloat($(this).find('.currentPreTaxMedicalDeductions').val()) || 0;
      const ytdPreTaxMedicalDeductions = parseFloat($(this).find('.ytdPreTaxMedicalDeductions').val()) || 0;
      const currentFedTaxWithheld = parseFloat($(this).find('.currentFedTaxWithheld').val()) || 0;
      const ytdFedTaxWithheld = parseFloat($(this).find('.ytdFedTaxWithheld').val()) || 0;
      const paycheckFreq = parseInt($(this).find('.paycheckFreq').val());
      const lastPayDate = new Date($(this).find('.payDate').val());
      
      // Compute the number of days from this pay-date till the next year
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
      const daysInPeriod = periodDaysMap[paycheckFreq] || 14;

      // Compute the number of paychecks remaining this year
      const paychecksRemaining = Math.floor(daysRemaining / daysInPeriod);
      
      const grossWages =
            ytdGrossWages
          + (currentGrossWages * paychecksRemaining);
      const preTaxRetirementDeductions =
            ytdPreTaxRetirementDeductions
          + (currentPreTaxRetirementDeductions * paychecksRemaining);
      const preTaxMedicalDeductions =
            ytdPreTaxMedicalDeductions
          + (currentPreTaxMedicalDeductions * paychecksRemaining);
      const preTaxDeductions =
            preTaxRetirementDeductions
          + preTaxMedicalDeductions;
      const fedTaxWithheld =
            ytdFedTaxWithheld
          + (currentFedTaxWithheld * paychecksRemaining);
      
      const taxibleWages = grossWages - preTaxDeductions;
      const medicareTaxibleWages = grossWages - preTaxMedicalDeductions;
      
      results.jobs.push({
        person: person,
        currentGrossWages: currentGrossWages,
        ytdGrossWages: ytdGrossWages,
        currentPreTaxRetirementDeductions: currentPreTaxRetirementDeductions,
        ytdPreTaxRetirementDeductions: ytdPreTaxRetirementDeductions,
        currentPreTaxMedicalDeductions: currentPreTaxMedicalDeductions,
        ytdPreTaxMedicalDeductions: ytdPreTaxMedicalDeductions,
        currentFedTaxWithheld: currentFedTaxWithheld,
        ytdFedTaxWithheld: ytdFedTaxWithheld,
        paycheckFreq: paycheckFreq,
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
      
      if (person == "Self") {
        results.selfGrossWages += grossWages;
      } else {
        results.spouseGrossWages += grossWages;
      }
  });

  return results;
}

/**
 * Calculates the final W-4 adjustments needed for the primary job.
 */
function calculateW4Adjustments(results) {
  const job1 = results.jobs[0];
  const otherIncome = results.totalOtherIncome;

  /*
   * Calculate the tax for job1 using the Married Filing Separately (which is
   * what the W4 Box 2(c) does). Divide that tax by the paycheck frequency to
   * that by the paycheck frequency to get the new estimated withholding.  
   */
  const estimatedNewWithholding = calculateFederalTax(
      Math.max(0, job1.taxibleWages + otherIncome - TAX_2026.mfsStandardDeduction), TAX_2026.mfsBrackets)
      / job1.paycheckFreq;

  // Calculate projected withholding for all other jobs
  let otherJobsAnnualWithholding = 0;
  for (let i = 1; i < results.jobs.length; i++) {
    otherJobsAnnualWithholding += results.jobs[i].fedTaxWithheld;
  }

  // Find the gap: Total Owed - (Other Jobs + Job 1's new projected withholding)
  const projectedTotalWithholding = otherJobsAnnualWithholding + 
      (job1.fedTaxWithheld - (job1.currentFedTaxWithheld * job1.paychecksRemaining)) +
      (estimatedNewWithholding * job1.paychecksRemaining);

  const annualGap = results.totalTaxes - projectedTotalWithholding;
  results.extraPerCheck = Math.max(0, Math.ceil(annualGap / job1.paychecksRemaining));
}

function performFullCalculation() {
  const results = getJobProjections();
  
  results.selfEmploymentIncome = parseFloat($('#selfEmploymentIncome').val()) || 0;
  results.spouseSelfEmploymentIncome = parseFloat($('#spouseSelfEmploymentIncome').val()) || 0;
  results.interestIncome = parseFloat($('#interestIncome').val()) || 0;
  results.shortTermGains = parseFloat($('#shortTermGains').val()) || 0;
  results.longTermGains = parseFloat($('#longTermGains').val()) || 0;
  results.totalOtherIncome = results.selfEmploymentIncome
      + results.spouseSelfEmploymentIncome
      + results.interestIncome
      + results.shortTermGains
      + results.longTermGains; // FIXME Not taxed at tax bracket, 15%?

  results.selfEmploymentTax =
        calculateSelfEmploymentTax(results.selfEmploymentIncome, results.selfGrossWages)
      + calculateSelfEmploymentTax(results.spouseSelfEmploymentIncome, results.spouseGrossWages);

  results.selfEmploymentAdjustment = results.selfEmploymentTax / 2;
  results.adjustments = results.selfEmploymentAdjustment;

  results.agi =
        results.totalTaxibleWages
      + results.totalOtherIncome
      - results.adjustments;
  
  results.standardDeduction = TAX_2026.mfjStandardDeduction;
  results.qbiDeduction = calculateQbiDeduction(
      results.selfEmploymentIncome + results.spouseSelfEmploymentIncome,
      results.selfEmploymentAdjustment);
  results.deductions = results.standardDeduction + results.qbiDeduction;
  
  results.taxableIncome = Math.max(0, results.agi - results.deductions);
  
  results.incomeTax = calculateFederalTax(results.taxableIncome, TAX_2026.mfjBrackets);
  results.netInvestmentIncomeTax = calculateNetInvestmentTaxes(
      results.agi,
      results.interestIncome + results.shortTermGains + results.longTermGains);
  results.additionalMedicareTax = calculateAdditionalMedicareTax(
      results.totalMedicareTaxibleWages,
      results.selfEmploymentIncome + results.spouseSelfEmploymentIncome);
  results.taxesBeforeCredits = results.incomeTax
      + results.selfEmploymentTax
      + results.netInvestmentIncomeTax
      + results.additionalMedicareTax;

  results.foreignTaxCredit = parseFloat($('#foreignTaxCredit').val()) || 0;
  results.credits = results.foreignTaxCredit;
  
  results.totalTaxes = Math.max(0, results.taxesBeforeCredits - results.credits);
  results.difference = results.totalFedTaxWithheld - results.totalTaxes;
  
  calculateW4Adjustments(results);

  renderResults(results);

  navigateToStep(4);
}

/**
 * Calculates the final W-4 adjustments needed for the primary job.
 */
function calculateW4Adjustments(results) {
  const job1 = results.jobs[0];
  const otherIncome = results.totalOtherIncome;

  /*
   * Calculate the tax for job1 using the Married Filing Separately (which is
   * what the W4 Box 2(c) does). Divide that tax by the paycheck frequency to
   * that by the paycheck frequency to get the new estimated withholding.  
   */
  const estimatedNewWithholding = calculateFederalTax(
      Math.max(0, job1.taxibleWages + otherIncome - TAX_2026.mfsStandardDeduction), TAX_2026.mfsBrackets)
      / job1.paycheckFreq;

  // Calculate projected withholding for all other jobs
  let otherJobsAnnualWithholding = 0;
  for (let i = 1; i < results.jobs.length; i++) {
      otherJobsAnnualWithholding += results.jobs[i].fedTaxWithheld;
  }

  // Find the gap: Total Owed - (Other Jobs + Job 1's new projected withholding)
  const projectedTotalWithholding = otherJobsAnnualWithholding + 
      (job1.fedTaxWithheld - (job1.currentFedTaxWithheld * job1.paychecksRemaining)) +
      (estimatedNewWithholding * job1.paychecksRemaining);

  const annualGap = results.totalTaxes - projectedTotalWithholding;
  results.extraPerCheck = Math.max(0, Math.ceil(annualGap / job1.paychecksRemaining));
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

function renderResults(results) {
  $('#resultGrossWages').currency(results.totalGrossWages);
  $('#resultPreTaxDeductions').currency(results.totalPreTaxDeductions);
  $('#resultTaxibleWages').currency(results.totalTaxibleWages);
  $('#resultOtherIncome').currency(results.totalOtherIncome);
  $('#resultSelfEmploymentIncome').currency(results.selfEmploymentIncome);
  $('#resultSpouseSelfEmploymentIncome').currency(results.spouseSelfEmploymentIncome);
  $('#resultInterestIncome').currency(results.interestIncome);
  $('#resultShortTermGains').currency(results.shortTermGains);
  $('#resultLongTermGains').currency(results.longTermGains);
  $('#resultAdjustments').currency(results.adjustments);
  $('#resultSelfEmploymentAdjustment').currency(results.selfEmploymentAdjustment);
  $('#resultAGI').currency(results.agi);
  $('#resultDeductions').currency(results.deductions);
  $('#resultStandardDeduction').currency(results.standardDeduction);
  $('#resultQbiDeduction').currency(results.qbiDeduction);
  $('#resultTaxableIncome').currency(results.taxableIncome);
  $('#resultTaxWithheld').currency(results.totalFedTaxWithheld);
  $('#resultIncomeTax').currency(results.incomeTax);
  $('#resultSelfEmploymentTax').currency(results.selfEmploymentTax);
  $('#resultNetInvestmentIncomeTax').currency(results.netInvestmentIncomeTax);
  $('#resultAdditionalMedicareTax').currency(results.additionalMedicareTax);
  $('#resultTaxesBeforeCredits').currency(results.taxesBeforeCredits);
  $('#resultCredits').currency(results.credits);
  $('#resultTotalTaxes').currency(results.totalTaxes);
  $('#resultDifference').currency(Math.abs(results.difference));

  // Add details from each job
  const $grossWagesDetailsListGroup = $('#grossWagesDetails');
  const $preTaxDeductionsListGroup = $('#preTaxDeductionsDetails');
  const $taxibleWagesListGroup = $('#taxibleWagesDetails');
  $grossWagesDetailsListGroup.empty();
  $preTaxDeductionsListGroup.empty();
  $taxibleWagesListGroup.empty();
  results.jobs.forEach((job, index) => {
    // Append rows using template literals
    $grossWagesDetailsListGroup.append(`
      <li class="list-group-item d-flex justify-content-between">
        <span class="ms-4">Job ${index + 1} (${job.person}) Gross Wages</span>
        <span>${toCurrency(job.grossWages)}</span>
      </li>
    `);
    $preTaxDeductionsListGroup.append(`
      <li class="list-group-item d-flex justify-content-between">
        <span class="ms-4">Job ${index + 1} (${job.person}) Pre-Tax Retirement Deductions</span>
        <span>${toCurrency(job.preTaxRetirementDeductions)}</span>
      </li>
      <li class="list-group-item d-flex justify-content-between">
        <span class="ms-4">Job ${index + 1} (${job.person}) Pre-Tax Medical Deductions</span>
        <span>${toCurrency(job.preTaxMedicalDeductions)}</span>
      </li>
    `);
    $taxibleWagesListGroup.append(`
      <li class="list-group-item d-flex justify-content-between">
        <span class="ms-4">Job ${index + 1} (${job.person}) Taxible Wages</span>
        <span>${toCurrency(job.taxibleWages)}</span>
      </li>
    `);
  });

  $('#w4Step4a').currency(results.totalOtherIncome);
  $('#w4Step4c').currency(results.extraPerCheck);

  // Update the UI to reflect a refund or taxes owed
  const $card = $('#resultStatusCard');
  const $text = $('#resultStatusText');
  if (results.difference >= 0) {
    $text.text('Estimated Tax Refund');
    $card.removeClass('bg-danger').addClass('bg-success');
  } else {
    $text.text('Estimated Taxes Owed');
    $card.removeClass('bg-success').addClass('bg-danger');
  }
}

function saveData() {
  const jobs = [];
  $('.jobEntry').each(function() {
    jobs.push({
      person: $(this).find('.person').val(),
      paycheckFreq: $(this).find('.paycheckFreq').val(),
      payDate: $(this).find('.payDate').val(),
      currentGrossWages: $(this).find('.currentGrossWages').val(),
      ytdGrossWages: $(this).find('.ytdGrossWages').val(),
      currentPreTaxRetirementDeductions: $(this).find('.currentPreTaxRetirementDeductions').val(),
      ytdPreTaxRetirementDeductions: $(this).find('.ytdPreTaxRetirementDeductions').val(),
      currentPreTaxMedicalDeductions: $(this).find('.currentPreTaxMedicalDeductions').val(),
      ytdPreTaxMedicalDeductions: $(this).find('.ytdPreTaxMedicalDeductions').val(),
      currentFedTaxWithheld: $(this).find('.currentFedTaxWithheld').val(),
      ytdFedTaxWithheld: $(this).find('.ytdFedTaxWithheld').val()
    });
  });

  const data = {
    jobs: jobs,
    otherIncome: {
      selfEmploymentIncome: $('#selfEmploymentIncome').val(),
      spouseSelfEmploymentIncome: $('#spouseSelfEmploymentIncome').val(),
      interestIncome: $('#interestIncome').val(),
      shortTermGains: $('#shortTermGains').val(),
      longTermGains: $('#longTermGains').val()
    },
    credits: {
      foreignTaxCredit: $('#foreignTaxCredit').val(),
    }
  };

  // Generate the date stamp (YYYY-MM-DD)
  const now = new Date();
  const dateStamp = now.toISOString().split('T')[0]; // Result: "2026-05-02"

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `w4-data-${dateStamp}.json`; 
  a.click();
}

function importData(data) {
  // Populate Jobs
  if (data.jobs && data.jobs.length > 0) {
    // Store a copy of the job entry template
    const jobTemplate = $('.jobEntry:first').clone();
    
    // Clear current jobs and rebuild
    $('#jobsContainer').empty();
    
    // Add the jobs
    data.jobs.forEach((job, index) => {
      // Copy the job template and populate
      const $newJob = jobTemplate.clone();
      $newJob.find('.person').val(job.person);
      $newJob.find('.paycheckFreq').val(job.paycheckFreq);
      $newJob.find('.payDate').val(job.payDate);
      $newJob.find('.currentGrossWages').val(job.currentGrossWages);
      $newJob.find('.ytdGrossWages').val(job.ytdGrossWages);
      $newJob.find('.currentPreTaxRetirementDeductions').val(job.currentPreTaxRetirementDeductions);
      $newJob.find('.ytdPreTaxRetirementDeductions').val(job.ytdPreTaxRetirementDeductions);
      $newJob.find('.currentPreTaxMedicalDeductions').val(job.currentPreTaxMedicalDeductions);
      $newJob.find('.ytdPreTaxMedicalDeductions').val(job.ytdPreTaxMedicalDeductions);
      $newJob.find('.currentFedTaxWithheld').val(job.currentFedTaxWithheld);
      $newJob.find('.ytdFedTaxWithheld').val(job.ytdFedTaxWithheld);

      if (index > 0) {
        $newJob.find('.remove-job').removeClass('d-none');
      }

      $('#jobsContainer').append($newJob);
    });
  }

  // Populate Other Income
  if (data.otherIncome) {
    $('#selfEmploymentIncome').val(data.otherIncome.selfEmploymentIncome);
    $('#spouseSelfEmploymentIncome').val(data.otherIncome.spouseSelfEmploymentIncome);
    $('#interestIncome').val(data.otherIncome.interestIncome);
    $('#shortTermGains').val(data.otherIncome.shortTermGains);
    $('#longTermGains').val(data.otherIncome.longTermGains);
  }

  // Populate Credits
  if (data.credits) {
    $('#foreignTaxCredit').val(data.credits.foreignTaxCredit);
  }
}
