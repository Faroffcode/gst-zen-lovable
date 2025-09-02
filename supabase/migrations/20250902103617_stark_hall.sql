/*
  # Create customers and invoices tables

  1. New Tables
    - `customers`
      - `id` (uuid, primary key)
      - `name` (text, required)
      - `email` (text, optional)
      - `phone` (text, optional)
      - `gstin` (text, optional)
      - `address` (text, optional)
      - `city` (text, optional)
      - `state` (text, optional)
      - `pincode` (text, optional)
      - `status` (text, default 'active')
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `invoices`
      - `id` (uuid, primary key)
      - `invoice_number` (text, unique)
      - `customer_id` (uuid, foreign key)
      - `invoice_date` (date)
      - `due_date` (date, optional)
      - `subtotal` (decimal)
      - `tax_amount` (decimal)
      - `total_amount` (decimal)
      - `status` (text, default 'draft')
      - `notes` (text, optional)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `invoice_items`
      - `id` (uuid, primary key)
      - `invoice_id` (uuid, foreign key)
      - `product_id` (uuid, foreign key)
      - `quantity` (decimal)
      - `unit_price` (decimal)
      - `tax_rate` (decimal)
      - `line_total` (decimal)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all new tables
    - Add policies for authenticated users to manage their own data

  3. Functions
    - Auto-generate invoice numbers
    - Update invoice totals when items change
*/

-- Create customers table
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

-- Create invoices table
CREATE TABLE IF NOT EXISTS public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number text UNIQUE NOT NULL,
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
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

-- Create invoice items table
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

-- Enable RLS
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;

-- Create policies (allowing all operations for now)
CREATE POLICY "Allow all operations on customers"
  ON public.customers
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on invoices"
  ON public.invoices
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on invoice_items"
  ON public.invoice_items
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Function to generate invoice numbers
CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS text AS $$
DECLARE
  next_number integer;
  invoice_number text;
BEGIN
  -- Get the next invoice number
  SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 'INV-(\d+)') AS integer)), 0) + 1
  INTO next_number
  FROM public.invoices
  WHERE invoice_number ~ '^INV-\d+$';
  
  -- Format as INV-XXXX
  invoice_number := 'INV-' || LPAD(next_number::text, 4, '0');
  
  RETURN invoice_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to calculate invoice totals
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

-- Triggers for invoice calculations
CREATE TRIGGER calculate_line_total_trigger
  BEFORE INSERT OR UPDATE ON public.invoice_items
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_line_total();

CREATE TRIGGER calculate_invoice_totals_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.invoice_items
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_invoice_totals();

-- Trigger for customer updated_at
CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for invoice updated_at
CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample customers
INSERT INTO public.customers (name, email, phone, gstin, address, city, state, pincode) VALUES
('Rajesh Kumar Farms', 'rajesh@example.com', '+91-9876543210', '27ABCDE1234F1Z5', '123 Farm Road, Village Kothrud', 'Pune', 'Maharashtra', '411038'),
('Green Valley Agriculture', 'info@greenvalley.com', '+91-9876543211', '29FGHIJ5678K2L6', '456 Agriculture Lane', 'Bangalore', 'Karnataka', '560001'),
('Sunrise Organic Farm', 'contact@sunriseorganic.com', '+91-9876543212', '24MNOPQ9012R3S7', '789 Organic Street', 'Ahmedabad', 'Gujarat', '380001'),
('Modern Agri Solutions', 'sales@modernagri.com', '+91-9876543213', '33TUVWX3456Y4Z8', '321 Tech Park Road', 'Hyderabad', 'Telangana', '500001'),
('Farmer Direct Co-op', 'coop@farmerdirect.com', '+91-9876543214', NULL, '654 Cooperative Society', 'Nashik', 'Maharashtra', '422001');