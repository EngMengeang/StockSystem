import sequelize from "../ulits/database";

const connectToDatabase = async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ DB connected');
    } catch (error) {
        console.error('❌ DB connection failed:', error);
    }
};

connectToDatabase();