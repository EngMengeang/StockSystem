import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertTriangle, Package, Fuel, Edit, Settings, Trash2  } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useEffect } from "react";
// table
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button";
// api
import { getgasstation } from "@/services/stationService";
import { getinventory, deleteInventory } from "@/services/inventoryService";
import { getStorageTanks, getStorageTankById } from "@/services/storageTankService";

export const InventoryManagement = () => {
    const [stations, setStations] = useState([]);
    const [selectedStation, setSelectedStation] = useState();
    const [inventory, setInventory] = useState([]);
    const [loadAllData, setLoadAllData] = useState(false);
    const [storageTanks, setStorageTanks] = useState([]);
    const [lowStockItems, setLowStockItems] = useState(0);

    useEffect(() => {
        fetchStations();
        fetchStorageTank();
    }, []);

    useEffect(() => {
        fetchinventory();
        fetchStorageTank();
        console.log("Selected low:", lowStockItems);
    }, [selectedStation]);

    useEffect(() => {
        if (loadAllData) {
            fetchStations();
            fetchinventory();
            setLoadAllData(false);
        }
    }, [loadAllData]);

    const fetchStations = async () => {
    try {
            const data = await getgasstation();
            setStations(data);
        } catch (error) {
            console.error("Error fetching stations:", error);
        }
    };
    const fetchStorageTank = async () => {
        try {
          if (!selectedStation) {
                const data = await getStorageTanks();
                console.log(data);
                const lowStockItems = data.filter((item) => item.currentquantity <= (item.capacity / 3));
                setLowStockItems(lowStockItems.length);
                setStorageTanks(data);

          }
          else {
                const data = await getStorageTankById(selectedStation);
                console.log(data);
                const lowStockItems = data.filter((item) => item.currentquantity <= (item.capacity / 3));
                setLowStockItems(lowStockItems.length);
                setStorageTanks(data);
          }
            } catch (error) {
                console.error("Error fetching stations:", error);
            }
        };
    const fetchinventory = async () => {
            try {
                const data = await getinventory(selectedStation);
                setInventory(data);
            } catch (error) {
                console.error("Error fetching stations:", error);
            }
        };
    const handleDeleteinventory= (id) => {
        if (confirm("Are you sure you want to delete this customer?")) {
            deleteInventory(id)
            .then(() => {
              setLoadAllData(true)
            })
            .catch((error) => {
              console.error("Error deleting customer:", error);
            });
        }
      }
  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground">Inventory Management</h2>
            <p className="text-muted-foreground">
            Monitor stock levels and fuel tank status
            </p>
        </div>
        <div className="flex items-center space-x-4">
            <Label htmlFor="role">Campus</Label>
            <Select value={selectedStation} onValueChange={(value) => setSelectedStation(value)} >
                <SelectTrigger>
                    <SelectValue placeholder="Select your role" />
                </SelectTrigger>
                <SelectContent className="w-48 max-h-60 rounded-md background-white shadow-lg">
                    {
                        stations.map((station) => (
                            <SelectItem key={station.gasstationid} value={station.gasstationid}>
                                {station.gasstationname}
                            </SelectItem>
                        ))
                    }
                </SelectContent>
            </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {/* <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">
              Items below minimum stock
            </p>
          </CardContent>
        </Card> */}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Storage Tank</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{storageTanks.length}</div>
            <p className="text-xs text-muted-foreground">
              Products in inventory
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Quantity</CardTitle>
            <Fuel className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lowStockItems}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* <Card>
          <CardHeader>
            <CardTitle>Fuel Tank Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Regular Gasoline</span>
              <Badge variant="secondary">85% Full</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Premium Gasoline</span>
              <Badge variant="secondary">72% Full</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Diesel</span>
              <Badge variant="destructive">15% Full</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Premium Diesel</span>
              <Badge variant="secondary">91% Full</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Low Stock Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Motor Oil 5W-30</span>
                <Badge variant="destructive">3 units</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Windshield Washer Fluid</span>
                <Badge variant="destructive">5 units</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Energy Drinks</span>
                <Badge variant="destructive">12 units</Badge>
              </div>
            </div>
          </CardContent>
        </Card> */}
      </div>
      <Tabs defaultValue="inventory" className="">
      <TabsList>
          <TabsTrigger value="inventory">inventory</TabsTrigger>
          <TabsTrigger value="storagetank">storagetank</TabsTrigger>
      </TabsList>
      <TabsContent value="inventory">
      <Card>
        <CardHeader>
          <CardTitle>Product Inventory</CardTitle>
        </CardHeader>
        <CardContent className="overflow-y-auto max-h-90">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>transactionid</TableHead>
                <TableHead>transactiondate</TableHead>
                <TableHead>tankid</TableHead>
                <TableHead>quantityout</TableHead>
                <TableHead>remainingquantity</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inventory.length > 0 ? (
                inventory.map((item) => (
                  <TableRow key={item.transactionid}>
                    <TableCell>{item.transactionid}</TableCell>
                    <TableCell>{item.transactiondate}</TableCell>
                    <TableCell>{item.tankid}</TableCell>
                    <TableCell>{item.quantityout}</TableCell>
                    <TableCell>{item.remainingquantity}</TableCell>
                    <TableCell className="space-x-2 text-right">
                      <Button variant="outline" size="icon" onClick={() => handleDeleteinventory(item.transactionid)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">
                    No products found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      </TabsContent>
      <TabsContent value="storagetank">
        <Card>
        <CardHeader>
          <CardTitle>Storage Tank</CardTitle>
        </CardHeader>
        <CardContent className="overflow-y-auto max-h-90">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tank name</TableHead>
                <TableHead>Capacity</TableHead>
                <TableHead>Materialtype</TableHead>
                <TableHead>Currentquantity</TableHead>
                <TableHead>Alert</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {storageTanks.length > 0 ? (
                storageTanks.map((item) => (
                  <TableRow key={item.tankid}>
                    <TableCell>{item.tankname}</TableCell>
                    <TableCell>{item.capacity}</TableCell>
                    <TableCell>{item.materialtype}</TableCell>
                    <TableCell>{item.currentquantity}</TableCell>
                    <TableCell>
                      {item.currentquantity <= (item.capacity / 3) ? (
                        <Badge variant="destructive">Low</Badge>
                      ) : (
                        <Badge variant="secondary">Normal</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">
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