import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  Users,
  FileText,
  ShoppingCart,
  BarChart3,
  Settings,
  Building2
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  open: boolean;
}

const navigationItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Inventory", url: "/inventory", icon: Package },
  { title: "Purchase", url: "/purchase", icon: ShoppingCart },
  { title: "Customers", url: "/customers", icon: Users },
  { title: "Invoices", url: "/invoices", icon: FileText },
  { title: "Reports", url: "/reports", icon: BarChart3 },
  { title: "Settings", url: "/settings", icon: Settings },
];

export const Sidebar = ({ open }: SidebarProps) => {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => {}} 
        />
      )}
      
      <aside className={cn(
        "fixed left-0 top-16 h-[calc(100vh-4rem)] bg-card border-r transition-all duration-300 z-30",
        "md:translate-x-0",
        open ? "w-64 translate-x-0" : "w-16 -translate-x-full md:translate-x-0"
      )}>
      <div className="flex flex-col h-full">
        {/* Logo/Brand */}
        <div className="p-4 border-b">
          <NavLink 
            to="/" 
            className="flex items-center gap-3 hover:bg-accent/50 rounded-lg p-2 transition-colors duration-200"
          >
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            {open && (
              <div>
                <h1 className="font-bold text-lg hover:text-primary transition-colors">BIO TECH CENTRE</h1>
                <p className="text-xs text-muted-foreground hover:text-primary/70 transition-colors">Invoice & Inventory</p>
              </div>
            )}
          </NavLink>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {navigationItems.map((item) => {
              const isActive = currentPath === item.url;
              const Icon = item.icon;
              
              return (
                <li key={item.title}>
                  <NavLink
                    to={item.url}
                    className={cn(
                      "flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200",
                      "hover:bg-accent/50",
                      isActive 
                        ? "bg-gradient-primary text-white shadow-elegant" 
                        : "text-foreground"
                    )}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    {open && (
                      <span className="font-medium truncate">{item.title}</span>
                    )}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
      </aside>
    </>
  );
};