# GST Zen - Complete GST Management System

[![React](https://img.shields.io/badge/React-18.3.1-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4.19-646CFF.svg)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-green.svg)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4.17-38B2AC.svg)](https://tailwindcss.com/)

A modern, comprehensive GST (Goods and Services Tax) management system built with React, TypeScript, and Supabase. Designed for Indian businesses to manage inventory, customers, invoices, and GST compliance with ease.

## 🌟 Features

### 📊 Dashboard
- **Real-time Statistics**: Live inventory value, today's revenue, total customers
- **Inventory Overview**: Total products, stock levels, low stock alerts
- **Smart Alerts**: Automatic notifications for low stock and out-of-stock items
- **Top Products**: Display highest value products by stock worth

### 📦 Inventory Management
- **Product Management**: Add, edit, delete, and categorize products
- **Stock Tracking**: Real-time stock levels with minimum stock alerts
- **Category Organization**: Organize products by categories (Fertilizers, Pesticides, Seeds, etc.)
- **Stock Movements**: Track purchase, sale, adjustment, and return transactions
- **Multiple Units**: Support for kg, ltr, pcs, box, bag, and custom units
- **HSN Code Support**: HSN code management for GST compliance

### 🛒 Purchase Management
- **Purchase Recording**: Record purchases for existing and new products
- **Automatic Stock Updates**: Inventory automatically updates on purchase
- **Purchase History**: Complete transaction history with search and filtering
- **Cost Tracking**: Track unit costs and total purchase values
- **Supplier References**: Record purchase order numbers and supplier details

### 👥 Customer Management
- **Customer Database**: Comprehensive customer information management
- **GSTIN Support**: Store and validate customer GSTIN numbers
- **Address Management**: Complete address and contact information
- **Guest Customers**: Support for one-time guest customer invoices

### 🧾 Invoice Management
- **GST Compliant Invoices**: Generate professional GST-compliant tax invoices
- **Automatic Calculations**: Real-time calculation of subtotal, tax, and total amounts
- **Multiple Tax Rates**: Support for different GST rates (5%, 12%, 18%, 28%)
- **Invoice Status Tracking**: Draft, Sent, Paid, Cancelled status management
- **PDF Generation**: Download invoices as PDF with professional formatting
- **Print Support**: Direct printing with print-optimized layouts
- **Edit & Delete**: Full CRUD operations on invoices
- **Search & Filter**: Advanced search and filtering capabilities

### 📈 Reports & Analytics
- **GST Reports**: Generate GST summary reports
- **Sales Analytics**: Track sales performance and trends
- **Stock Reports**: Inventory movement and stock summary reports
- **Export Functionality**: Export data in various formats

## 🛠 Technology Stack

### Frontend
- **Framework**: React 18.3.1 with TypeScript 5.8.3
- **Build Tool**: Vite 5.4.19 for fast development and building
- **Styling**: Tailwind CSS 3.4.17 with custom components
- **UI Components**: shadcn-ui (Radix UI + custom styling)
- **State Management**: React Query for server state, React Hook Form for forms
- **Routing**: React Router DOM 6.30.1
- **Icons**: Lucide React icons

### Backend & Database
- **Backend**: Supabase (PostgreSQL database with real-time subscriptions)
- **Authentication**: Supabase Auth (ready for future implementation)
- **API**: Supabase client with TypeScript support
- **Database Features**: Row Level Security, triggers, and functions

### Development Tools
- **Package Manager**: npm
- **Linting**: ESLint with TypeScript support
- **Hot Reload**: Vite HMR for instant development feedback
- **TypeScript**: Strict type checking for better code quality

## 🚀 Quick Start

### Prerequisites
- Node.js v18.x or higher
- npm (bundled with Node.js)
- Git for version control

### Installation

1. **Clone the repository**
   ```bash
   git clone <YOUR_GIT_URL>
   cd gst-zen-lovable
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   - Copy `.env.example` to `.env`
   - Configure your Supabase credentials:
     ```env
     VITE_SUPABASE_URL=your_supabase_url
     VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
     ```

4. **Start development server**
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:8080`

## 🌐 Deployment

### Lovable Platform (Recommended)

1. **Deploy via Lovable Dashboard**
   - Click "Share → Publish" in the Lovable interface
   - Your application will be deployed automatically
   - Custom domains can be configured in project settings

### Manual Deployment

1. **Build for production**
   ```bash
   npm run build
   ```

2. **Preview production build locally**
   ```bash
   npm run preview
   ```

3. **Deploy to hosting platform**
   - Upload the `dist` folder to your hosting provider
   - Ensure environment variables are configured
   - Set up Supabase database and configure connection

### Supabase Setup

1. **Create Supabase Project**
   - Go to [Supabase](https://supabase.com/)
   - Create a new project
   - Copy the URL and anon key to your `.env` file

2. **Database Setup**
   - Run the provided SQL migrations in `supabase/migrations/`
   - Or use the `complete-database-setup.sql` for full setup
   - Enable Row Level Security for all tables

3. **Database Tables**
   - `customers`: Customer information and GSTIN details
   - `products`: Product catalog with HSN codes and pricing
   - `invoices`: Invoice headers with customer and totals
   - `invoice_items`: Individual line items for invoices
   - `stock_ledger`: Stock movement transactions

## 📱 Usage Guide

### Getting Started
1. **Dashboard**: Overview of your business metrics and alerts
2. **Add Products**: Start by adding your product catalog in Inventory
3. **Add Customers**: Create customer profiles with GSTIN details
4. **Record Purchases**: Use Purchase module to stock inventory
5. **Create Invoices**: Generate GST-compliant invoices for sales

### Key Workflows

#### Creating an Invoice
1. Navigate to Invoices → Create Invoice
2. Select customer or add guest details
3. Add products and quantities
4. System calculates GST automatically
5. Save as draft or mark as sent
6. Download PDF or print directly

#### Managing Inventory
1. Go to Inventory → Add Product
2. Enter product details, HSN code, and pricing
3. Set minimum stock levels for alerts
4. Use Purchase module to record stock receipts
5. Monitor stock levels via Dashboard alerts

#### Purchase Management
1. Navigate to Purchase → Record Purchase
2. Select existing product or create new
3. Enter quantity and cost details
4. System updates inventory automatically
5. Track purchase history and costs

## 🔧 Configuration

### Environment Variables
```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional: Supabase CLI (for development)
SUPABASE_ACCESS_TOKEN=your_access_token
```

### Database Configuration
- Ensure all migrations are applied
- Configure Row Level Security policies
- Set up database triggers for automatic calculations
- Enable real-time subscriptions if needed

### PDF Invoice Generation
- Generate professional invoices with automatic GST calculations
- Download invoices as PDF files
- Print invoices directly from the browser

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # shadcn-ui components
│   ├── customers/      # Customer management components
│   ├── inventory/      # Inventory management components
│   ├── invoices/      # Invoice management components
│   ├── purchase/       # Purchase management components
│   └── Dashboard.tsx   # Main dashboard component
├── hooks/              # Custom React hooks
│   ├── useProducts.ts  # Product management hooks
│   ├── useInvoices.ts  # Invoice management hooks
│   ├── useCustomers.ts # Customer management hooks
│   └── useStockLedger.ts # Stock transaction hooks
├── pages/              # Page-level components
├── lib/                # Utility functions
├── integrations/       # External service integrations
│   └── supabase/       # Supabase client and types
└── App.tsx            # Main application component
```

## 🚨 Known Issues & Solutions

### SKU Field Requirements
- Database has SKU as `NOT NULL UNIQUE`
- Frontend validation removed as per requirements
- Handle empty SKU submissions appropriately

### Invoice Calculations
- Ensure database triggers are properly installed
- Use `COMPLETE_INVOICE_FIX.sql` if totals show as 0
- Verify calculation functions are working

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Check the [Issues](https://github.com/your-repo/issues) page
- Review the documentation above
- Contact the development team

## 🔄 Version History

### v1.0.0 (Current)
- Complete GST management system
- Real-time dashboard with inventory integration
- Full CRUD operations for all entities
- PDF invoice generation
- Advanced search and filtering
- Responsive design for all devices

---

**Built with ❤️ for Indian businesses to simplify GST compliance and inventory management.**