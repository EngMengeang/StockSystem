import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart } from '@mui/x-charts/BarChart';
import {Plus  } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useEffect } from "react";
// table
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button";
// api
import {getMyInventory, getexpired, postexpire} from "@/services/inventoryService";

export const InventoryManagement = () => {
  const [inventory, setInventoty] = useState([]);
  // bar chart
  const [categories, setCategories] = useState([]);
  const [quantities, setQuantities] = useState([]);
  const [quantitySoldData, setquantitySoldData] = useState([]);
  const [exp, setexp] = useState([]);
  const [load, setload] = useState(true);

  useEffect(() => {
      fetchInventory();
  }, []);
  
  useEffect(() => {
      fetchInventory();
      setload(true);
  }, [load]);
    const fetchInventory= async () => {
        try {
          const data = await getMyInventory();
          setInventoty(data);
          const names = data.map((item) => item.p_name);
          const quantities = data.map((item) => item.total_import);
          
          setquantitySoldData(data.map(item => parseInt(item.quantity_sold, 10)))
          setexp(data.map(item => parseInt(item.quantity_expired, 10)))
          setCategories(names);
          setQuantities(quantities);
        } catch (error) {
          console.error("Error fetching customers:", error);
        }
    };

    const expired = async (data) => {
      if (window.confirm("Are it was expired?")) {
        await postexpire(data);
        setload((prev) => !prev); // Toggle load state to trigger useEffect
      }
    };

    

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Inventory Management</h2>
        <p className="text-muted-foreground">
          Inventory Fprls
        </p>
      </div>


      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="Bar chart">Stock Levels</TabsTrigger>
        </TabsList>
        <TabsContent value="performance" className="space-y-4" >
          <div>
        <h2 className="text-2xl font-bold tracking-tight">Stock Analysis</h2>
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
                            label: 'Total Import',
                            color: '#4CAF50', // Green color for total import
                        },
                        {
                            data: quantitySoldData,
                            label: 'Quantity Sold',
                            color: '#2196F3', // Blue color for quantity sold
                        },
                        {
                            data: exp,
                            label: 'Exp',
                            color: '#f35221ff', // Blue color for quantity sold
                        },
                    ]}
                    // layout="horizontal"
                    height={Math.max(500, categories.length * 40)} // Adjust height dynamically based on number of products
                    // margin={{ left: 100, right: 20, top: 30, bottom: 30 }} // Adjust margins for better label visibility
                    slotProps={{
                        legend: {
                            position: { vertical: 'top', horizontal: 'middle' },
                            padding: { top: 10, bottom: 10 },
                        },
                    }}
                    // Add grid lines for better readability
                    grid={{ vertical: true, horizontal: true }}
              />
        </TabsContent>
        <TabsContent value="Bar chart" className="space-y-4" >
          <Card>
          <CardContent className="overflow-y-auto max-h-110">
              <Table>
                <TableHeader>
                    <TableRow>
                      <TableHead className="text-indigo-700" >Product Name</TableHead>
                      <TableHead className="text-indigo-700">Total import</TableHead>
                      <TableHead className="text-indigo-700">Quantity sold</TableHead>
                      <TableHead className="text-indigo-700">Expired</TableHead>
                      <TableHead className="text-right text-indigo-700">Add Exp</TableHead>
                    </TableRow>
                  </TableHeader>
                <TableBody className="">
                  { inventory.length > 0 ? inventory.map((product) => (
                  <TableRow key={product.p_id}>
                    <TableCell className="font-medium">{product.p_name}</TableCell>
                    <TableCell>{product.total_import} unit</TableCell>
                    <TableCell>{product.quantity_sold} unit</TableCell>
                    <TableCell>{product.quantity_expired} unit</TableCell>
                    <TableCell>
                      <div className="space-x-2 text-right">
                        <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => expired({ p_name: product.p_name })}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                      </div>
                    </TableCell>
                  </TableRow>)
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center">
                        No products found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>    
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};