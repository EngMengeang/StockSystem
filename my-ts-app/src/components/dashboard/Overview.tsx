import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, ShoppingCart, Users, Fuel, Package, AlertTriangle, BarChart3 } from "lucide-react";
import { LineChart } from '@mui/x-charts/LineChart';
import { useState, useEffect } from "react";
import { getMyProducts, getProductByName } from "@/services/productService";
import { getsales } from "@/services/salesService";
// import { getStorageTanks, getStorageTankById } from "@/services/storageTankService";
// import { gettotalCustomer } from "@/services/customerService";

export const Overview = () => {
  const [products, setProduct] = useState([]);
  const [sales, setSales] = useState([]);

  const [categories, setCategories] = useState([]);
  const [prices, setPrices] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);

  useEffect(() => {
    fetchProduct();
    fetchsales();
  }, []);
  const fetchProduct= async () => {
      try {
        const data = await getMyProducts(); 
        setProduct(data);
        const names = data.map((item) => item.p_name);
        const productPrices = data.map((item) => item.p_price);
        const lowStock = data.filter((item) => item.Stock.s_quantity <= 10);
        
        setLowStockItems(lowStock);
        setCategories(names);
        setPrices(productPrices);
        console.log(lowStock);
      } catch (error) {
        console.error("Error fetching customers:", error);
      }
  };
  const fetchsales= async () => {
      try {
        const data = await getsales();
        setSales(data);
      } catch (error) {
        console.error("Error fetching customers:", error);
      }
  };
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Dashboard Overview</h2>
        <p className="text-muted-foreground">
          Key performance indicators for your gas station operations
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Products
                </p>
                <p className="text-2xl font-bold text-gray-900">{products.length}</p>
              </div>
              <Package className="h-8 w-8 text-blue-500" />
            </div>
          </div>
          
        </Card>

        <Card>
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Sales Count</p>
                <p className="text-2xl font-bold text-gray-900">{sales.length}</p>
              </div>
              <ShoppingCart className="h-8 w-8 text-green-500" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Expiring Soon
                </p>
                <p className="text-2xl font-bold text-gray-900">!</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-500" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Revenue</p>
                <p className="text-2xl font-bold text-gray-900">$</p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-500" />
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="pr-6">
          <CardHeader>
            <CardTitle>Sales Price</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Sales chart will be displayed here</p>
          </CardContent>
          <LineChart
            xAxis={[
              {
                id: 'products',
                data: categories,
                scaleType: 'point',
              },
            ]}
            series={[
              {
                data: prices,
                label: 'Price ($)',
                color: '#007bff',
              },
            ]}
            height={300}
          />
        </Card>

        <Card>
          <CardHeader className="flex-row gap-5 items-center">
            <AlertTriangle className="h-8 w-8 text-orange-500" />
            <CardTitle>Low Stock Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            {lowStockItems.length === 0 ? (
              <p className="text-gray-600">Stock alerts will be displayed here</p>
            ) : (
              <ul className="space-y-2">
                {lowStockItems.map((item) => (
                  <li
                    key={item.p_id}
                    className="bg-red-100 border border-red-300 text-red-800 px-4 py-2 rounded-lg"
                  >
                    <strong>{item.p_name}</strong> has only{" "}
                    <span className="font-semibold">{item.Stock.s_quantity}</span>{" "}
                    left in stock!
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
};