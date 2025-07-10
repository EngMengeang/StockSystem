import { Sequelize, DataTypes } from "sequelize";
import sequelize from "../ulits/database.js";

const Stock = sequelize.define('stock', {
  s_id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  s_quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
  }
});

export default Stock;