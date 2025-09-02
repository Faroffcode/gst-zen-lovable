import { Button } from "@/components/ui/button";
import { Sprout, Leaf, TreePine, Bug, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Product } from "@/hooks/useProducts";

interface CategoryTabsProps {
  products: Product[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

export const CategoryTabs = ({ products, selectedCategory, onCategoryChange }: CategoryTabsProps) => {
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

  const categories = [
    { name: "All", label: "All" },
    { name: "Fertilizers", label: "Fertilizers" },
    { name: "Micronutrients", label: "Micronutrients" },
    { name: "Bio-fertilizers", label: "Bio-fertilizers" },
    { name: "Pesticides", label: "Pesticides" },
    { name: "General", label: "General" },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {categories.map((category) => {
        const count = getCategoryCount(category.name);
        const isSelected = selectedCategory === category.name;
        
        return (
          <Button
            key={category.name}
            variant={isSelected ? "default" : "outline"}
            onClick={() => onCategoryChange(category.name)}
            className="flex items-center gap-2"
          >
            {category.name !== "All" && getCategoryIcon(category.name)}
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