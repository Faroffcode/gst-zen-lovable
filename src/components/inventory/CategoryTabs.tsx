import { Button } from "@/components/ui/button";
import { Sprout, Leaf, TreePine, Bug, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Product } from "@/hooks/useProducts";
import { useCategories } from "@/hooks/useCategories";

interface CategoryTabsProps {
  products: Product[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

export const CategoryTabs = ({ products, selectedCategory, onCategoryChange }: CategoryTabsProps) => {
  const { data: categories = [], isLoading } = useCategories();

  const getCategoryIcon = (category: string) => {
    const iconProps = { className: "h-4 w-4" };
    switch (category) {
      case "Fertilizers":
        return <Sprout {...iconProps} />;
      case "Micronutrients":
        return <Leaf {...iconProps} />;
      case "Bio-fertilizers":
        return <TreePine {...iconProps} />;
      case "Pesticides":
        return <Bug {...iconProps} />;
      case "General":
        return <Package {...iconProps} />;
      default:
        return <Package {...iconProps} />;
    }
  };

  const getCategoryCount = (category: string) => {
    if (category === "All") return products.length;
    return products.filter(product => product.category === category).length;
  };

  const allCategories = [
    { name: "All", label: "All", color: "#6b7280" },
    ...categories.map(cat => ({ name: cat.name, label: cat.name, color: cat.color }))
  ];

  if (isLoading) {
    return (
      <div className="flex flex-wrap gap-2">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-10 w-24 bg-gray-200 rounded animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {allCategories.map((category) => {
        const count = getCategoryCount(category.name);
        const isSelected = selectedCategory === category.name;
        
        return (
          <Button
            key={category.name}
            variant={isSelected ? "default" : "outline"}
            onClick={() => onCategoryChange(category.name)}
            className="flex items-center gap-2"
          >
            {category.name !== "All" && (
              <div className="flex items-center gap-1">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: category.color }}
                />
                {getCategoryIcon(category.name)}
              </div>
            )}
            <span>{category.label}</span>
            <Badge variant={isSelected ? "secondary" : "outline"} className="ml-1">
              {count}
            </Badge>
          </Button>
        );
      })}
    </div>
  );
};