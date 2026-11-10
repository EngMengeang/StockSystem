import { DataTypes } from "sequelize";
import sequelize from "../ulits/database.js";

const Product = sequelize.define('products', {
  p_id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  p_name: { type: DataTypes.STRING, allowNull: false },
  p_price: { type: DataTypes.FLOAT, allowNull: false },
  // --- added in the database upgrade ---
  sku: { type: DataTypes.STRING(40), allowNull: true },     // stock-keeping code, e.g. SKU-0007
  p_cost: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },   // what we pay per unit (for profit)
  reorder_level: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 10 }, // "low stock" threshold per product
  is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },  // hide instead of delete when it has sales
  createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
}, { timestamps: false, indexes: [{ unique: true, fields: ['sku'], name: 'products_sku_unique' }] });

export default Product;
