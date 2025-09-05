export interface CompanySettings {
  // Company Basic Info
  companyName: string;
  companyTagline: string;
  proprietorName: string;
  
  // Company Address
  address: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  
  // Contact Information
  phone: string;
  email: string;
  website: string;
  
  // Tax Information
  gstin: string;
  pan: string;
  
  // Bank Details
  bankName: string;
  accountName: string;
  accountNumber: string;
  ifscCode: string;
  accountType: string;
  branchName: string;
  
  // Additional Settings
  footerMessage: string;
  currencySymbol: string;
}

export const getCompanySettings = (): CompanySettings => {
  try {
    const savedSettings = localStorage.getItem('companySettings');
    if (savedSettings) {
      return JSON.parse(savedSettings);
    }
  } catch (error) {
    console.error('Error loading company settings:', error);
  }
  
  // Return default settings if no saved settings found
  return {
    companyName: "EZAZUL HAQUE",
    companyTagline: "Proprietor of BIO TECH CENTRE",
    proprietorName: "Ezazul Haque",
    address: "Nalhati to Rajgram Road, Vill :- Kaigoria, Post :- Diha",
    city: "West Bengal",
    state: "West Bengal",
    pincode: "731220",
    country: "India",
    phone: "",
    email: "",
    website: "",
    gstin: "19ADOPH4023K1ZD",
    pan: "ADOPH4023K",
    bankName: "State Bank of India",
    accountName: "Ezazul Haque",
    accountNumber: "000000000000",
    ifscCode: "SBIN0008540",
    accountType: "Current",
    branchName: "",
    footerMessage: "Thank you for business with us!",
    currencySymbol: "₹"
  };
};

export const saveCompanySettings = (settings: CompanySettings): void => {
  try {
    localStorage.setItem('companySettings', JSON.stringify(settings));
  } catch (error) {
    console.error('Error saving company settings:', error);
    throw new Error('Failed to save company settings');
  }
};
