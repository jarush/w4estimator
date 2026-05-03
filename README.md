# W-4 Estimator & Tax Calculator

A responsive, client-side web application designed to help users estimate their tax liability and federal refund. It simplifies the W-4 process by calculating projected annual income, pre-tax deductions, and tax credits based on paycheck data.

## Disclaimer

This tool is designed based on **2026 tax year projections**. While every effort has been made to provide an accurate estimate, tax laws are complex and subject to change.

**Please note:**
- This application provides **estimates only** and does not constitute official financial or tax advice.
- I provide no guarantee regarding the absolute accuracy of the results.
- Users should consult with a qualified tax professional or the IRS for official tax filings.

## Features

- **Paycheck Projection:** Input current and Year-To-Date (YTD) data to project annual totals.
- **Multiple Job Support:** Add and manage income for both "Self" and "Spouse" dynamically.
- **Additional Income Tracking:** Includes fields for Self-Employment, Interest, and Capital Gains (Short/Long Term).
- **Tax Credit Support:** Factor in credits like the Foreign Tax Credit.
- **Detailed Summaries:** Breakdown of Gross Wages, Pre-Tax Deductions, and Taxable Wages.
- **Data Portability:** Feature to **Import/Export Data** via JSON files to save your progress locally.
- **Responsive UI:** Built with Bootstrap for a clean experience on desktop and mobile.
- **2026 Tax Year** Built using information for the 2026 tax year.

## Technologies Used

- **HTML5 / CSS3**: Layout and custom styling.
- **Bootstrap 5**: Responsive grid and card components.
- **JavaScript (Vanilla)**: Dynamic form handling, step-based navigation, and tax calculation logic.

## Getting Started

Since this is a client-side application, there is no server-side setup required.

1. **Clone the repository:**
   ```bash
   git clone https://github.com
   ```
2. **Open the project:**
   Simply open `index.html` in any modern web browser.

## How to Use

1. Work Income: Enter your latest paycheck details. If you have multiple jobs, click **"+ Add Another Job"**.
2. Other Income: Add any external income sources like dividends or freelance work.
3. Credits: Enter applicable tax credits.
4. Results: View your estimated refund or tax owed. Use the **"Details"** toggle to see a breakdown of the math.

## Project Structure

- `index.html` - The main application structure and step-based forms.
- `script.js` - Logic for calculations and UI interactions.

## License

This project is licensed under the GNU General Public License Version 3. See the LICENSE file for details.

