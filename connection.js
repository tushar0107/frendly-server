
const {MongoClient,ObjectId} = require('mongodb');

const client = new MongoClient('mongodb+srv://test_user:Tushar172001@my-cluster.snudrh9.mongodb.net/?retryWrites=true&w=majority&appName=my-cluster');

const getDB = async()=>{
    try{
        await client.connect();
        console.log('connecting');
        const db = client.db('frendly');
    }catch(e){
        console.log('Error connecting the database: ',e.message);
    }
}


module.exports = getDB;