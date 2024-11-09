const express = require('express');
const socket = require("socket.io");
const http = require('http')
const{ Chess } = require("chess.js")
const path = require("path");
const { title } = require('process');


const app = express();


const server = http.createServer(app)
const io = socket(server); // socket ko chaiye server and pass kardiya io me

const chess = new Chess();
let players ={};
let currentPlayer = "W"


app.set("view engine","ejs")
//will use ejs via this 
app.use(express.static(path.join(__dirname,"public")));//will use static elements via this 


app.get("/",(req,res)=>{
    res.render("index.ejs",{ title: "Chezz"})
});


//suniquwocket is info about banda jo aaya hai 
io.on("connection",function(uniquesocket){
   console.log("connected");

   let playerName = "Player"; // Default name

   uniquesocket.on("setName", (name) => {
       playerName = name; // Store the player's name
       if(!players.white){
        players.white = uniquesocket.id;
        uniquesocket.emit("playerRole","w");
        uniquesocket.emit("colorAssigned", "You are playing as White!");
       }
        else if (!players.black){
        players.black = uniquesocket.id;
        uniquesocket.emit("playerRole","b");
        uniquesocket.emit("colorAssigned", "You are playing as Black!");
       }
       else{
        uniquesocket.emit("spectatorRole");
       }

       // Notify all clients that a player has joined
       io.emit("playerJoined", playerName);
   });

   // Handle chat messages
   uniquesocket.on("chatMessage", (message) => {
       io.emit("chatMessage", { name: playerName, message: message });
   });

   //kisi ke disconnet hone pe 
   uniquesocket.on("disconnect",function(){
    if(uniquesocket.id === players.white){
        delete players.white
    }  
    else if (uniquesocket.id === players.black){
        delete players.black
    }
   })


uniquesocket.on("move",(move)=>{
    try{
        if(chess.turn()==='w' && uniquesocket.id !== players.white) return;
        if(chess.turn()==='b' && uniquesocket.id !== players.black) return;

        const result =  chess.move(move);
        if(result){ //matlab if truthy 
            currentPlayer = chess.turn();
            io.emit("move",move);//io emit matlab sabko bhej rhe hai 
            io.emit("boardState", chess.fen())
        } 
        else{
            console.log("Invalid move:",move);
            uniquesocket.emit("Invalid move",move);
        }

    }
    catch(err){
        uniquesocket.emit("invalid move :",move)
        console.log(err)

     }
})
   


});















server.listen(3000,()=>{
    console.log("the server is running")
})



