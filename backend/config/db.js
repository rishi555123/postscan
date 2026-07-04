const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const connStr = process.env.MONGODB_URI || 'mongodb://localhost:27017/postscan';
    console.log(`Connecting to MongoDB at: ${connStr.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@')}`); // Hide credentials in logs
    
    const conn = await mongoose.connect(connStr);
    console.log(`MongoDB Connected successfully to host: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    console.error('Please verify your connection string in backend/.env, or ensure a local MongoDB service is running.');
    process.exit(1);
  }
};

module.exports = connectDB;
