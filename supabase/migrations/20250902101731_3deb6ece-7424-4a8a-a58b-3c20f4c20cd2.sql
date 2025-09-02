-- Fix function search path security issues
DROP FUNCTION IF EXISTS public.update_product_stock();
DROP FUNCTION IF EXISTS public.update_updated_at_column();

-- Recreate function to update stock levels with proper search path
CREATE OR REPLACE FUNCTION public.update_product_stock()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.products 
  SET current_stock = current_stock + NEW.quantity_delta,
      updated_at = now()
  WHERE id = NEW.product_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Recreate function to update timestamps with proper search path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;