import Product from "../product.js";
import ImportProduct from "../importProduct.js";
import ExpireProduct from "../expireProduct.js";
import Sale from "../sale.js";
import Stock from "../stock.js";

// Associations
Product.hasMany(ImportProduct, { foreignKey: 'p_id', as: 'ImportProduct', onDelete: 'CASCADE' });
ImportProduct.belongsTo(Product, { foreignKey: 'p_id', onDelete: 'CASCADE' });

Product.hasMany(ExpireProduct, { foreignKey: 'p_id', as: 'ExpireProduct', onDelete: 'CASCADE' });
ExpireProduct.belongsTo(Product, { foreignKey: 'p_id', onDelete: 'CASCADE' });

Sale.belongsTo(Product, { foreignKey: 'p_id', as: 'product', onDelete: 'CASCADE' });
Product.hasMany(Sale, { foreignKey: 'p_id', as: 'sale', onDelete: 'CASCADE' });

Product.hasOne(Stock, { foreignKey: 'p_id', as: 'Stock', onDelete: 'CASCADE' });
Stock.belongsTo(Product, { foreignKey: 'p_id', onDelete: 'CASCADE' });
