import React, { useState } from "react";
import {
  Package,
  Plus,
  ShoppingCart,
  Eye,
  Calendar,
  AlertTriangle,
  BarChart3,
  Search,
  Bell,
  Menu,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
export default function Home() {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const menuItems = [
    {
      id: "view-products",
      title: "View Products",
      description: "Browse and manage your product inventory",
      icon: Package,
      color: "bg-blue-500",
      hoverColor: "hover:bg-blue-600",
      path: "/DisplayProducts",
    },
    {
      id: "add-product",
      title: "Add Product",
      description: "Create new products for your inventory",
      icon: Plus,
      color: "bg-green-500",
      hoverColor: "hover:bg-green-600",
      path: "/products/add",
    },
    {
      id: "sale-product",
      title: "Sale Product",
      description: "Process product sales and transactions",
      icon: ShoppingCart,
      color: "bg-purple-500",
      hoverColor: "hover:bg-purple-600",
      path: "/sales/new",
    },
    {
      id: "view-sales",
      title: "View Sale Products",
      description: "Track sales history and performance",
      icon: Eye,
      color: "bg-indigo-500",
      hoverColor: "hover:bg-indigo-600",
      path: "/sales",
    },
    {
      id: "set-expiry",
      title: "Set Product Expiry",
      description: "Manage product expiration dates",
      icon: Calendar,
      color: "bg-orange-500",
      hoverColor: "hover:bg-orange-600",
      path: "/products/expiry",
    },
    {
      id: "view-expired",
      title: "View Expired Products",
      description: "Monitor expired and expiring products",
      icon: AlertTriangle,
      color: "bg-red-500",
      hoverColor: "hover:bg-red-600",
      path: "/products/expired",
    },
    {
      id: "summary",
      title: "Product Summary",
      description: "View comprehensive product analytics",
      icon: BarChart3,
      color: "bg-teal-500",
      hoverColor: "hover:bg-teal-600",
      path: "/summary",
    },
  ];

  const handleMenuClick = (path) => {
    // In a real app, this would use React Router or similar
    navigate(`${path}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-blue-600" />
              <h1 className="ml-3 text-2xl font-bold text-gray-900">
                ProductHub
              </h1>
            </div>

          </div>
        </div>

        
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to Your Product Management Dashboard
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Streamline your inventory management with our comprehensive suite of
            tools. Track products, manage sales, monitor expiration dates, and
            analyze performance all in one place.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Products
                </p>
                <p className="text-2xl font-bold text-gray-900">1,234</p>
              </div>
              <Package className="h-8 w-8 text-blue-500" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Sales Today</p>
                <p className="text-2xl font-bold text-gray-900">89</p>
              </div>
              <ShoppingCart className="h-8 w-8 text-green-500" />
            </div>
          </div>
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
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Revenue</p>
                <p className="text-2xl font-bold text-gray-900">$12.4K</p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-500" />
            </div>
          </div>
        </div>

        {/* Menu Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <div
                key={item.id}
                onClick={() => handleMenuClick(item.path)}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 cursor-pointer transform transition-all duration-200 hover:shadow-lg hover:scale-105 hover:-translate-y-1"
              >
                <div className="flex flex-col items-center text-center">
                  <div
                    className={`${item.color} ${item.hoverColor} p-4 rounded-full mb-4 transition-colors duration-200`}
                  >
                    <IconComponent className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {item.title}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Recent Activity */}
        <div className="mt-12 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Recent Activity
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div className="flex items-center">
                <div className="bg-green-100 p-2 rounded-full mr-3">
                  <Plus className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    New product added
                  </p>
                  <p className="text-xs text-gray-500">
                    iPhone 15 Pro Max added to inventory
                  </p>
                </div>
              </div>
              <span className="text-xs text-gray-500">2 hours ago</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div className="flex items-center">
                <div className="bg-blue-100 p-2 rounded-full mr-3">
                  <ShoppingCart className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Sale completed
                  </p>
                  <p className="text-xs text-gray-500">
                    MacBook Air sold for $999
                  </p>
                </div>
              </div>
              <span className="text-xs text-gray-500">4 hours ago</span>
            </div>
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center">
                <div className="bg-orange-100 p-2 rounded-full mr-3">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Expiration alert
                  </p>
                  <p className="text-xs text-gray-500">
                    5 products expire within 7 days
                  </p>
                </div>
              </div>
              <span className="text-xs text-gray-500">1 day ago</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-600">
            <p>&copy; 2025 ProductHub. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
