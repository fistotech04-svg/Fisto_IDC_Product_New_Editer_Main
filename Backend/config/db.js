import mongoose from 'mongoose';
import dns from 'dns';
import { getAssimpPath } from '../utils/assimpConverter.js';

const connectDB = async () => {
    try {
        try {
            dns.setServers(['8.8.8.8', '1.1.1.1']);
        } catch (dnsErr) {
            // Ignore if setting servers is restricted
        }
        const conn = await mongoose.connect(process.env.MONGO_URI, {
            dbName: 'Fisto_IDC'
        });
        console.log(`MongoDB Connected: ${conn.connection.host}`);
        try {
            const assimpPath = getAssimpPath();
            console.log(`Assimp Connected Successfully: ${assimpPath}`);
        } catch (assimpErr) {
            console.warn(`Assimp Notice: ${assimpErr.message}`);
        }
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

export default connectDB;
