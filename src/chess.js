/********************************************************************
 *    MODERN CHESS GAME ENGINE + UI
 ********************************************************************/

const boardEl = document.getElementById("board");
const historyEl = document.getElementById("history");
const turnIndicator = document.getElementById("turnIndicator");
const resetBtn = document.getElementById("resetBtn");

const moveSound = document.getElementById("moveSound");
const captureSound = document.getElementById("captureSound");

const promotionModal = document.getElementById("promotionModal");
const promotionChoices = document.getElementById("promotionChoices");

let board = [];
let selected = null;
let validMoves = [];
let whiteTurn = true;
let moveHistory = [];

const PIECES = {
    white: {
        K: "♔", Q: "♕", R: "♖", B: "♗", N: "♘", P: "♙"
    },
    black: {
        K: "♚", Q: "♛", R: "♜", B: "♝", N: "♞", P: "♟"
    }
};

function initBoard() {
    board = [
        ["bR","bN","bB","bQ","bK","bB","bN","bR"],
        ["bP","bP","bP","bP","bP","bP","bP","bP"],
        ["","","","","","","",""],
        ["","","","","","","",""],
        ["","","","","","","",""],
        ["","","","","","","",""],
        ["wP","wP","wP","wP","wP","wP","wP","wP"],
        ["wR","wN","wB","wQ","wK","wB","wN","wR"]
    ];
}

function renderBoard() {
    boardEl.innerHTML = "";
    for (let r=0; r<8; r++) {
        for (let c=0; c<8; c++) {
            const square = document.createElement("div");
            square.classList.add("square");
            square.classList.add((r+c) % 2 === 0 ? "light" : "dark");
            square.dataset.row = r;
            square.dataset.col = c;

            const piece = board[r][c];
            if (piece) {
                const el = document.createElement("div");
                el.classList.add("piece");
                el.textContent = PIECES[piece[0]==="w"?"white":"black"][piece[1]];
                el.draggable = true;
                square.appendChild(el);
            }

            boardEl.appendChild(square);
        }
    }
}

function isWhite(piece) { return piece && piece[0]==="w"; }
function isBlack(piece) { return piece && piece[0]==="b"; }

/***************************************************************
 * MOVE GENERATION + RULES (simplified but complete)
 ***************************************************************/
function generateMoves(r,c) {
    const piece = board[r][c];
    if (!piece) return [];
    const color = piece[0];
    const type = piece[1];

    let moves = [];

    const directions = {
        N: [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]],
        B: [[-1,-1],[-1,1],[1,-1],[1,1]],
        R: [[-1,0],[1,0],[0,-1],[0,1]],
        Q: [[-1,-1],[-1,1],[1,-1],[1,1],[-1,0],[1,0],[0,-1],[0,1]],
        K: [[-1,-1],[-1,1],[1,-1],[1,1],[-1,0],[1,0],[0,-1],[0,1]]
    };

    // Pawn moves
    if (type === "P") {
        const dir = color==="w" ? -1 : 1;
        if (!board[r+dir][c]) moves.push([r+dir,c]);

        if ((r===6 && color==="w") || (r===1 && color==="b")) {
            if (!board[r+dir][c] && !board[r+2*dir][c])
                moves.push([r+2*dir,c]);
        }

        // captures
        for (const dc of [-1,1]) {
            const nr=r+dir, nc=c+dc;
            if (nc>=0 && nc<8 && board[nr][nc] && board[nr][nc][0]!==color)
                moves.push([nr,nc]);
        }

        return moves;
    }

    // Knights
    if (type==="N") {
        for (const [dr,dc] of directions.N) {
            const nr=r+dr, nc=c+dc;
            if (nr>=0&&nr<8&&nc>=0&&nc<8 && (!board[nr][nc] || board[nr][nc][0]!==color))
                moves.push([nr,nc]);
        }
        return moves;
    }

    // Sliding pieces (B,R,Q)
    if (type==="B"||type==="R"||type==="Q") {
        for (const [dr,dc] of directions[type]) {
            let nr=r+dr, nc=c+dc;
            while (nr>=0&&nr<8&&nc>=0&&nc<8) {
                if (!board[nr][nc]) {
                    moves.push([nr,nc]);
                } else {
                    if (board[nr][nc][0]!==color) moves.push([nr,nc]);
                    break;
                }
                nr+=dr; nc+=dc;
            }
        }
        return moves;
    }

    // King
    if (type==="K") {
        for (const [dr,dc] of directions.K) {
            const nr=r+dr,nc=c+dc;
            if (nr>=0&&nr<8&&nc>=0&&nc<8 && (!board[nr][nc] || board[nr][nc][0]!==color))
                moves.push([nr,nc]);
        }
        return moves;
    }

    return moves;
}

/***************************************************************
 * UI Handlers
 ***************************************************************/
function clearHighlights() {
    document.querySelectorAll(".highlight")
        .forEach(el => el.classList.remove("highlight"));
}

function onSquareClick(e) {
    const square = e.target.closest(".square");
    if (!square) return;

    const r = Number(square.dataset.row);
    const c = Number(square.dataset.col);
    const piece = board[r][c];

    // Selecting piece
    if (!selected) {
        if (piece && ((whiteTurn && isWhite(piece)) || (!whiteTurn && isBlack(piece)))) {
            selected = {r,c};
            validMoves = generateMoves(r,c);
            highlightMoves();
        }
        return;
    }

    // If clicking same color piece → change selection
    if (piece && piece[0] === board[selected.r][selected.c][0]) {
        selected = {r,c};
        validMoves = generateMoves(r,c);
        highlightMoves();
        return;
    }

    // Try move
    if (isValidMove(r,c)) {
        makeMove(selected.r, selected.c, r, c);
    }

    selected = null;
    validMoves = [];
    clearHighlights();
}

function highlightMoves() {
    clearHighlights();
    for (let [r,c] of validMoves) {
        document.querySelector(`.square[data-row="${r}"][data-col="${c}"]`)
            .classList.add("highlight");
    }
}

function isValidMove(r,c) {
    return validMoves.some(m => m[0]===r && m[1]===c);
}

function makeMove(sr,sc,tr,tc) {
    const piece = board[sr][sc];
    const target = board[tr][tc];

    if (target) captureSound.play();
    else moveSound.play();

    // Pawn promotion
    if (piece[1]==="P" && (tr===0 || tr===7)) {
        showPromotionModal(piece[0], sr, sc, tr, tc);
        return;
    }

    board[tr][tc] = piece;
    board[sr][sc] = "";
    addHistory(sr,sc,tr,tc,piece,target);
    whiteTurn = !whiteTurn;
    updateTurnIndicator();
    renderBoard();
}

function updateTurnIndicator() {
    turnIndicator.textContent = "Turn: " + (whiteTurn ? "White" : "Black");
}

function addHistory(sr,sc,tr,tc,piece,captured) {
    const file="abcdefgh"[sc];
    const rank=8-sr;
    const tfile="abcdefgh"[tc];
    const trank=8-tr;
    const text = `${piece}: ${file}${rank} → ${tfile}${trank}` + 
                 (captured? " x":"");

    const li = document.createElement("li");
    li.textContent = text;
    historyEl.appendChild(li);
}

function resetGame() {
    initBoard();
    renderBoard();
    historyEl.innerHTML = "";
    whiteTurn = true;
    updateTurnIndicator();
}

/***************************************************************
 * PROMOTION
 ***************************************************************/
function showPromotionModal(color, sr, sc, tr, tc) {
    promotionModal.classList.remove("hidden");

    const choices = ["Q","R","B","N"];
    promotionChoices.innerHTML = "";

    choices.forEach(type => {
        const img = document.createElement("div");
        img.textContent = PIECES[color==="w"?"white":"black"][type];
        img.classList.add("promoPiece");
        img.onclick = () => {
            board[tr][tc] = color + type;
            board[sr][sc] = "";
            promotionModal.classList.add("hidden");
            renderBoard();
        };
        promotionChoices.appendChild(img);
    });
}

/***************************************************************
 * INITIALIZE
 ***************************************************************/
boardEl.addEventListener("click", onSquareClick);
resetBtn.addEventListener("click", resetGame);

initBoard();
renderBoard();
updateTurnIndicator();
