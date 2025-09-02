-- Complete Database Setup for GST Management System
-- Run this entire script in your Supabase SQL Editor to ensure all tables and functions exist

-- 1. Create customers table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text,
  phone text,
  gstin text,
  address text,
  city text,
  state text,
  pincode text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Create products table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sku TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'General',
  hsn_code TEXT,
  unit TEXT NOT NULL DEFAULT 'kg',
  unit_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  tax_rate DECIMAL(5,2) NOT NULL DEFAULT 18.00,
  current_stock INTEGER NOT NULL DEFAULT 0,
  min_stock INTEGER NOT NULL DEFAULT 10,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Create invoices table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number text UNIQUE NOT NULL,
  customer_id uuid REFERENCES public.customers(id) ON DELETE RESTRICT,
  guest_name text,
  guest_email text,
  guest_phone text,
  guest_address text,
  guest_gstin text,
  invoice_date date NOT NULL DEFAULT CURRENT_DATE,
  due_date date,
  subtotal decimal(12,2) NOT NULL DEFAULT 0,
  tax_amount decimal(12,2) NOT NULL DEFAULT 0,
  total_amount decimal(12,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'cancelled')),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 4. Create invoice items table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.invoice_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  quantity decimal(10,3) NOT NULL,
  unit_price decimal(10,2) NOT NULL,
  tax_rate decimal(5,2) NOT NULL DEFAULT 18.00,
  line_total decimal(12,2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- 5. Create stock ledger table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.stock_ledger (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('purchase', 'sale', 'adjustment', 'return')),
  quantity_delta INTEGER NOT NULL,
  unit_cost DECIMAL(10,2),
  reference_no TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 6. Enable Row Level Security
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_ledger ENABLE ROW LEVEL SECURITY;

-- 7. Create policies (allow all operations for now)
DO $$ 
BEGIN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Allow all operations on customers" ON public.customers;
    DROP POLICY IF EXISTS "Allow all operations on products" ON public.products;
    DROP POLICY IF EXISTS "Allow all operations on invoices" ON public.invoices;
    DROP POLICY IF EXISTS "Allow all operations on invoice_items" ON public.invoice_items;
    DROP POLICY IF EXISTS "Allow all operations on stock_ledger" ON public.stock_ledger;
    
    -- Create new policies
    CREATE POLICY "Allow all operations on customers" ON public.customers FOR ALL USING (true) WITH CHECK (true);
    CREATE POLICY "Allow all operations on products" ON public.products FOR ALL USING (true) WITH CHECK (true);
    CREATE POLICY "Allow all operations on invoices" ON public.invoices FOR ALL USING (true) WITH CHECK (true);
    CREATE POLICY "Allow all operations on invoice_items" ON public.invoice_items FOR ALL USING (true) WITH CHECK (true);
    CREATE POLICY "Allow all operations on stock_ledger" ON public.stock_ledger FOR ALL USING (true) WITH CHECK (true);
END $$;

-- 8. Create the invoice number generation function
CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS text AS $$
DECLARE
  next_number integer;
  new_invoice_number text;
BEGIN
  -- Get the next invoice number
  SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 'INV-(\d+)') AS integer)), 0) + 1
  INTO next_number
  FROM public.invoices
  WHERE invoice_number ~ '^INV-\d+$';
  
  -- Format as INV-XXXX
  new_invoice_number := 'INV-' || LPAD(next_number::text, 4, '0');
  
  RETURN new_invoice_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 9. Create helper functions
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 10. Create triggers
DO $$
BEGIN
    -- Drop existing triggers if they exist
    DROP TRIGGER IF EXISTS update_customers_updated_at ON public.customers;
    DROP TRIGGER IF EXISTS update_products_updated_at ON public.products;
    DROP TRIGGER IF EXISTS update_invoices_updated_at ON public.invoices;
    
    -- Create new triggers
    CREATE TRIGGER update_customers_updated_at
        BEFORE UPDATE ON public.customers
        FOR EACH ROW
        EXECUTE FUNCTION public.update_updated_at_column();
        
    CREATE TRIGGER update_products_updated_at
        BEFORE UPDATE ON public.products
        FOR EACH ROW
        EXECUTE FUNCTION public.update_updated_at_column();
        
    CREATE TRIGGER update_invoices_updated_at
        BEFORE UPDATE ON public.invoices
        FOR EACH ROW
        EXECUTE FUNCTION public.update_updated_at_column();
END $$;

-- 11. Insert sample data if tables are empty
DO $$
BEGIN
    -- Insert sample customers if none exist
    IF NOT EXISTS (SELECT 1 FROM public.customers LIMIT 1) THEN
        INSERT INTO public.customers (name, email, phone, gstin, address, city, state, pincode) VALUES
        ('Sample Customer', 'customer@example.com', '+91-9876543210', '27ABCDE1234F1Z5', '123 Sample Street', 'Pune', 'Maharashtra', '411001');
    END IF;
    
    -- Insert sample products if none exist
    IF NOT EXISTS (SELECT 1 FROM public.products LIMIT 1) THEN
        INSERT INTO public.products (sku, name, category, hsn_code, unit, unit_price, tax_rate, current_stock, min_stock) VALUES
        ('SAMPLE001', 'Sample Product', 'General', '12345678', 'kg', 100.00, 18.00, 50, 10);
    END IF;
END $$;

-- 12. Create invoice calculation functions
CREATE OR REPLACE FUNCTION public.calculate_invoice_totals()
RETURNS TRIGGER AS $$
DECLARE
  invoice_subtotal decimal(12,2);
  invoice_tax_amount decimal(12,2);
  invoice_total decimal(12,2);
BEGIN
  -- Calculate totals for the invoice
  SELECT 
    COALESCE(SUM(quantity * unit_price), 0),
    COALESCE(SUM(quantity * unit_price * tax_rate / 100), 0),
    COALESCE(SUM(quantity * unit_price * (1 + tax_rate / 100)), 0)
  INTO invoice_subtotal, invoice_tax_amount, invoice_total
  FROM public.invoice_items
  WHERE invoice_id = COALESCE(NEW.invoice_id, OLD.invoice_id);
  
  -- Update the invoice totals
  UPDATE public.invoices
  SET 
    subtotal = invoice_subtotal,
    tax_amount = invoice_tax_amount,
    total_amount = invoice_total,
    updated_at = now()
  WHERE id = COALESCE(NEW.invoice_id, OLD.invoice_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to calculate line totals
CREATE OR REPLACE FUNCTION public.calculate_line_total()
RETURNS TRIGGER AS $$
BEGIN
  NEW.line_total := NEW.quantity * NEW.unit_price * (1 + NEW.tax_rate / 100);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 13. Create calculation triggers
DO $$
BEGIN
    -- Drop existing calculation triggers if they exist
    DROP TRIGGER IF EXISTS calculate_line_total_trigger ON public.invoice_items;
    DROP TRIGGER IF EXISTS calculate_invoice_totals_trigger ON public.invoice_items;
    
    -- Create line total calculation trigger
    CREATE TRIGGER calculate_line_total_trigger
      BEFORE INSERT OR UPDATE ON public.invoice_items
      FOR EACH ROW
      EXECUTE FUNCTION public.calculate_line_total();
    
    -- Create invoice totals calculation trigger
    CREATE TRIGGER calculate_invoice_totals_trigger
      AFTER INSERT OR UPDATE OR DELETE ON public.invoice_items
      FOR EACH ROW
      EXECUTE FUNCTION public.calculate_invoice_totals();
END $$;

-- 14. Test the function
SELECT public.generate_invoice_number() as test_invoice_number;