-- Debug script to check if triggers and functions exist
-- Run this in Supabase SQL Editor to debug the calculation issue

-- 1. Check if the calculation functions exist
SELECT 
    proname as function_name,
    proargnames as argument_names,
    prosrc as function_body
FROM pg_proc 
WHERE proname IN ('calculate_invoice_totals', 'calculate_line_total', 'generate_invoice_number')
ORDER BY proname;

-- 2. Check if the triggers exist
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name IN ('calculate_line_total_trigger', 'calculate_invoice_totals_trigger')
ORDER BY trigger_name;

-- 3. Check existing invoices and their items
SELECT 
    i.invoice_number,
    i.subtotal,
    i.tax_amount,
    i.total_amount,
    COUNT(ii.id) as item_count,
    SUM(ii.quantity * ii.unit_price) as calculated_subtotal,
    SUM(ii.quantity * ii.unit_price * ii.tax_rate / 100) as calculated_tax,
    SUM(ii.quantity * ii.unit_price * (1 + ii.tax_rate / 100)) as calculated_total
FROM invoices i
LEFT JOIN invoice_items ii ON i.id = ii.invoice_id
GROUP BY i.id, i.invoice_number, i.subtotal, i.tax_amount, i.total_amount
ORDER BY i.created_at DESC
LIMIT 5;

-- 4. Check individual invoice items and their line totals
SELECT 
    ii.id,
    ii.invoice_id,
    ii.quantity,
    ii.unit_price,
    ii.tax_rate,
    ii.line_total,
    (ii.quantity * ii.unit_price * (1 + ii.tax_rate / 100)) as expected_line_total
FROM invoice_items ii
ORDER BY ii.created_at DESC
LIMIT 10;