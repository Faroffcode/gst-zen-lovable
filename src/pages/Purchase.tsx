import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Plus, Package, TrendingUp } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useStockTransactions } from "@/hooks/useStockLedger";
import { Skeleton } from "@/components/ui/skeleton";
import { PurchaseForm } from "@/components/purchase/PurchaseForm";
import { PurchaseHistory } from "@/components/purchase/PurchaseHistory";

const Purchase = () => {
  const [activeTab, setActiveTab] = useState("purchase-items");
  const [showPurchaseForm, setShowPurchaseForm] = useState(false);
  
  const { data: stockTransactions, isLoading } = useStockTransactions();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Purchase Management</h1>
          <p className="text-muted-foreground mt-1">
            Record purchases and manage inventory stock levels efficiently.
          </p>
        </div>
        <Button onClick={() => setShowPurchaseForm(true)} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Record Purchase
        </Button>
      </div>


      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="purchase-items" className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            Purchase Items
          </TabsTrigger>
          <TabsTrigger value="purchase-history" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Purchase History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="purchase-items" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Record New Purchase
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PurchaseForm 
                onSuccess={() => setShowPurchaseForm(false)}
                onCancel={() => setShowPurchaseForm(false)}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="purchase-history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Purchase History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PurchaseHistory transactions={stockTransactions?.filter(
                transaction => transaction.transaction_type === "purchase"
              ) || []} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Purchase;