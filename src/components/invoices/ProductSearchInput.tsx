import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

interface Product {
  id: string;
  name: string;
  sku: string;
  unit_price: number;
  tax_rate: number;
  unit: string;
}

interface ProductSearchInputProps {
  products: Product[];
  value: {
    product_id: string;
    custom_product_name: string;
  };
  onChange: (productId: string, customName: string, autoFillData?: { unit_price: number; tax_rate: number }) => void;
  placeholder?: string;
  required?: boolean;
}

export const ProductSearchInput = ({ 
  products, 
  value, 
  onChange, 
  placeholder = "Type product name or select from suggestions",
  required = false 
}: ProductSearchInputProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [displayValue, setDisplayValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Initialize display value
  useEffect(() => {
    if (value.product_id) {
      const product = products.find(p => p.id === value.product_id);
      setDisplayValue(product?.name || "");
      setSearchTerm(product?.name || "");
    } else if (value.custom_product_name) {
      setDisplayValue(value.custom_product_name);
      setSearchTerm(value.custom_product_name);
    }
  }, [value.product_id, value.custom_product_name, products]);

  // Filter products based on search term
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    setDisplayValue(newValue);
    setIsOpen(true);
    
    // If it's a custom product name, update immediately
    onChange("", newValue);
  };

  const handleProductSelect = (product: Product) => {
    setDisplayValue(product.name);
    setSearchTerm(product.name);
    setIsOpen(false);
    onChange(product.id, "", {
      unit_price: product.unit_price,
      tax_rate: product.tax_rate
    });
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  const handleInputBlur = () => {
    // Delay closing to allow clicking on dropdown items
    setTimeout(() => {
      setIsOpen(false);
    }, 150);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="relative">
      <Label>Product {required && "*"}</Label>
      <div className="relative">
        <Input
          ref={inputRef}
          value={displayValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          placeholder={placeholder}
          required={required}
          className="w-full"
        />
        
        {isOpen && (searchTerm.length > 0 || filteredProducts.length > 0) && (
          <div
            ref={dropdownRef}
            className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto"
          >
            {filteredProducts.length > 0 && (
              <div className="px-2 py-1 text-xs text-gray-500 border-b">
                Select from existing products:
              </div>
            )}
            
            {filteredProducts.map((product) => (
              <button
                key={product.id}
                type="button"
                className="w-full px-3 py-2 text-left hover:bg-blue-50 border-b border-gray-100 last:border-b-0 focus:bg-blue-50 focus:outline-none"
                onClick={() => handleProductSelect(product)}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium text-sm">{product.name}</div>
                    <div className="text-xs text-gray-500">
                      SKU: {product.sku} • ₹{product.unit_price} • {product.tax_rate}% tax
                    </div>
                  </div>
                  {value.product_id === product.id && (
                    <Check className="h-4 w-4 text-blue-600" />
                  )}
                </div>
              </button>
            ))}
            
            {searchTerm.length > 0 && !filteredProducts.some(p => p.name.toLowerCase() === searchTerm.toLowerCase()) && (
              <>
                {filteredProducts.length > 0 && (
                  <div className="px-2 py-1 text-xs text-gray-500 border-b border-t">
                    Or use custom product:
                  </div>
                )}
                <div className="px-3 py-2 bg-amber-50 border-b">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-sm text-amber-800">
                        Use custom product: "{searchTerm}"
                      </div>
                      <div className="text-xs text-amber-600">
                        You'll need to set price and tax rate manually
                      </div>
                    </div>
                    {!value.product_id && value.custom_product_name === searchTerm && (
                      <Check className="h-4 w-4 text-amber-600" />
                    )}
                  </div>
                </div>
              </>
            )}
            
            {filteredProducts.length === 0 && searchTerm.length === 0 && (
              <div className="px-3 py-2 text-sm text-gray-500">
                Start typing to search for products or create a custom product
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};