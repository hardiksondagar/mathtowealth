# Financial Runway Calculator

A powerful calculator that helps you visualize how long your current assets and income will sustain your lifestyle, accounting for regular expenses and planned major expenses.

## Features

### Asset Management
- **Simple/Detailed Views**: Choose between a simple total net worth input or detailed asset categorization
- **Asset Categories**: Track different asset types (Cash, Fixed Deposits, Equity, Gold, Real Estate, Other)
- **Custom Return Rates**: Set individual return rates for each asset class
- **Weighted Returns**: Automatic calculation of weighted average returns based on your asset allocation
- **Hard-to-Liquidate Toggle**: Option to exclude real estate or other hard-to-liquidate assets

### Income Tracking
- **Monthly Income**: Record your total monthly income
- **Growth Rate**: Set custom annual growth rate for your income
- **Limited Income**: Option to specify an end date for temporary income streams

### Expense Planning
- **Monthly Expenses**: Track your regular monthly expenses
- **Inflation Adjustment**: Set custom inflation rate to model increasing expenses over time
- **Large Future Expenses**: Add one-time large expenses (education, wedding, home purchase)
- **Expense Presets**: Quick-add common large expenses with preset amounts

### Results & Visualization
- **Clear End Date**: See exactly when your money will run out
- **Interactive Timeline**: Visual chart showing asset depletion curve with smooth transitions
- **Financial Health Score**: 0-100 sustainability score with color-coded indicators
- **Human-Readable Amounts**: All monetary values displayed in familiar formats (lakhs, crores)
- **Scenario Testing**: Instant what-if analysis by adjusting expenses or excluding large expenses
- **Smart Recommendations**: Personalized suggestions based on your financial situation

## Technical Features
- **Progressive Sampling**: Higher frequency data points early in the timeline, gradually reducing for distant future
- **Smooth Curves**: Natural curve interpolation for better visualization
- **Weighted Growth Calculation**: Assets grow according to their individual return rates
- **Compound Returns**: Monthly compounding of investment returns
- **Logarithmic Y-Axis**: Automatically scaled axis with abbreviated values (K, L, Cr)

## How to Use

1. **Enter Assets**: Choose between Simple or Detailed asset input
   - In Simple view: Enter your total net worth and overall return rate
   - In Detailed view: Break down your assets by type with individual return rates

2. **Add Income**: Enter your monthly income and expected growth rate
   - Toggle "Income will stop" if you have a temporary income source

3. **Set Expenses**: Enter your monthly expenses and expected inflation rate

4. **Add Large Expenses**: Include any major one-time expenses
   - Use presets for common expenses or create custom ones
   - Set expected dates for each large expense

5. **Calculate**: Click "Calculate Financial Runway" to see your results
   - View your financial runway end date
   - See your sustainability score
   - Explore the asset projection chart

6. **Test Scenarios**: Use the slider to adjust expenses and see how it affects your runway

## Running the Project

1. Clone this repository
2. Open `index.html` in your browser
3. Start planning your financial future!

## Technologies Used

- HTML5
- CSS3 with Tailwind CSS
- JavaScript
- Chart.js for data visualization

## License

MIT License 