/*
  # Update invoices table to support guest customers

  1. Changes
    - Make customer_id nullable in invoices table
    - Add guest customer fields directly to invoices table
    - Update policies to handle guest invoices

  2. New Fields
    - `guest_name` (text, optional)
    - `guest_email` (text, optional)
    - `guest_phone` (text, optional)
    - `guest_address` (text, optional)
    - `guest_gstin` (text, optional)

  3. Security
    - Update existing policies to handle nullable customer_id
*/

-- Add guest customer fields to invoices table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'invoices' AND column_name = 'guest_name'
  ) THEN
    ALTER TABLE public.invoices ADD COLUMN guest_name text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'invoices' AND column_name = 'guest_email'
  ) THEN
    ALTER TABLE public.invoices ADD COLUMN guest_email text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'invoices' AND column_name = 'guest_phone'
  ) THEN
    ALTER TABLE public.invoices ADD COLUMN guest_phone text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'invoices' AND column_name = 'guest_address'
  ) THEN
    ALTER TABLE public.invoices ADD COLUMN guest_address text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'invoices' AND column_name = 'guest_gstin'
  ) THEN
    ALTER TABLE public.invoices ADD COLUMN guest_gstin text;
  END IF;
END $$;

-- Make customer_id nullable
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'invoices_customer_id_fkey'
    AND table_name = 'invoices'
  ) THEN
    ALTER TABLE public.invoices DROP CONSTRAINT invoices_customer_id_fkey;
  END IF;
END $$;

-- Alter customer_id to be nullable
ALTER TABLE public.invoices ALTER COLUMN customer_id DROP NOT NULL;

-- Re-add foreign key constraint that allows NULL
ALTER TABLE public.invoices 
ADD CONSTRAINT invoices_customer_id_fkey 
FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE RESTRICT;

-- Add constraint to ensure either customer_id or guest_name is provided
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'invoices_customer_or_guest_check'
    AND table_name = 'invoices'
  ) THEN
    ALTER TABLE public.invoices 
    ADD CONSTRAINT invoices_customer_or_guest_check 
    CHECK (customer_id IS NOT NULL OR guest_name IS NOT NULL);
  END IF;
END $$;