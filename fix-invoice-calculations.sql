-- Fix for Invoice Total Calculation Issue
-- Run this in your Supabase SQL Editor to add missing calculation functions

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

-- Test the functions by updating existing invoices with 0 totals
UPDATE public.invoices 
SET updated_at = now() 
WHERE (subtotal = 0 OR tax_amount = 0 OR total_amount = 0) 
AND EXISTS (
  SELECT 1 FROM public.invoice_items 
  WHERE invoice_id = invoices.id
);