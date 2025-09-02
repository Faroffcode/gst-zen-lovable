-- Fix missing generate_invoice_number function
-- Run this in your Supabase SQL Editor to fix the invoice generation error

-- Function to generate invoice numbers
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

-- Test the function (optional)
-- SELECT public.generate_invoice_number();