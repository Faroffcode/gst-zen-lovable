-- Create categories table for product categorization
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  color TEXT DEFAULT '#3b82f6', -- Default blue color for category badges
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Create policy for categories (allow all operations for personal use)
CREATE POLICY "Allow all operations on categories" 
ON public.categories 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Create trigger for automatic timestamp updates on categories
CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default categories based on existing product categories
INSERT INTO public.categories (name, description, color) VALUES
('Fertilizers', 'Chemical and organic fertilizers for plant nutrition', '#10b981'),
('Micronutrients', 'Essential micronutrients for plant growth', '#f59e0b'),
('Bio-fertilizers', 'Biological fertilizers containing living microorganisms', '#8b5cf6'),
('Pesticides', 'Chemical and biological pest control products', '#ef4444'),
('Seeds', 'Plant seeds and planting materials', '#06b6d4'),
('General', 'General agricultural products and supplies', '#6b7280');

-- Update existing products to reference the new categories
-- This will be handled by the application layer to maintain data integrity
