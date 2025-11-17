const boardEl = document.getElementById("board");
const turnIndicator = document.getElementById("turnIndicator");
const moveHistoryEl = document.getElementById("moveHistory");
const promotionModal = document.getElementById("promotionModal");
const promotionChoices = document.getElementById("promotionChoices");

let board = [];
let selectedSquare = null;
let turn = "white";
let moveHistory = [];

// Unicode pieces
const piecesSymbols = {
    'P': '♙',
    'R': '♖',
    'N': '♘',
    'B': '♗',
    'Q': '♕',
    'K': '♔',
    'p': '♟',
    'r': '♜',
    'n': '♞',
    'b': '♝',
    'q': '♛',
    'k': '♚'
};

// Initial board setup
const initialBoard = [
    ['r','n','b','q','k','b','n','r'],
    ['p','p','p','p','p','p','p','p'],
    ['','','','','','','',''],
    ['','','','','','','',''],
    ['','','','','','','',''],
    ['','','','','','','',''],
    ['P','P','P','P','P','P','P','P'],
    ['R','N','B','Q','K','B','N','R']
];

// ----- Initialize Board -----
function initBoard() {
    board = initialBoard.map(row => row.slice());
    boardEl.innerHTML = "";
    for(let i=0;i<8;i++){
        for(let j=0;j<8;j++){
            const square = document.createElement("div");
            square.classList.add("square");
            square.classList.add((i+j)%2===0 ? "light" : "dark");
            square.dataset.row = i;
            square.dataset.col = j;
            square.addEventListener("click", squareClick);
            boardEl.appendChild(square);
        }
    }
    renderBoard();
    turn = "white";
    updateTurn();
    moveHistory = [];
    renderMoveHistory();
}

function renderBoard() {
    const squares = boardEl.querySelectorAll(".square");
    squares.forEach(sq=>{
        const row = sq.dataset.row;
        const col = sq.dataset.col;
        const piece = board[row][col];
        sq.innerHTML = piece ? `<span class="piece ${piece === piece.toUpperCase() ? 'white':''}">${piecesSymbols[piece]}</span>` : "";
        sq.classList.remove("highlight");
    });
}

function squareClick(e){
    const row = parseInt(this.dataset.row);
    const col = parseInt(this.dataset.col);
    const piece = board[row][col];
    if(selectedSquare){
        const [sr, sc] = selectedSquare;
        const selectedPiece = board[sr][sc];
        // simple move legality: can't capture own piece
        if((selectedPiece.toUpperCase() === selectedPiece && piece && piece.toUpperCase() === piece) ||
           (selectedPiece.toLowerCase() === selectedPiece && piece && piece.toLowerCase() === piece)){
            selectedSquare = null;
            renderBoard();
            return;
        }
        // Move piece
        board[row][col] = selectedPiece;
        board[sr][sc] = "";
        moveHistory.push(`${selectedPiece}@${sr}${sc} -> ${row}${col}`);
        renderMoveHistory();
        // Pawn promotion check
        if(selectedPiece === 'P' && row === 0){
            showPromotionModal(row,col,'white');
        } else if(selectedPiece === 'p' && row === 7){
            showPromotionModal(row,col,'black');
        }
        selectedSquare = null;
        turn = turn === "white" ? "black" : "white";
        updateTurn();
        renderBoard();
    } else {
        if(piece && ((turn==="white" && piece===piece.toUpperCase()) || (turn==="black" && piece===piece.toLowerCase()))){
            selectedSquare = [row,col];
            this.classList.add("highlight");
        }
    }
}

function updateTurn(){
    turnIndicator.innerText = turn.charAt(0).toUpperCase() + turn.slice(1);
}

function renderMoveHistory(){
    moveHistoryEl.innerHTML = "";
    moveHistory.forEach(m=>{
        const li = document.createElement("li");
        li.innerText = m;
        moveHistoryEl.appendChild(li);
    });
}

function resetGame(){
    initBoard();
}

// ----- Promotion -----
function showPromotionModal(row,col,color){
    promotionModal.classList.remove("hidden");
    promotionChoices.querySelectorAll("div").forEach(div=>{
        div.onclick = ()=>{
            const piece = div.dataset.piece;
            board[row][col] = color==='white'?piece:piece.toLowerCase();
            promotionModal.classList.add("hidden");
            renderBoard();
        }
    });
}

// ----- Init -----
initBoard();
