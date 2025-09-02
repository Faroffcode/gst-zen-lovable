-- Manual calculation fix for existing invoices with 0 totals
-- Run this AFTER applying the fix-invoice-calculations.sql script

-- 1. First manually calculate line totals for existing items
UPDATE invoice_items 
SET line_total = quantity * unit_price * (1 + tax_rate / 100)
WHERE line_total = 0 OR line_total IS NULL;

-- 2. Then manually recalculate invoice totals
UPDATE invoices 
SET 
    subtotal = (
        SELECT COALESCE(SUM(quantity * unit_price), 0)
        FROM invoice_items 
        WHERE invoice_id = invoices.id
    ),
    tax_amount = (
        SELECT COALESCE(SUM(quantity * unit_price * tax_rate / 100), 0)
        FROM invoice_items 
        WHERE invoice_id = invoices.id
    ),
    total_amount = (
        SELECT COALESCE(SUM(quantity * unit_price * (1 + tax_rate / 100)), 0)
        FROM invoice_items 
        WHERE invoice_id = invoices.id
    ),
    updated_at = now()
WHERE (subtotal = 0 OR tax_amount = 0 OR total_amount = 0)
AND EXISTS (
    SELECT 1 FROM invoice_items 
    WHERE invoice_id = invoices.id
);

-- 3. Show results after update
SELECT 
    invoice_number,
    subtotal,
    tax_amount,
    total_amount,
    (SELECT COUNT(*) FROM invoice_items WHERE invoice_id = invoices.id) as item_count
FROM invoices 
WHERE EXISTS (SELECT 1 FROM invoice_items WHERE invoice_id = invoices.id)
ORDER BY created_at DESC;