import { useEffect, useState } from "react"
import { Package, AlertCircle, ShoppingCart, Home, Search } from "lucide-react"
import { getMyProducts, getProductByName } from '../api/server'

// Simple function to get badge colors
function getBadgeColor(variant) {
  if (variant === "red") return "bg-red-100 text-red-800"
  if (variant === "yellow") return "bg-yellow-100 text-yellow-800"
  return "bg-gray-100 text-gray-800" // default
}

function getStockStatus(quantity) {
  if (quantity === 0) return { label: "Out of Stock", variant: "red" }
  if (quantity < 10) return { label: "Low Stock", variant: "yellow" }
  return { label: "In Stock", variant: "default" }
}

export default function DisplayProducts() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [isSearching, setIsSearching] = useState(false)

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await getMyProducts()
        setProducts(data)
      } catch (err) {
        setError('Failed to fetch products')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  const goToHome = () => {
    // Navigate to home page - replace with your routing logic
    window.location.href = '/'
  }

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      // If search is empty, get all products
      setError(null)
      setLoading(true)
      try {
        const data = await getMyProducts()
        setProducts(data)
      } catch (err) {
        setError('Failed to fetch products')
      } finally {
        setLoading(false)
      }
      return
    }

    setIsSearching(true)
    setError(null)
    try {
      // Pass search term directly as a string
      const data = await getProductByName(searchTerm.trim())
      setProducts(Array.isArray(data) ? data : [data]) // Ensure it's an array
    } catch (err) {
      setError('No products found with that name')
      setProducts([])
    } finally {
      setIsSearching(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const clearSearch = () => {
    setSearchTerm('')
    setError(null)
    setLoading(true)
    // Get all products again
    const fetchProducts = async () => {
      try {
        const data = await getMyProducts()
        setProducts(data)
      } catch (err) {
        setError('Failed to fetch products')
      } finally {
        setLoading(false)
      }
    }
    fetchProducts()
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header with Home Button */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Package className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Product Inventory</h1>
        </div>
        <button
          onClick={goToHome}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          <Home className="h-4 w-4" />
          Back to Home
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-8">
        <div className="flex items-center gap-2 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search products by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={isSearching}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
          >
            {isSearching ? 'Searching...' : 'Search'}
          </button>
          {searchTerm && (
            <button
              onClick={clearSearch}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded mb-6">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <span className="text-red-800">{error}</span>
        </div>
      )}

      {/* Loading State */}
      {(loading || isSearching) && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white border rounded-lg p-6">
              <div className="h-4 bg-gray-200 rounded mb-4 animate-pulse"></div>
              <div className="h-3 bg-gray-200 rounded mb-2 animate-pulse w-1/2"></div>
              <div className="h-3 bg-gray-200 rounded animate-pulse w-1/3"></div>
            </div>
          ))}
        </div>
      )}

      {/* Products Grid */}
      {!loading && !error && !isSearching && (
        <>
          <p className="text-gray-600 mb-6">
            {searchTerm ? `Search results for "${searchTerm}"` : `Showing ${products.length} products`}
          </p>
          
          {products.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No products found</h3>
              <p className="text-gray-600">Add some products to your inventory</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product, index) => {
                const stockStatus = getStockStatus(product.Stock?.s_quantity || 0)
                const quantity = product.Stock?.s_quantity || 0

                return (
                  <div key={index} className="bg-white border rounded-lg p-6 hover:shadow-lg transition-shadow">
                    {/* Product Header */}
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 flex-1 mr-2">
                        {product.p_name}
                      </h3>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getBadgeColor(stockStatus.variant)}`}>
                        {stockStatus.label}
                      </span>
                    </div>

                    {/* Product Details */}
                    <div className="space-y-3">
                      <div className="text-2xl font-bold text-blue-600">
                        ${product.p_price.toFixed(2)}
                      </div>

                      <div className="flex items-center gap-2 text-gray-600">
                        <ShoppingCart className="h-4 w-4" />
                        <span>{quantity} units in stock</span>
                      </div>

                      {/* Stock Bar */}
                      <div>
                        <div className="flex justify-between text-xs text-gray-600 mb-1">
                          <span>Stock Level</span>
                          <span>{quantity}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              quantity === 0 ? "bg-red-500" : 
                              quantity < 10 ? "bg-yellow-500" : "bg-green-500"
                            }`}
                            style={{ width: `${Math.min((quantity / 50) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}