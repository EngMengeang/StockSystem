import sequelize from "../ulits/database.js";
import { Sequelize, DataTypes } from "sequelize";

const Sale = sequelize.define('sale', {
  sale_id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
  }
});

export default Sale;