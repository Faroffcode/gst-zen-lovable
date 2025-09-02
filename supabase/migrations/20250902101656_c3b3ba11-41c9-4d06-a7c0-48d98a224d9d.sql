-- Create products table for inventory management
CREATE TABLE public.products (
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

-- Enable Row Level Security
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Create policies for products (since this is for personal use, allow all operations)
CREATE POLICY "Allow all operations on products" 
ON public.products 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Create stock ledger table for tracking stock movements
CREATE TABLE public.stock_ledger (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('purchase', 'sale', 'adjustment', 'return')),
  quantity_delta INTEGER NOT NULL,
  unit_cost DECIMAL(10,2),
  reference_no TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for stock ledger
ALTER TABLE public.stock_ledger ENABLE ROW LEVEL SECURITY;

-- Create policy for stock ledger
CREATE POLICY "Allow all operations on stock_ledger" 
ON public.stock_ledger 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Create function to update stock levels
CREATE OR REPLACE FUNCTION public.update_product_stock()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.products 
  SET current_stock = current_stock + NEW.quantity_delta,
      updated_at = now()
  WHERE id = NEW.product_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update stock levels
CREATE TRIGGER update_stock_trigger
  AFTER INSERT ON public.stock_ledger
  FOR EACH ROW
  EXECUTE FUNCTION public.update_product_stock();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates on products
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample data for agricultural products
INSERT INTO public.products (sku, name, category, hsn_code, unit, unit_price, tax_rate, current_stock, min_stock) VALUES
('NPK001', 'NPK 19:19:19 Fertilizer', 'Fertilizers', '31051000', 'kg', 25.50, 5.00, 100, 20),
('UREA001', 'Urea 46% N', 'Fertilizers', '31021000', 'kg', 18.75, 5.00, 200, 50),
('ZN001', 'Zinc Sulphate', 'Micronutrients', '28332600', 'kg', 85.00, 18.00, 25, 10),
('IRON001', 'Iron Chelate', 'Micronutrients', '28420000', 'kg', 120.00, 18.00, 15, 5),
('BIO001', 'Azotobacter Bio-fertilizer', 'Bio-fertilizers', '31010000', 'kg', 45.00, 5.00, 30, 10),
('PEST001', 'Chlorpyrifos 20% EC', 'Pesticides', '38089100', 'ltr', 380.00, 18.00, 12, 5),
('SEED001', 'Hybrid Tomato Seeds', 'General', '12099100', 'pkt', 150.00, 5.00, 50, 10);