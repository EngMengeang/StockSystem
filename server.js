import express from 'express';
import sequelize from './ulits/database.js'; 
import './model/relational/relation.js';
import cors from "cors";
import router from './routes/post.js';


const app = express();
app.use(cors());
app.use(express.json());

const PORT = 4000;

// Option 1: Using an async IIFE for database connection and server start
(async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ Database connected successfully.');

        await sequelize.sync({ alter: true });
        console.log('Tables created or altered as needed.');

        app.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
        });

    } catch (error) {
        console.error(`❌ Database connection failed: ${error}`);
        process.exit(1); // Stop the app if DB connection fails
    }


})();

app.use('/api/', router);


