'use strict';

var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');
const validUrl = require("valid-url");
const shortId = require("shortid");
shortId.characters("@$abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ");
const fs = require("fs");

var cors = require('cors');

var app = express();

let mongoClient = mongo.MongoClient;

// Basic Configuration 
var port = process.env.PORT || 3000;

/** this project needs a db !! **/ 
// mongoose.connect(process.env.DB_URI);

app.use(cors());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here

app.use('/public', express.static(process.cwd() + '/public'));

//app.use((req, res, next)=>{});
app.route("/api/package.json").get((req, res, next)=>{
  fs.readFile(__dirname + "/package.json", (err, data)=>{
    if(err) return next(err);
  res.type("txt").send(data.toString());
  })});

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});

app.route("/api/shorturl/:new(*)");

app.route("/new/:url(*)").get((req, res, next)=>{
    // connect to mongo database
    
mongoClient.Connect(process.env.MONGO_URI, (err, db)=>{
    
    if(err) {console.log("unable to connect to the server", err);}
    
    else{
//console.log("connected to the server")
    let collection = db.collection("links");
    let url = req.params.url;
    let host = req.get("host") + "/";
    
// function to generate short links
    let generateLink = (db, callback)=>{
        // check if url is valid
if(validUrl.isUri(url)){
    //console.log("valid URL");}
collection.findOne({url: url}, {short: 1, "_id": 0}, (err, doc)=>{
    if(doc!==null){
        res.json({originalUrl: url,
            shortUrl: host + doc.short
        });
    }
    else{
        // generate a short code
let shortCode = shortId.generate();
let newUrl = {url: url,
    short: shortCode};

collection.insert([newUrl]);
res.json({originalUrl: url,
    shortUrl: host + shortCode
});
    }
})
}
else{console.log("invalid URI");
    res.json({error: "Invalid URL"});
};
    };
    
        generateLink(db, ()=>{db.close();});
    };
});
});

// redirect shortened url to full url

app.route("/:short").get((req, res, next)=>{
   mongoClient.connect(process.env.MONGO_URI, (err, db)=>{
       if(err){console.log("Unable to connect to the server", err);}
       else{
           let collection = db.collection("links");
           let short = req.params.short;
           
           // search for the shortCode and redirect the browser
           collection.findOne({short: short}, {url: 1, "_id": 0}, (err, doc)=>{
               if(doc!==null){res.redirect(doc.url)}
               else{res.json({error: "Short link not found in the database"});}
           });
       } db.close();
   }); 
});

  
// your first API endpoint... 
app.get("/api/hello", function (req, res) {
  res.json({greeting: 'hello API'});
});


app.listen(port, function () {
  console.log('Node.js listening ...');
});