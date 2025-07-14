import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, ShoppingCart, Users, Fuel, Package, AlertTriangle, BarChart3 } from "lucide-react";
import { useState, useEffect } from "react";
import { getMyProducts, getProductByName } from "@/services/productService";
// import { getStorageTanks, getStorageTankById } from "@/services/storageTankService";
// import { gettotalCustomer } from "@/services/customerService";

export const Overview = () => {
  const [products, setProduct] = useState([]);
  const [storageTanks, setStorageTanks] = useState([]);
  const [totalCustomer, setTotalCustomer] = useState(0);

  useEffect(() => {
    fetchProduct();
    // fetchStorageTank();
    // fetchtotalCustomer();
  }, []);
  const fetchProduct= async () => {
      try {
        const data = await getMyProducts(); 
        setProduct(data);
      } catch (error) {
        console.error("Error fetching customers:", error);
      }
  };
  // const fetchtotalCustomer= async () => {
  //     try {
  //       const data = await gettotalCustomer(); 
  //       console.log(data.count);
  //       setTotalCustomer(data.count);
  //     } catch (error) {
  //       console.error("Error fetching customers:", error);
  //     }
  // };
  // const fetchStorageTank = async () => {
  //       try {
  //               const data = await getStorageTanks();
  //               console.log(data);
  //               setStorageTanks(data);
  //           } catch (error) {
  //               console.error("Error fetching stations:", error);
  //           }
  //       };
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
                <p className="text-sm font-medium text-gray-600">Sales Today</p>
                <p className="text-2xl font-bold text-gray-900">89</p>
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
                <p className="text-2xl font-bold text-gray-900">23</p>
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
                <p className="text-2xl font-bold text-gray-900">$12.4K</p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-500" />
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Sales chart will be displayed here</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Low Stock Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Stock alerts will be displayed here</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};