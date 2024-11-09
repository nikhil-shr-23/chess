const socket = io();
const chess = new Chess();
const boardElement = document.querySelector(".chessboard")
const notificationElement = document.getElementById("notification");
const chatMessagesElement = document.getElementById("chat-messages");
const chatInputElement = document.getElementById("chat-input");
const sendChatButton = document.getElementById("send-chat");

let draggedPiece = null;
let sourceSquare = null;
let playerRole = null;

// Prompt for player's name
const playerName = prompt("Enter your name:");
if (playerName) {
    socket.emit("setName", playerName); // Send the name to the server
}

// Chat message handling
sendChatButton.addEventListener("click", () => {
    const message = chatInputElement.value;
    if (message) {
        socket.emit("chatMessage", message); // Send the message to the server
        chatInputElement.value = ""; // Clear the input
    }
});

// Listen for incoming chat messages
socket.on("chatMessage", (data) => {
    const messageElement = document.createElement("div");
    messageElement.classList.add("chat-message");
    messageElement.innerText = `${data.name}: ${data.message}`;
    chatMessagesElement.appendChild(messageElement);
    chatMessagesElement.scrollTop = chatMessagesElement.scrollHeight; // Scroll to the bottom
});

const renderboard = ()=>{
    const board = chess.board();
    boardElement.innerHTML = ""
    board.forEach((row,rowindex) => {
        row.forEach((square,sqaureindex)=>{
            const squareElement = document.createElement("div");
            squareElement.classList.add("square",
                (rowindex + sqaureindex)%2 === 0 ? "light" : "dark"
            );

            squareElement.dataset.row = rowindex;
            squareElement.dataset.col = sqaureindex;


            if(square){
                const pieceElement = document.createElement("div")
                pieceElement.classList.add("piece", square.color === 'w' ? "white" : "black")
            

            pieceElement.innerText = getpieceunicode(square);
            pieceElement.draggable = playerRole === square.color;


            pieceElement.addEventListener("dragstart",(e)=>{
                if(pieceElement.draggable){
                    draggedPiece = pieceElement;
                    sourceSquare = {row:rowindex,col:sqaureindex};
                    e.dataTransfer.setData("text/plain","");
                    
                    draggedPiece.style.opacity = "0.5";
                }

            })
            pieceElement.addEventListener("dragend",(e)=>{
                draggedPiece.style.opacity = "1";
                draggedPiece=null;
                sourceSquare=null;
            })

            squareElement.appendChild(pieceElement)

            }

            squareElement.addEventListener("dragover", function (e){
             e.preventDefault();
            });

            squareElement.addEventListener("drop",function (e){
                e.preventDefault();
                if(draggedPiece){
                    const targetSquare = {
                        row: parseInt(squareElement.dataset.row),
                        col: parseInt(squareElement.dataset.col)
                    };

                    handlemove(sourceSquare,targetSquare);
                }
            })

            boardElement.appendChild(squareElement);
        })



        
    });


    boardElement.classList.toggle("flipped", playerRole === 'b');

    

    

};

const handlemove = (source, target) => {
    const move = {
        from: `${String.fromCharCode(97 + source.col)}${8 - source.row}`,
        to: `${String.fromCharCode(97 + target.col)}${8 - target.row}`,
        promotion: 'q', 
    }

    socket.emit("move", move);
}

const getpieceunicode = (piece) => {
    const unicodePieces = {
        P: "♙",  // White Pawn
        N: "♘",  // White Knight
        B: "♗",  // White Bishop
        R: "♖",  // White Rook
        Q: "♕",  // White Queen
        K: "♔",  // White King
        p: "♙",  // Black Pawn
        n: "♞",  // Black Knight
        b: "♝",  // Black Bishop
        r: "♜",  // Black Rook
        q: "♛",  // Black Queen
        k: "♚",
    }

    return unicodePieces[piece.type] || "";
}

socket.on("playerRole", function (role){
    playerRole = role
    renderboard()
});

socket.on("spectatorROle", function(){
    playerRole = null;
    renderboard();
})

socket.on("boardState", function(fen){
    chess.load(fen)
    renderboard();

})

socket.on("move",function(move){
    chess.move(move);
    renderboard()
})

socket.on("playerJoined", function(name) {
    // Show the notification with the player's name
    notificationElement.innerText = `${name} has joined the game!`;
    notificationElement.style.display = "block";

    // Hide the notification after 3 seconds
    setTimeout(() => {
        notificationElement.style.display = "none";
    }, 3000);
});

socket.on("colorAssigned", function(message) {
    // Show the notification with the player's color
    notificationElement.innerText = message;
    notificationElement.style.display = "block";

    // Hide the notification after 3 seconds
    setTimeout(() => {
        notificationElement.style.display = "none";
    }, 3000);
});

renderboard();