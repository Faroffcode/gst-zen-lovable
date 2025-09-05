# Company Settings Feature

## Overview
The Company Settings feature allows you to manage all company-related information that appears in invoices, including company details, address, contact information, tax details, and bank information.

## Features

### 1. Company Information
- **Company Name**: The main company name displayed on invoices
- **Company Tagline**: Subtitle or description under the company name
- **Proprietor Name**: The name of the business owner/proprietor

### 2. Company Address
- **Address**: Complete business address
- **City**: City name
- **State**: State/Province
- **Pincode**: Postal/ZIP code
- **Country**: Country name

### 3. Contact Information
- **Phone**: Business phone number
- **Email**: Business email address
- **Website**: Company website URL

### 4. Tax Information
- **GSTIN**: Goods and Services Tax Identification Number
- **PAN**: Permanent Account Number

### 5. Bank Details
- **Bank Name**: Name of the bank
- **Account Name**: Account holder name
- **Account Number**: Bank account number
- **IFSC Code**: Indian Financial System Code
- **Account Type**: Type of account (Current, Savings, etc.)
- **Branch Name**: Bank branch name

### 6. Additional Settings
- **Footer Message**: Custom message displayed at the bottom of invoices
- **Currency Symbol**: Currency symbol used in invoices (₹, $, etc.)

## How to Use

1. **Access Company Settings**:
   - Go to Settings page
   - Click on "Company Settings" card
   - The dialog will open with current settings

2. **Update Information**:
   - Fill in or modify any field you want to change
   - All fields are optional except for required ones (marked with *)
   - Changes are saved locally in your browser

3. **Save Changes**:
   - Click "Save Settings" to save your changes
   - Changes will be applied immediately to all new invoices
   - Existing invoices will also reflect the new information when viewed

4. **Reset to Default**:
   - Click "Reset to Default" to restore original values
   - This will reset all fields to the default company information

## Impact on Invoices

When you update company settings, the changes will be reflected in:

- **Invoice PDFs**: All generated PDF invoices will use the updated information
- **Invoice View Dialog**: The preview dialog will show updated company details
- **Custom Templates**: If using custom templates, the placeholders will be updated

## Data Storage

- Company settings are stored locally in your browser's localStorage
- Settings persist across browser sessions
- No data is sent to external servers
- You can export/import settings by copying the localStorage data

## Available Placeholders for Custom Templates

If you're using custom invoice templates, you can use these placeholders:

- `{{COMPANY_NAME}}` - Company name
- `{{COMPANY_TAGLINE}}` - Company tagline
- `{{PROPRIETOR_NAME}}` - Proprietor name
- `{{COMPANY_ADDRESS}}` - Company address
- `{{COMPANY_CITY}}` - Company city
- `{{COMPANY_STATE}}` - Company state
- `{{COMPANY_PINCODE}}` - Company pincode
- `{{COMPANY_COUNTRY}}` - Company country
- `{{COMPANY_PHONE}}` - Company phone
- `{{COMPANY_EMAIL}}` - Company email
- `{{COMPANY_WEBSITE}}` - Company website
- `{{COMPANY_GSTIN}}` - Company GSTIN
- `{{COMPANY_PAN}}` - Company PAN
- `{{BANK_NAME}}` - Bank name
- `{{ACCOUNT_NAME}}` - Account holder name
- `{{ACCOUNT_NUMBER}}` - Account number
- `{{IFSC_CODE}}` - IFSC code
- `{{ACCOUNT_TYPE}}` - Account type
- `{{BRANCH_NAME}}` - Branch name
- `{{CURRENCY_SYMBOL}}` - Currency symbol
- `{{FOOTER_TEXT}}` - Footer message

## Security Notes

- All company information is stored locally in your browser
- No sensitive information is transmitted to external servers
- Make sure to keep your browser secure and don't share your device with unauthorized users
- Consider backing up your settings if you're using a shared computer
