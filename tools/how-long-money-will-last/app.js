document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const simpleAssetsBtn = document.getElementById('simple-assets-btn');
  const detailedAssetsBtn = document.getElementById('detailed-assets-btn');
  const simpleAssetInput = document.getElementById('simple-asset-input');
  const detailedAssetInput = document.getElementById('detailed-asset-input');
  const limitedIncomeCheckbox = document.getElementById('limited-income');
  const incomeEndDateContainer = document.getElementById('income-end-date-container');
  const addExpenseBtn = document.getElementById('add-expense-btn');
  const expenseModal = document.getElementById('expense-modal');
  const cancelExpenseBtn = document.getElementById('cancel-expense-btn');
  const saveExpenseBtn = document.getElementById('save-expense-btn');
  const expensePresets = document.querySelectorAll('.expense-preset');
  const largeExpensesContainer = document.getElementById('large-expenses-container');
  const calculateBtn = document.getElementById('calculate-btn');
  const resultsContainer = document.getElementById('results-container');
  const recalculateBtn = document.getElementById('recalculate-btn');
  const expenseAdjustment = document.getElementById('expense-adjustment');
  const expenseAdjustmentValue = document.getElementById('expense-adjustment-value');
  const includeLargeExpenses = document.getElementById('include-large-expenses');
  const moneyInputs = document.querySelectorAll('.money-input');

  // State variables
  let largeExpenses = [];
  let expenseCounter = 0;
  let runwayChart = null;
  
  // Default return rates will be overridden by user inputs
  const assetReturnRates = {
    cash: 4,
    fixedDeposits: 7,
    equity: 12,
    gold: 8,
    realEstate: 9,
    other: 4
  };

  // Toggle between simple and detailed asset input
  simpleAssetsBtn.addEventListener('click', () => {
    simpleAssetInput.classList.remove('hidden');
    detailedAssetInput.classList.add('hidden');
    simpleAssetsBtn.classList.remove('bg-gray-200', 'text-gray-800');
    simpleAssetsBtn.classList.add('bg-indigo-600', 'text-white');
    detailedAssetsBtn.classList.remove('bg-indigo-600', 'text-white');
    detailedAssetsBtn.classList.add('bg-gray-200', 'text-gray-800');
  });

  detailedAssetsBtn.addEventListener('click', () => {
    simpleAssetInput.classList.add('hidden');
    detailedAssetInput.classList.remove('hidden');
    detailedAssetsBtn.classList.remove('bg-gray-200', 'text-gray-800');
    detailedAssetsBtn.classList.add('bg-indigo-600', 'text-white');
    simpleAssetsBtn.classList.remove('bg-indigo-600', 'text-white');
    simpleAssetsBtn.classList.add('bg-gray-200', 'text-gray-800');
  });

  // Toggle income end date input
  limitedIncomeCheckbox.addEventListener('change', () => {
    if (limitedIncomeCheckbox.checked) {
      incomeEndDateContainer.classList.remove('hidden');
    } else {
      incomeEndDateContainer.classList.add('hidden');
    }
  });

  // Large expense modal handling
  addExpenseBtn.addEventListener('click', () => {
    // Reset form
    document.getElementById('expense-name').value = '';
    document.getElementById('expense-amount').value = '';
    document.getElementById('expense-date').value = '';
    document.getElementById('expense-amount-text').textContent = '';
    
    // Show modal
    expenseModal.classList.remove('hidden');
  });

  cancelExpenseBtn.addEventListener('click', () => {
    expenseModal.classList.add('hidden');
  });

  // Close modal if clicking outside of it
  expenseModal.addEventListener('click', (e) => {
    if (e.target === expenseModal) {
      expenseModal.classList.add('hidden');
    }
  });

  // Preset expense buttons
  expensePresets.forEach(preset => {
    preset.addEventListener('click', () => {
      const amount = preset.dataset.amount;
      document.getElementById('expense-name').value = preset.dataset.label;
      document.getElementById('expense-amount').value = amount;
      document.getElementById('expense-amount-text').textContent = formatAmountText(amount);
      
      // Set a default date 5 years from now for the expense
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 5);
      document.getElementById('expense-date').valueAsDate = futureDate;
      
      expenseModal.classList.remove('hidden');
    });
  });

  // Save expense
  saveExpenseBtn.addEventListener('click', () => {
    const name = document.getElementById('expense-name').value;
    const amount = parseFloat(document.getElementById('expense-amount').value);
    const date = document.getElementById('expense-date').value;
    
    if (!name || isNaN(amount) || amount <= 0 || !date) {
      alert('Please fill all fields with valid values');
      return;
    }
    
    // Add expense to array
    const expense = {
      id: `expense-${expenseCounter++}`,
      name,
      amount,
      date
    };
    
    largeExpenses.push(expense);
    
    // Add to UI
    renderExpense(expense);
    
    // Close modal
    expenseModal.classList.add('hidden');
  });

  // Render a large expense in the UI
  function renderExpense(expense) {
    const expenseEl = document.createElement('div');
    expenseEl.id = expense.id;
    expenseEl.className = 'expense-item bg-gray-50 rounded-md p-3 mb-2 flex justify-between items-center';
    
    const dateObj = new Date(expense.date);
    const formattedDate = `${dateObj.getDate().toString().padStart(2, '0')}/${(dateObj.getMonth() + 1).toString().padStart(2, '0')}/${dateObj.getFullYear()}`;
    
    expenseEl.innerHTML = `
      <div>
        <p class="font-medium text-gray-800">${expense.name}</p>
        <p class="text-sm text-gray-500">${formattedDate}</p>
      </div>
      <div class="flex items-center gap-3">
        <div>
          <span class="font-medium">₹${formatNumber(expense.amount)}</span>
          <p class="text-xs text-gray-500">${formatAmountText(expense.amount)}</p>
        </div>
        <button class="text-red-500 hover:text-red-700" onclick="removeExpense('${expense.id}')">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
          </svg>
        </button>
      </div>
    `;
    
    largeExpensesContainer.appendChild(expenseEl);
  }

  // Global function to remove an expense
  window.removeExpense = function(id) {
    // Remove from array
    largeExpenses = largeExpenses.filter(expense => expense.id !== id);
    
    // Remove from UI
    const expenseEl = document.getElementById(id);
    if (expenseEl) {
      expenseEl.remove();
    }
  };

  // Format numbers for display
  function formatNumber(num) {
    return num.toLocaleString('en-IN');
  }

  // Format amount in text format (Lakhs, Crores)
  function formatAmountText(amount) {
    amount = parseFloat(amount);
    if (isNaN(amount) || amount === 0) return '';
    
    if (amount >= 10000000) { // Crores (≥ 1 Cr)
      return `${(amount / 10000000).toFixed(2)} Crore`;
    } else if (amount >= 100000) { // Lakhs (≥ 1 Lakh)
      return `${(amount / 100000).toFixed(2)} Lakh`;
    } else if (amount >= 1000) { // Thousands (≥ 1K)
      return `${(amount / 1000).toFixed(2)} Thousand`;
    } else {
      return amount.toFixed(2);
    }
  }

  // Add event listeners for money input fields to update help text
  moneyInputs.forEach(input => {
    input.addEventListener('input', function() {
      const amount = parseFloat(this.value) || 0;
      const textElement = document.getElementById(`${this.id}-text`);
      if (textElement) {
        textElement.textContent = formatAmountText(amount);
      }
    });
  });

  // Format date to MMM YYYY
  function formatDateMonthYear(date) {
    const options = { year: 'numeric', month: 'short' };
    return date.toLocaleDateString('en-IN', options);
  }

  // Set today's date as the minimum date for expense date picker
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('expense-date').min = today;
  document.getElementById('income-end-date').min = today;

  // Update return rates from inputs
  function updateReturnRates() {
    // Only update individual rates when in detailed view
    if (simpleAssetInput.classList.contains('hidden')) {
      // Using detailed asset view, get individual rates
      assetReturnRates.cash = parseFloat(document.getElementById('cash-return').value) || assetReturnRates.cash;
      assetReturnRates.fixedDeposits = parseFloat(document.getElementById('fd-return').value) || assetReturnRates.fixedDeposits;
      assetReturnRates.equity = parseFloat(document.getElementById('equity-return').value) || assetReturnRates.equity;
      assetReturnRates.gold = parseFloat(document.getElementById('gold-return').value) || assetReturnRates.gold;
      assetReturnRates.realEstate = parseFloat(document.getElementById('real-estate-return').value) || assetReturnRates.realEstate;
      assetReturnRates.other = parseFloat(document.getElementById('other-return').value) || assetReturnRates.other;
    }
    // We handle the simple view case directly in calculateWeightedReturnRate
  }

  // Calculate the weighted average return rate based on asset allocation
  function calculateWeightedReturnRate(assets) {
    const totalAssets = Object.values(assets).reduce((sum, val) => sum + val, 0);
    if (totalAssets <= 0) return 0.07; // Default 7% if no assets
    
    // If we're in simple view, just return the single rate directly
    if (!simpleAssetInput.classList.contains('hidden')) {
      // We're in simple view, use the single return rate
      const singleReturnRate = parseFloat(document.getElementById('asset-return-rate').value) || 7;
      return singleReturnRate / 100; // Convert % to decimal
    }
    
    // Otherwise calculate weighted average for detailed view
    let weightedSum = 0;
    for (const [assetType, amount] of Object.entries(assets)) {
      const weight = amount / totalAssets;
      weightedSum += weight * (assetReturnRates[assetType] / 100); // Convert % to decimal
    }
    
    return weightedSum;
  }

  // Calculate financial runway
  calculateBtn.addEventListener('click', () => {
    // Get input values
    const useDetailedAssets = detailedAssetInput.classList.contains('hidden') ? false : true;
    
    // Update return rates from inputs
    updateReturnRates();
    
    // Debug logs
    console.log("Asset return rates:", assetReturnRates);
    console.log("Simple/Detailed view:", useDetailedAssets ? "Detailed" : "Simple");
    if (!useDetailedAssets) {
      console.log("Simple view return rate:", document.getElementById('asset-return-rate').value);
    }
    
    let totalAssets = 0;
    let assetAllocation = {};
    
    if (!useDetailedAssets) {
      totalAssets = parseFloat(document.getElementById('total-assets').value) || 0;
      // Simple view - treat all as a single asset type
      assetAllocation = { other: totalAssets };
    } else {
      // Detailed view - get allocation per asset type
      const cashAssets = parseFloat(document.getElementById('cash-assets').value) || 0;
      const fixedDeposits = parseFloat(document.getElementById('fixed-deposits').value) || 0;
      const equityAssets = parseFloat(document.getElementById('equity-assets').value) || 0;
      const goldAssets = parseFloat(document.getElementById('gold-assets').value) || 0;
      const realEstateAssets = parseFloat(document.getElementById('real-estate').value) || 0;
      const excludeRealEstate = document.getElementById('exclude-real-estate').checked;
      const otherAssets = parseFloat(document.getElementById('other-assets').value) || 0;
      
      assetAllocation = {
        cash: cashAssets,
        fixedDeposits: fixedDeposits,
        equity: equityAssets,
        gold: goldAssets,
        realEstate: excludeRealEstate ? 0 : realEstateAssets,
        other: otherAssets
      };
      
      // Calculate total assets
      totalAssets = Object.values(assetAllocation).reduce((sum, val) => sum + val, 0);
    }
    
    const monthlyIncome = parseFloat(document.getElementById('monthly-income').value) || 0;
    const incomeGrowthRate = parseFloat(document.getElementById('income-growth').value) || 0;
    const limitedIncome = document.getElementById('limited-income').checked;
    let incomeEndDate = null;
    if (limitedIncome) {
      incomeEndDate = new Date(document.getElementById('income-end-date').value);
      if (isNaN(incomeEndDate.getTime())) {
        alert('Please enter a valid income end date');
        return;
      }
    }
    
    const monthlyExpenses = parseFloat(document.getElementById('monthly-expenses').value) || 0;
    const inflationRate = parseFloat(document.getElementById('inflation-rate').value) || 0;
    
    // Input validation
    if (totalAssets <= 0 && monthlyIncome <= 0) {
      alert('Please enter either assets or monthly income');
      return;
    }
    
    if (monthlyExpenses <= 0) {
      alert('Please enter monthly expenses');
      return;
    }
    
    // Calculate runway
    const result = calculateFinancialRunway(
      totalAssets,
      assetAllocation,
      monthlyIncome,
      monthlyExpenses,
      incomeGrowthRate,
      inflationRate,
      limitedIncome ? incomeEndDate : null,
      largeExpenses
    );
    
    // Display results
    displayResults(result);
  });

  // Expense adjustment slider
  expenseAdjustment.addEventListener('input', () => {
    expenseAdjustmentValue.textContent = `${expenseAdjustment.value}%`;
  });

  // Recalculate with adjustments
  recalculateBtn.addEventListener('click', () => {
    const adjustmentPercent = parseInt(expenseAdjustment.value) / 100;
    const includeExpenses = includeLargeExpenses.checked;
    
    // Get original values
    const useDetailedAssets = detailedAssetInput.classList.contains('hidden') ? false : true;
    
    // Update return rates
    updateReturnRates();
    
    let totalAssets = 0;
    let assetAllocation = {};
    
    if (!useDetailedAssets) {
      totalAssets = parseFloat(document.getElementById('total-assets').value) || 0;
      assetAllocation = { other: totalAssets };
    } else {
      const cashAssets = parseFloat(document.getElementById('cash-assets').value) || 0;
      const fixedDeposits = parseFloat(document.getElementById('fixed-deposits').value) || 0;
      const equityAssets = parseFloat(document.getElementById('equity-assets').value) || 0;
      const goldAssets = parseFloat(document.getElementById('gold-assets').value) || 0;
      const realEstateAssets = parseFloat(document.getElementById('real-estate').value) || 0;
      const excludeRealEstate = document.getElementById('exclude-real-estate').checked;
      const otherAssets = parseFloat(document.getElementById('other-assets').value) || 0;
      
      assetAllocation = {
        cash: cashAssets,
        fixedDeposits: fixedDeposits,
        equity: equityAssets,
        gold: goldAssets,
        realEstate: excludeRealEstate ? 0 : realEstateAssets,
        other: otherAssets
      };
      
      totalAssets = Object.values(assetAllocation).reduce((sum, val) => sum + val, 0);
    }
    
    const monthlyIncome = parseFloat(document.getElementById('monthly-income').value) || 0;
    const incomeGrowthRate = parseFloat(document.getElementById('income-growth').value) || 0;
    const limitedIncome = document.getElementById('limited-income').checked;
    let incomeEndDate = null;
    if (limitedIncome) {
      incomeEndDate = new Date(document.getElementById('income-end-date').value);
    }
    
    const monthlyExpenses = parseFloat(document.getElementById('monthly-expenses').value) || 0;
    const adjustedMonthlyExpenses = monthlyExpenses * (1 + adjustmentPercent);
    const inflationRate = parseFloat(document.getElementById('inflation-rate').value) || 0;
    
    // Calculate runway with adjustments
    const result = calculateFinancialRunway(
      totalAssets,
      assetAllocation,
      monthlyIncome,
      adjustedMonthlyExpenses,
      incomeGrowthRate,
      inflationRate,
      limitedIncome ? incomeEndDate : null,
      includeExpenses ? largeExpenses : []
    );
    
    // Display results
    displayResults(result, true);
  });

  // Main calculation function
  function calculateFinancialRunway(
    initialAssets,
    assetAllocation,
    monthlyIncome,
    monthlyExpenses,
    incomeGrowthRate,
    inflationRate,
    incomeEndDate,
    largeExpenses
  ) {
    // Convert annual rates to monthly
    const monthlyIncomeGrowthRate = incomeGrowthRate / 100 / 12;
    const monthlyInflationRate = inflationRate / 100 / 12;
    
    // Calculate weighted average return rate based on asset allocation
    const effectiveAnnualReturnRate = calculateWeightedReturnRate(assetAllocation);
    const monthlyAssetGrowthRate = effectiveAnnualReturnRate / 12;
    
    // Debug logs
    console.log("Effective annual return rate:", effectiveAnnualReturnRate * 100, "%");
    console.log("Monthly asset growth rate:", monthlyAssetGrowthRate * 100, "%");
    console.log("Asset allocation:", assetAllocation);
    console.log("Asset return rates being used:", assetReturnRates);
    
    // Initialize values
    let currentAssets = initialAssets;
    let currentMonthlyIncome = monthlyIncome;
    let currentMonthlyExpenses = monthlyExpenses;
    let currentDate = new Date();
    let monthsCount = 0;
    
    // Sort large expenses by date
    const sortedExpenses = [...largeExpenses].sort((a, b) => 
      new Date(a.date) - new Date(b.date)
    );
    
    // Data for chart and display
    const chartData = {
      labels: [],
      datasets: [{
        label: 'Assets',
        data: [],
        borderColor: '#4f46e5',
        backgroundColor: 'rgba(79, 70, 229, 0.1)',
        fill: true
      }]
    };
    
    // Store milestone months (for recommendations)
    let milestoneMonths = {};
    
    // Add initial point to chart
    chartData.labels.push(formatDateMonthYear(currentDate));
    chartData.datasets[0].data.push(currentAssets);
    
    // Project finances month by month
    while (currentAssets > 0 && monthsCount < 1200) { // Max 100 years
      // Move to next month
      currentDate.setMonth(currentDate.getMonth() + 1);
      monthsCount++;
      
      // Process any large expenses for this month
      while (sortedExpenses.length > 0) {
        const firstExpense = sortedExpenses[0];
        const expenseDate = new Date(firstExpense.date);
        
        // If expense is due this month or earlier
        if (expenseDate.getFullYear() <= currentDate.getFullYear() && 
            expenseDate.getMonth() <= currentDate.getMonth()) {
          // Deduct expense
          currentAssets -= firstExpense.amount;
          sortedExpenses.shift(); // Remove this expense
          
          // Break out if assets depleted
          if (currentAssets <= 0) {
            currentAssets = 0;
            break;
          }
        } else {
          // Expense is in the future
          break;
        }
      }
      
      // Monthly income (if we haven't passed income end date)
      if (!incomeEndDate || currentDate < incomeEndDate) {
        currentAssets += currentMonthlyIncome;
      }
      
      // Deduct monthly expenses
      currentAssets -= currentMonthlyExpenses;
      
      // Break if assets depleted after expenses
      if (currentAssets <= 0) {
        currentAssets = 0;
        break;
      }
      
      // Apply asset growth/investment returns
      const growthAmount = currentAssets * monthlyAssetGrowthRate;
      currentAssets += growthAmount;
      
      // Debug the first 3 months of calculation
      if (monthsCount <= 3) {
        console.log(`Month ${monthsCount}: Assets = ${currentAssets.toFixed(2)}, Growth added: ${growthAmount.toFixed(2)} (${(monthlyAssetGrowthRate * 100).toFixed(4)}%)`);
      }
      
      // Apply income growth and inflation for next month
      currentMonthlyIncome *= (1 + monthlyIncomeGrowthRate);
      currentMonthlyExpenses *= (1 + monthlyInflationRate);
      
      // Record data point for chart - USING CONSISTENT SAMPLING
      // For the first 2 years: monthly
      // For years 3-5: quarterly 
      // Beyond 5 years: semi-annually
      if (monthsCount <= 24 || 
          (monthsCount <= 60 && monthsCount % 3 === 0) || 
          monthsCount % 6 === 0 ||
          currentAssets < currentMonthlyExpenses * 12) {
        
        const dataLabel = formatDateMonthYear(currentDate);
        chartData.labels.push(dataLabel);
        chartData.datasets[0].data.push(currentAssets);
      }
      
      // Record milestone months for recommendations
      if (monthsCount === 1 || monthsCount === 12 || monthsCount === 60 || monthsCount === 120 || monthsCount === 240) {
        milestoneMonths[monthsCount] = {
          assets: currentAssets,
          expenses: currentMonthlyExpenses,
          income: currentMonthlyIncome,
          date: new Date(currentDate)
        };
      }
    }
    
    // Final runway date
    const runwayEndDate = new Date(currentDate);
    
    // Calculate sustainability score (0-100)
    let sustainabilityScore = 0;
    if (monthsCount >= 360) { // 30 years
      sustainabilityScore = 100;
    } else if (monthsCount >= 240) { // 20 years
      sustainabilityScore = 90;
    } else if (monthsCount >= 180) { // 15 years
      sustainabilityScore = 80;
    } else if (monthsCount >= 120) { // 10 years
      sustainabilityScore = 70;
    } else if (monthsCount >= 60) { // 5 years
      sustainabilityScore = 50;
    } else if (monthsCount >= 36) { // 3 years
      sustainabilityScore = 30;
    } else if (monthsCount >= 12) { // 1 year
      sustainabilityScore = 20;
    } else {
      sustainabilityScore = 10;
    }
    
    return {
      runwayMonths: monthsCount,
      runwayEndDate,
      initialAssets,
      chartData,
      sustainabilityScore,
      milestoneMonths,
      effectiveAnnualReturnRate: effectiveAnnualReturnRate * 100 // Convert to percentage for display
    };
  }

  // Display calculation results
  function displayResults(result, isRecalculation = false) {
    const resultsContainer = document.getElementById('results-container');
    resultsContainer.classList.remove('hidden');
    
    // Show end date
    const moneyLastsUntil = document.getElementById('money-lasts-until');
    
    if (result.runwayMonths >= 1200) {
      moneyLastsUntil.textContent = 'Beyond 100 years';
    } else {
      const options = { year: 'numeric', month: 'long' };
      moneyLastsUntil.textContent = result.runwayEndDate.toLocaleDateString('en-IN', options);
    }
    
    // Show years and months
    const runwayYearsMonths = document.getElementById('runway-years-months');
    const years = Math.floor(result.runwayMonths / 12);
    const months = result.runwayMonths % 12;
    
    if (result.runwayMonths >= 1200) {
      runwayYearsMonths.textContent = 'Indefinitely';
    } else if (years > 0 && months > 0) {
      runwayYearsMonths.textContent = `${years} years, ${months} months`;
    } else if (years > 0) {
      runwayYearsMonths.textContent = `${years} years`;
    } else {
      runwayYearsMonths.textContent = `${months} months`;
    }
    
    // Update sustainability score
    const sustainabilityScore = document.getElementById('sustainability-score');
    sustainabilityScore.textContent = `Score: ${result.sustainabilityScore}/100`;
    
    // Health indicator (progress bar)
    const healthIndicator = document.getElementById('health-indicator');
    healthIndicator.style.width = `${result.sustainabilityScore}%`;
    
    // Update color based on score
    healthIndicator.classList.remove('bg-red-600', 'bg-yellow-500', 'bg-green-600');
    
    if (result.sustainabilityScore >= 70) {
      healthIndicator.classList.add('bg-green-600');
    } else if (result.sustainabilityScore >= 40) {
      healthIndicator.classList.add('bg-yellow-500');
    } else {
      healthIndicator.classList.add('bg-red-600');
    }
    
    // Draw or update chart
    const ctx = document.getElementById('runway-chart').getContext('2d');
    
    if (runwayChart !== null) {
      runwayChart.data = result.chartData;
      runwayChart.update();
    } else {
      runwayChart = new Chart(ctx, {
        type: 'line',
        data: result.chartData,
        options: {
          responsive: true,
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  const value = context.parsed.y;
                  return `₹${formatNumber(value.toFixed(0))} (${formatAmountText(value)})`;
                }
              }
            }
          },
          elements: {
            line: {
              tension: 0.3, // Add curve between points
              borderWidth: 2
            },
            point: {
              radius: 3,
              hitRadius: 10,
              hoverRadius: 5
            }
          },
          scales: {
            y: {
              ticks: {
                callback: function(value) {
                  if (value >= 10000000) {
                    return `₹${(value / 10000000).toFixed(1)}Cr`;
                  } else if (value >= 100000) {
                    return `₹${(value / 100000).toFixed(1)}L`;
                  } else if (value >= 1000) {
                    return `₹${(value / 1000).toFixed(0)}K`;
                  }
                  return `₹${value}`;
                }
              }
            }
          }
        }
      });
    }
    
    // Generate recommendations
    const recommendations = document.getElementById('recommendations');
    recommendations.innerHTML = '';
    
    // Add recommendations based on results
    const recommendationList = [];
    
    // Add effective return rate information
    recommendationList.push(`Your assets have an effective annual return rate of ${result.effectiveAnnualReturnRate.toFixed(2)}%.`);
    
    // Add recommendations based on runway length
    if (result.runwayMonths < 12) {
      recommendationList.push('Your financial runway is less than 1 year. Consider increasing income or reducing expenses.');
    } else if (result.runwayMonths < 60) {
      recommendationList.push('Consider building an emergency fund of at least 6 months of expenses.');
    }
    
    // Add asset diversification recommendation if using simple asset input
    if (!detailedAssetInput.classList.contains('hidden')) {
      recommendationList.push('Diversifying your assets across different classes can help manage risk and potentially increase returns.');
    }
    
    // Expense reduction potential
    const monthlyExpenses = parseFloat(document.getElementById('monthly-expenses').value) || 0;
    if (result.runwayMonths < 120 && monthlyExpenses > 0) {
      const reducedExpenses = monthlyExpenses * 0.9; // 10% reduction
      
      // Create a copy of current asset allocation
      const currentAllocation = {};
      for (const assetType in assetAllocation) {
        currentAllocation[assetType] = assetAllocation[assetType];
      }
      
      const newRunway = calculateFinancialRunway(
        result.initialAssets,
        currentAllocation,
        parseFloat(document.getElementById('monthly-income').value) || 0,
        reducedExpenses,
        parseFloat(document.getElementById('income-growth').value) || 0,
        parseFloat(document.getElementById('inflation-rate').value) || 0,
        document.getElementById('limited-income').checked ? new Date(document.getElementById('income-end-date').value) : null,
        largeExpenses
      );
      
      const additionalMonths = newRunway.runwayMonths - result.runwayMonths;
      
      if (additionalMonths > 6) {
        recommendationList.push(`Reducing expenses by 10% could extend your runway by approximately ${Math.floor(additionalMonths / 12)} years and ${additionalMonths % 12} months.`);
      }
    }
    
    // Display recommendations
    if (recommendationList.length > 0) {
      const title = document.createElement('h3');
      title.className = 'font-medium text-gray-700 mb-2';
      title.textContent = 'Recommendations';
      recommendations.appendChild(title);
      
      const ul = document.createElement('ul');
      ul.className = 'list-disc pl-5 space-y-1';
      
      recommendationList.forEach(rec => {
        const li = document.createElement('li');
        li.textContent = rec;
        ul.appendChild(li);
      });
      
      recommendations.appendChild(ul);
    }
    
    // Scroll to results on first calculation
    if (!isRecalculation) {
      resultsContainer.scrollIntoView({ behavior: 'smooth' });
    }
  }

  // Initialize amount text for all money inputs on page load
  moneyInputs.forEach(input => {
    const amount = parseFloat(input.value) || 0;
    const textElement = document.getElementById(`${input.id}-text`);
    if (textElement && amount > 0) {
      textElement.textContent = formatAmountText(amount);
    }
  });
}); 