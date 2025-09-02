-- COMPLETE INVOICE CALCULATION FIX
-- Copy and paste this ENTIRE script into your Supabase SQL Editor and run it
-- This will fix all invoice calculation issues in one go

-- ===================================================================
-- STEP 1: Drop existing triggers and functions if they exist
-- ===================================================================
DROP TRIGGER IF EXISTS calculate_line_total_trigger ON public.invoice_items;
DROP TRIGGER IF EXISTS calculate_invoice_totals_trigger ON public.invoice_items;
DROP FUNCTION IF EXISTS public.calculate_invoice_totals();
DROP FUNCTION IF EXISTS public.calculate_line_total();

-- ===================================================================
-- STEP 2: Create the line total calculation function
-- ===================================================================
CREATE OR REPLACE FUNCTION public.calculate_line_total()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate line total: quantity × unit_price × (1 + tax_rate/100)
  NEW.line_total := NEW.quantity * NEW.unit_price * (1 + NEW.tax_rate / 100);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ===================================================================
-- STEP 3: Create the invoice totals calculation function
-- ===================================================================
CREATE OR REPLACE FUNCTION public.calculate_invoice_totals()
RETURNS TRIGGER AS $$
DECLARE
  invoice_subtotal decimal(12,2);
  invoice_tax_amount decimal(12,2);
  invoice_total decimal(12,2);
BEGIN
  -- Calculate totals for the affected invoice
  SELECT 
    COALESCE(SUM(quantity * unit_price), 0),
    COALESCE(SUM(quantity * unit_price * tax_rate / 100), 0),
    COALESCE(SUM(quantity * unit_price * (1 + tax_rate / 100)), 0)
  INTO invoice_subtotal, invoice_tax_amount, invoice_total
  FROM public.invoice_items
  WHERE invoice_id = COALESCE(NEW.invoice_id, OLD.invoice_id);
  
  -- Update the invoice with calculated totals
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

-- ===================================================================
-- STEP 4: Create triggers for automatic calculation
-- ===================================================================

-- Trigger to calculate line total before insert/update
CREATE TRIGGER calculate_line_total_trigger
  BEFORE INSERT OR UPDATE ON public.invoice_items
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_line_total();

-- Trigger to recalculate invoice totals after insert/update/delete
CREATE TRIGGER calculate_invoice_totals_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.invoice_items
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_invoice_totals();

-- ===================================================================
-- STEP 5: Fix all existing invoice items with incorrect line totals
-- ===================================================================
UPDATE public.invoice_items 
SET line_total = quantity * unit_price * (1 + tax_rate / 100)
WHERE line_total = 0 OR line_total IS NULL OR line_total != (quantity * unit_price * (1 + tax_rate / 100));

-- ===================================================================
-- STEP 6: Fix all existing invoices with incorrect totals
-- ===================================================================
UPDATE public.invoices 
SET 
    subtotal = COALESCE((
        SELECT SUM(quantity * unit_price)
        FROM public.invoice_items 
        WHERE invoice_id = invoices.id
    ), 0),
    tax_amount = COALESCE((
        SELECT SUM(quantity * unit_price * tax_rate / 100)
        FROM public.invoice_items 
        WHERE invoice_id = invoices.id
    ), 0),
    total_amount = COALESCE((
        SELECT SUM(quantity * unit_price * (1 + tax_rate / 100))
        FROM public.invoice_items 
        WHERE invoice_id = invoices.id
    ), 0),
    updated_at = now()
WHERE EXISTS (
    SELECT 1 FROM public.invoice_items 
    WHERE invoice_id = invoices.id
);

-- ===================================================================
-- STEP 7: Verification - Show results
-- ===================================================================
SELECT 
    'VERIFICATION RESULTS' as status,
    COUNT(*) as total_invoices,
    SUM(CASE WHEN total_amount > 0 THEN 1 ELSE 0 END) as invoices_with_totals,
    SUM(CASE WHEN total_amount = 0 THEN 1 ELSE 0 END) as invoices_with_zero_totals
FROM public.invoices 
WHERE EXISTS (SELECT 1 FROM public.invoice_items WHERE invoice_id = invoices.id);

-- Show detailed invoice information
SELECT 
    i.invoice_number,
    i.subtotal,
    i.tax_amount,
    i.total_amount,
    COUNT(ii.id) as item_count,
    i.created_at
FROM public.invoices i
LEFT JOIN public.invoice_items ii ON i.id = ii.invoice_id
GROUP BY i.id, i.invoice_number, i.subtotal, i.tax_amount, i.total_amount, i.created_at
ORDER BY i.created_at DESC
LIMIT 10;

-- ===================================================================
-- COMPLETION MESSAGE
-- ===================================================================
SELECT 'INVOICE CALCULATION FIX COMPLETED SUCCESSFULLY!' as message,
       'All existing invoices have been recalculated' as status,
       'New invoices will calculate automatically' as future_behavior;