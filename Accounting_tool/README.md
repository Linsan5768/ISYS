# Case 4 Fanum Tax

A comprehensive tax accounting application designed to simplify financial management and tax planning. This tool helps users visualize their income, expenses, tax liabilities, and financial trends in an intuitive dashboard.

![Tax Dashboard Screenshot](web_frontend/public/dashboard-preview.png)

## What This Tool Does

- **Track Your Finances**: Easily record and categorize your income, expenses, and tax-related transactions
- **Visualize Financial Health**: See your financial trends over time with interactive charts and graphs
- **Monitor Tax Obligations**: Keep track of upcoming tax payments with due dates and status indicators
- **Plan Ahead**: Use quarterly or yearly views to better plan your financial future
- **Take It Anywhere**: Access your financial data from any device with a web browser

## Main Features

### 📊 Comprehensive Dashboard

The dashboard provides a complete overview of your financial situation:

- **Financial Trends**: Track income, expenses, and net income over time
- **Current Tax Liabilities**: See what taxes you owe and when they're due
- **Transaction History**: Review your past financial activities
- **Outstanding Items**: Monitor upcoming financial items and system-estimated tax items

### 🔄 Flexible View Options

Switch between different view modes to analyze your data:

- **Yearly View**: See the big picture of your finances across multiple years
- **Quarterly View**: Focus on shorter time periods for more detailed analysis

### 📋 Data Export

Generate reports of your financial data:

- **CSV Export**: For further analysis in spreadsheet applications
- **PDF Export**: For professional-looking financial reports

## Getting Started

1. **Launch the Application**: 
   - Open your web browser and navigate to the application URL
   - For local development, visit http://localhost:8080

2. **Dashboard Overview**:
   - The main dashboard displays your financial information
   - Toggle between yearly and quarterly views using the buttons in the action panel

3. **View Your Financial Data**:
   - Financial Trends chart shows your income and expenses over time
   - Current Tax Liabilities section displays your upcoming tax obligations
   - Transaction History lists your recent financial activities

4. **Filter Your Data**:
   - Click the FILTER button to set date ranges and view specific time periods
   - Use the filter dialog to select years or quarters of interest

5. **Export Your Data**:
   - Click the EXPORT button to download your financial information
   - Choose between CSV and PDF formats
   - Select which sections of data to include in your export

## Use Case Examples

### Personal Tax Planning

Monitor your tax situation throughout the year:
- Track quarterly estimated tax payments
- See when tax payments are due
- Analyze your income and tax liability patterns

### Small Business Financial Management

Keep your business finances organized:
- Monitor business income and expenses
- Track business-related tax deductions
- Prepare for tax season with detailed financial reports

### Investment Income Tracking

Stay on top of your investment portfolio:
- Record investment income and capital gains
- View projected returns and tax implications
- Analyze investment performance over time

## For Developers

If you're interested in the technical aspects of this project or want to contribute, please see the [Developer Documentation](DEVELOPER.md) for setup instructions and technical details.

## About This Project

This Accounting Tool was developed as an educational project to demonstrate modern web application development and financial data visualization techniques. While it provides useful functionality for personal and small business financial management, it is not intended to replace professional accounting software or tax advice.

For questions or feedback, please open an issue in the project repository.

## Deployment Options

### Option 1: One-Click Development Setup

Run the application locally in development mode:

```bash
# Clone the repository
git clone <repository-url>
cd Accounting_tool

# Install dependencies and start the application
./deploy-full.sh
npm start
```

The application will be available at http://localhost:5002

### Option 2: Docker Deployment

Deploy using Docker for production:

```bash
# Clone the repository
git clone <repository-url>
cd Accounting_tool

# Build and run with Docker
docker-compose up -d
```

The application will be available at http://localhost:5002

### Option 3: Manual Setup

Setup and run the application manually:

1. Setup backend:
```bash
cd backend
npm install
# Create .env file with proper configuration
```

2. Build frontend:
```bash
cd web_frontend
npm install
npm run build
# Copy dist/ to backend/public/
```

3. Start server:
```bash
cd backend
npm start
```

## System Requirements

- Node.js 16+
- npm 7+
- (Optional) Docker and Docker Compose for containerized deployment

## Configuration

The application can be configured using environment variables:

- `PORT`: The port to run the server on (default: 5002)
- `DATABASE_PATH`: Path to the SQLite database file
- `JWT_SECRET`: Secret key for JWT authentication

## Features

- Tax form submission and management
- Financial tracking and reporting
- Tax liability calculation
- User authentication and authorization
