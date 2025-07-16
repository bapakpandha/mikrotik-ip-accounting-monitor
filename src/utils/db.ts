import { PrismaClient } from 'generated'; 

const prisma = new PrismaClient();

export const connectDB = async () => {
    try {
        await prisma.$connect();
        // console.log('Database connected successfully');
    } catch (error) {
        console.error('Error connecting to the database:', error);
        throw error;
    }
};

export const disconnectDB = async () => {
    try {
        await prisma.$disconnect();
        // console.log('Database disconnected successfully');
    } catch (error) {
        console.error('Error disconnecting from the database:', error);
        throw error;
    }
};

export default prisma;