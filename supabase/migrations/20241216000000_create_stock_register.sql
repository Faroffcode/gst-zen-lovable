-- Create stock register table with exact format specified
CREATE TABLE public.stock_register (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  invoice TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('purchase', 'sale')),
  opening_stock INTEGER NOT NULL DEFAULT 0,
  quantity INTEGER NOT NULL,
  closing_stock INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.stock_register ENABLE ROW LEVEL SECURITY;

-- Create policy for stock register (allow all operations for personal use)
CREATE POLICY "Allow all operations on stock_register" 
ON public.stock_register 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX idx_stock_register_product_date ON public.stock_register(product_id, date DESC, created_at DESC);

-- Create function to get last closing stock for a product
CREATE OR REPLACE FUNCTION get_last_closing_stock(p_product_id UUID)
RETURNS INTEGER AS $$
DECLARE
  last_closing_stock INTEGER;
BEGIN
  SELECT closing_stock INTO last_closing_stock
  FROM public.stock_register 
  WHERE product_id = p_product_id
  ORDER BY date DESC, created_at DESC
  LIMIT 1;
  
  -- If no previous record found, return current stock from products table
  IF last_closing_stock IS NULL THEN
    SELECT current_stock INTO last_closing_stock
    FROM public.products
    WHERE id = p_product_id;
  END IF;
  
  RETURN COALESCE(last_closing_stock, 0);
END;
$$ LANGUAGE plpgsql;

-- Create function to insert stock register entry with automatic calculations
CREATE OR REPLACE FUNCTION insert_stock_register_entry(
  p_product_id UUID,
  p_date DATE,
  p_invoice TEXT,
  p_type TEXT,
  p_quantity INTEGER
)
RETURNS UUID AS $$
DECLARE
  v_opening_stock INTEGER;
  v_closing_stock INTEGER;
  v_entry_id UUID;
  v_update_result INTEGER;
BEGIN
  -- Get last closing stock as opening stock for this entry
  v_opening_stock := get_last_closing_stock(p_product_id);
  
  -- Calculate closing stock based on transaction type
  IF p_type = 'purchase' THEN
    v_closing_stock := v_opening_stock + p_quantity;
  ELSIF p_type = 'sale' THEN
    v_closing_stock := v_opening_stock - p_quantity;
  ELSE
    RAISE EXCEPTION 'Invalid transaction type: %. Must be purchase or sale.', p_type;
  END IF;
  
  -- Validate that closing stock doesn't go negative
  IF v_closing_stock < 0 THEN
    RAISE EXCEPTION 'Insufficient stock. Available: %, Required: %', v_opening_stock, p_quantity;
  END IF;
  
  -- Insert the new entry
  INSERT INTO public.stock_register (
    product_id,
    date,
    invoice,
    type,
    opening_stock,
    quantity,
    closing_stock
  ) VALUES (
    p_product_id,
    p_date,
    p_invoice,
    p_type,
    v_opening_stock,
    p_quantity,
    v_closing_stock
  ) RETURNING id INTO v_entry_id;
  
  -- Update product's current stock to match closing stock
  UPDATE public.products 
  SET current_stock = v_closing_stock,
      updated_at = CURRENT_TIMESTAMP
  WHERE id = p_product_id;
  
  -- Check if the update was successful
  GET DIAGNOSTICS v_update_result = ROW_COUNT;
  IF v_update_result = 0 THEN
    RAISE EXCEPTION 'Failed to update product stock for product_id: %', p_product_id;
  END IF;
  
  -- Log the update for debugging
  RAISE NOTICE 'Updated product % stock from % to %', p_product_id, v_opening_stock, v_closing_stock;
  
  RETURN v_entry_id;
END;
$$ LANGUAGE plpgsql;
