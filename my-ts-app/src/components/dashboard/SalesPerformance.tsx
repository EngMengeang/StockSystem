import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useEffect } from "react";
import { BarChart } from '@mui/x-charts/BarChart';
import { AlertTriangle, Package, Fuel, Edit, Settings  } from "lucide-react";
// select
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
// table
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button";
// api
import { getsales } from "@/services/salesService";
import { getMyProducts, getProductByName, postProduct, deleteProduct, updateProduct } from '@/services/productService'


export const SalesPerformance = () => {
  const [sales, setSales] = useState([]);
    // bar chart
  const [categories, setCategories] = useState([]);
  const [quantities, setQuantities] = useState([]);
  const [highestSaleProduct, setHighestSaleProduct] = useState(null);
  const [loadingSales, setLoadingSales] = useState(true);

  useEffect(() => {
    fetchProduct();
  }, []);

  useEffect(() => {
    // Call Higthsales whenever 'sales' data changes
    if (sales.length > 0) {
      setHighestSaleProduct(getHighestSalesProduct);
    }
  }, [sales]);

  const fetchProduct= async () => {
        try {
          const data = await getsales();
          setSales(data);
          const names = data.map((item) => item.p_name);
          const quantities = data.map((item) => item.quantity);
  
          setCategories(names);
          setQuantities(quantities);
        } catch (error) {
          console.error("Error fetching customers:", error);
        } finally {
          setLoadingSales(false);
        }
    };

    const getHighestSalesProduct = () => { // Renamed from Higthsales for clarity and consistency
      if (sales.length === 0) {
        return null;
      }

      // Use reduce to find the item with the maximum quantity
      const highest = sales.reduce((prev, current) => {
          return (prev.quantity > current.quantity) ? prev : current;
      });

      console.log(highest)

      return highest;
    };
  
  return (
    <div className="space-y-6">
      {/* Higth Sales */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Sales Performance</h2>
        <p className="text-muted-foreground"></p>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 m-4">
          <Card>
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Higth Sales
                  </p>
                  {highestSaleProduct && (
                    <p className="text-2xl font-bold text-gray-900">
                      {highestSaleProduct.p_name} (
                      {highestSaleProduct.quantity})
                    </p>
                  )}
                </div>
                <Package className="h-8 w-8 text-blue-500" />
              </div>
            </div>
        </Card>
        </div>
        <Tabs defaultValue="performance" className="space-y-4">
            <TabsList>
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="Bar chart">Stock Levels</TabsTrigger>
            </TabsList>
            <TabsContent value="performance" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Sales
                </p>
              </div>
            </div>
          <BarChart
            xAxis={[
              {
                id: 'products',
                data: categories,
                scaleType: 'band',
              },
            ]}  
            series={[
              {
                data: quantities,
                label: 'Stock Quantity',
                color: '#3ddc3dff'
              },
            ]}
            height={400} 
          />
        </TabsContent>
        
        <TabsContent value="Bar chart" className="space-y-4">
          {loadingSales ? (
            <p className="text-indigo-600">Loading sales data...</p>
          ) : sales.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white rounded-lg shadow-md">
                <thead className="">
                  <tr>
                    <th className="py-3 px-4 text-left text-sm font-medium text-indigo-700 uppercase tracking-wider rounded-tl-lg">
                      Product ID
                    </th>
                    <th className="py-3 px-4 text-left text-sm font-medium text-indigo-700 uppercase tracking-wider">
                      Product Name
                    </th>
                    <th className="py-3 px-4 text-left text-sm font-medium text-indigo-700 uppercase tracking-wider rounded-tr-lg">
                      Quantity Sold
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 overflow-y-auto max-h-110">
                  {sales.map((product) => (
                    <tr key={product.p_id} className="hover:bg-gray-50">
                      <td className="py-3 px-4 whitespace-nowrap text-base text-gray-700">
                        {product.p_id}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-base text-gray-700">
                        {product.p_name}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-base text-gray-700">
                        {product.quantity} units
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500">No sales data available.</p>
          )}
        </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};