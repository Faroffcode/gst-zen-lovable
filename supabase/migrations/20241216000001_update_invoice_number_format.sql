-- Update invoice number generation function to use BTC format
CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS text AS $$
DECLARE
  next_number integer;
  invoice_number text;
BEGIN
  -- Get the next invoice number from both INV- and BTC- formats
  SELECT COALESCE(MAX(
    CASE 
      WHEN invoice_number ~ '^INV-\d+$' THEN CAST(SUBSTRING(invoice_number FROM 'INV-(\d+)') AS integer)
      WHEN invoice_number ~ '^BTC\d+$' THEN CAST(SUBSTRING(invoice_number FROM 'BTC(\d+)') AS integer)
      ELSE 0
    END
  ), 0) + 1
  INTO next_number
  FROM public.invoices
  WHERE invoice_number ~ '^(INV-\d+|BTC\d+)$';
  
  -- Format as BTC001, BTC002, etc.
  invoice_number := 'BTC' || LPAD(next_number::text, 3, '0');
  
  RETURN invoice_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
