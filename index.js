const express = require('express');
const http = require('http');
const jwt  = require('jsonwebtoken');
const cors = require('cors');
const {MongoClient,ObjectId} = require('mongodb');
const dotenv = require('dotenv');

dotenv.config();

// environment variables
const uri = process.env.URI;
const port = process.env.PORT;
const address = process.env.ADDRESS;
const secretKey = process.env.JWT_SECRET_KEY;

// start a connection to mongodb server
const client = new MongoClient(uri);
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

//define cors functionality
var corsOptions = {
    methods : ['GET','POST'],
    credentials:true,
    optionsSuccessStatus:200
};

// defining app middlewares
app.use('/post-images',express.static('uploads/post-images')); // server static files from '/post-images/'
app.use('/profile',express.static('uploads/profile')); // server static files from '/profile/'
app.use(express.json());// to parse incoming data to json making the data available in the req
app.use(express.urlencoded({extended:true})); // enable url encoding for form data parsing
app.use(cors(corsOptions));//enable cors

app.options('*',cors()); // enabled cors for all routes
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
    mongo.then(async(db)=>{
        const result = await db.collection('users').find().toArray();
        if(result){
            res.status(200).json({
                'status':true,
                'data':result,
                'message':'success'
            });
        }else{
            res.status(500).json({
                'status':false,
                'message':'Unable to fetch users'
            });
        }
    });
});

// login api
app.post('/api/v1/login',function(req,res){
    const {username,password} = req.body;
    mongo.then(async function(db) {
        const result = await db.collection('users').findOne({'username':username});
        const posts = await db.collection('posts').find({'username':result.username}).toArray();
        // create token
        var token;
        try{
            token = jwt.sign(
                {
                    username:username,
                    password:password
                },secretKey,{expiresIn:'1d'}
            );
        }catch{e=>{console.log(e)}};

        if(result){
            res.status(200).json({
                'status':true,
                'data':result,
                'posts':posts,
                'token':token,
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

// registration API
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
                    'posts':[],
                    'message':'Registered successfully'
                });
            }
        }else{
            res.status(200).json({
                'status':false,
                'message':'Username already exists'
            });
        }
    });
});

//update user details
app.post('/api/v1/update-details',(req,res)=>{
    const formdata = req.body;
    const {username} = formdata;
    mongo.then(async(db)=>{
        const result = await db.collection('users').updateOne({'username':username},{$set:query});
        if(result.acknowledged){
            const user = await db.collection('users').findOne({'username':username});
            if(user){
                res.status(200).json({
                    'status':true,
                    'data':user,
                    'message':'Updated successfully'
                });
            }
        }else{
            res.status(500).json({
                'status':false,
                'message':'Failed to update'
            });
        }
    });
});

// to get posts on search based on search queries or for feeds based on user's preferences
// search: 'any array of string', category: 'post' / 'account' / 'videos' / 'tags
app.post('/api/v1/get-posts',(req,res)=>{
    const {search,category} = req.body;
    mongo.then(async(db)=>{
        var posts = [];
        var accounts = [];
        if(category=='Accounts'){
            accounts = await db.collection('users').find({$text:{$search:search.join(" ")}}).toArray();
        }else{
            posts = await db.collection('posts').find({$text:{$search:search.join(" ")}}).toArray();
        }
        var result = {posts:posts,accounts:accounts};
        if(result.posts.length || result.accounts.length){
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

// to fetch user deatils 
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
        }else if(result==null){
            res.status(200).json({
                'status':true,
                'data': {username:'User not found'},
                'message':'User does not exists'
            });
        }else{
            res.status(200).json({
                'status':false,
                'message':'Unable to fetch user'
            });
        }
    }).catch(e=>console.log(e.message));
});

//to get contacts or friends
app.post('/api/v1/get-contacts',(req,res)=>{
    mongo.then(async(db)=>{
        const result = await db.collection('users').find().toArray();
        if(result){
            res.status(200).json({
                'status':true,
                'data':result,
                'message':'success'
            });
        }else{
            res.status(200).json({
                'status':false,
                'message':'Unable to fetch contacts'
            });
        }
    }).catch(e=>console.log(e.message));
});

app.listen(port,address,function(){
    console.log(`Server listening at http://${address}:${port}`);
});