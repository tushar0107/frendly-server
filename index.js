const express = require('express');
const http = require('http');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();
const uri = process.env.URI;
const port = process.env.PORT;
const address = process.env.ADDRESS;


const {MongoClient,ObjectId} = require('mongodb');

const client = new MongoClient(process.env.URI);

const connectDB = async()=>{
    try{
        await client.connect();
        return client.db('frendly');
    }catch(e){
        console.log('Error connecting the database: ',e.message);
    }
}

const mongo = connectDB(); // connect to database

const app = express(); //initialize express app
var corsOptions = {
    methods : ['GET','POST'],
    credentials:true,
    optionsSuccessStatus:200
};

const path = require('path')
// app.use('/post-images', express.static(path.join(__dirname, 'uploads')))

app.use('/post-images',express.static('uploads/post-images'));
app.use(express.json());// to convert form data to json
app.use(express.urlencoded({extended:true})); // enable url encoding for form data parsing
app.use(cors(corsOptions));//enable cors


app.options('*',cors());
const server = http.createServer(app); // can be user for websockets

//root path
app.get('/',async function(req,res){
    res.send('<h2>Hello to express</h2>');
});
//health
app.get('/health',async function(req,res){
    res.send('<h2>Hello to express</h2>');
});

// to find users
app.get('/api/v1/find-users', function(req,res){
    
});

app.post('/api/v1/login',function(req,res){
    const {username,password} = req.body;
    mongo.then(async function(db) {
        const result = await db.collection('users').findOne({'username':username});
        if(result){
            res.status(200).json({
                'status':true,
                'data':result,
                'message':'Success'
            });
        }else{
            res.status(401).json({
                'status':false,
                'data':null,
                'message':'Username or password incorrect'
            });
        }
    })
});

app.post('/api/v1/signup',function (req,res) {
    const formdata = req.body;
    mongo.then(async(db)=>{
        const result = await db.collection('users').findOne({'username':formdata.username});
        if(!result){
            const result = await db.collection('users').insertOne(formdata);
            if(result){
                res.status(200).json({
                    'status':true,
                    'data':formdata,
                    'message':'Registered successfully'
                });
            }
        }else{
            res.status(200).json({
                'status':false,
                'data':null,
                'message':'Username already exists'
            });
        }
    });
});

app.get('/api/v1/get-posts',(req,res)=>{
    mongo.then(async(db)=>{
        const result = await db.collection('posts').find().toArray();
        if(result.length){
            res.status(200).json({
                'status':true,
                'data':result,
                'message':'success'
            });
        }else{
            res.status(200).json({
                'status':false,
                'data':null,
                'message':'Unable to fetch posts'
            });
        }
    }).catch(e=>console.log('Error fetching posts: ',e.message));
});

app.get('/api/v1/get-user/:username',(req,res)=>{
    mongo.then(async(db)=>{
        const result = await db.collection('users').findOne({'username':req.params.username});
        if(result){
            const posts = await db.collection('posts').find({'username':result.username}).toArray();

            res.status(200).json({
                'status':true,
                'data':result,
                'posts':posts,
                'message':'success'
            });
        }else{
            res.status(200).json({
                'status':false,
                'data':null,
                'message':'Unable to fetch user'
            });
        }
    }).catch(e=>console.log(e.message));
});

// app.post('/api/v1/search',(req,res)=>{
//     mongo.then(async(db)=>{
//         const result = await db.collection('users').find({$text:{$search:'username'}})
//     });
// });

app.get('/api/v1/get-contacts',(req,res)=>{
    res.status(200).json({
        'status':true,
        'message':'success'
    });
    // mongo.then(async(db)=>{
        
    // }).catch(e=>console.log(e.message));
});

app.listen(port,address,function(){
    console.log(`Server listening at http://${address}:${port}`);
});