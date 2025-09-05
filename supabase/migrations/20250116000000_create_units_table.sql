-- Create units table for product units management
CREATE TABLE public.units (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  abbreviation TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;

-- Create policy for units (allow all operations for personal use)
CREATE POLICY "Allow all operations on units" 
ON public.units 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Create trigger for automatic timestamp updates on units
CREATE TRIGGER update_units_updated_at
  BEFORE UPDATE ON public.units
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default units
INSERT INTO public.units (name, abbreviation, description) VALUES
('Kilogram', 'kg', 'Standard unit of mass measurement'),
('Gram', 'g', 'Smaller unit of mass measurement'),
('Liter', 'L', 'Standard unit of liquid volume measurement'),
('Milliliter', 'ml', 'Smaller unit of liquid volume measurement'),
('Bag', 'Bag', 'Standard packaging unit for bulk materials'),
('Piece', 'Pcs', 'Individual count unit'),
('Packet', 'Pkt', 'Small packaging unit'),
('Bottle', 'Btl', 'Container unit for liquids'),
('Box', 'Box', 'Packaging unit for multiple items'),
('Ton', 'T', 'Large unit of mass measurement');
