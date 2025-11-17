/********************************************************************
 *    CHESS GAME WITH AI — PURE JAVASCRIPT
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

const AI_PLAYS_BLACK = true;  // Set false if you want AI to play white instead

const PIECES = {
    white: { K:"♔", Q:"♕", R:"♖", B:"♗", N:"♘", P:"♙" },
    black: { K:"♚", Q:"♛", R:"♜", B:"♝", N:"♞", P:"♟" }
};

/*****************************
 * INITIAL BOARD SETUP
 *****************************/
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
            const div = document.createElement("div");
            div.classList.add("square");
            div.classList.add((r+c)%2===0?"light":"dark");
            div.dataset.row = r;
            div.dataset.col = c;

            const piece = board[r][c];
            if (piece) {
                const p = document.createElement("div");
                p.classList.add("piece");
                p.textContent = PIECES[piece[0]==="w"?"white":"black"][piece[1]];
                div.appendChild(p);
            }
            boardEl.appendChild(div);
        }
    }
}

function isWhite(p){ return p && p[0]==="w"; }
function isBlack(p){ return p && p[0]==="b"; }

/*****************************
 * MOVE GENERATION
 *****************************/
function generateMoves(r,c) {
    const piece = board[r][c];
    if (!piece) return [];
    const color = piece[0];
    const type = piece[1];

    let moves = [];

    const dirs = {
        N: [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]],
        B: [[-1,-1],[-1,1],[1,-1],[1,1]],
        R: [[-1,0],[1,0],[0,-1],[0,1]],
        Q: [[-1,-1],[-1,1],[1,-1],[1,1],[-1,0],[1,0],[0,-1],[0,1]],
        K: [[-1,-1],[-1,1],[1,-1],[1,1],[-1,0],[1,0],[0,-1],[0,1]]
    };

    // Pawn
    if (type==="P") {
        const dir = color==="w" ? -1 : 1;
        if (!board[r+dir][c]) moves.push([r+dir,c]);
        if ((r===6&&color==="w")||(r===1&&color==="b")) {
            if (!board[r+dir][c] && !board[r+2*dir][c])
                moves.push([r+2*dir,c]);
        }
        for (let dc of [-1,1]) {
            let nr=r+dir, nc=c+dc;
            if (nc>=0 && nc<8 && board[nr][nc] && board[nr][nc][0]!==color)
                moves.push([nr,nc]);
        }
        return moves;
    }

    // Knight
    if (type==="N") {
        for (let [dr,dc] of dirs.N) {
            let nr=r+dr, nc=c+dc;
            if (nr>=0&&nr<8&&nc>=0&&nc<8 && (!board[nr][nc]||board[nr][nc][0]!==color))
                moves.push([nr,nc]);
        }
        return moves;
    }

    // Sliding pieces
    if (type==="B"||type==="R"||type==="Q") {
        for (let [dr,dc] of dirs[type]) {
            let nr=r+dr, nc=c+dc;
            while(nr>=0&&nr<8&&nc>=0&&nc<8) {
                if (!board[nr][nc]) moves.push([nr,nc]);
                else {
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
        for (let [dr,dc] of dirs.K) {
            let nr=r+dr, nc=c+dc;
            if (nr>=0&&nr<8&&nc>=0&&nc<8 && (!board[nr][nc] || board[nr][nc][0]!==color))
                moves.push([nr,nc]);
        }
        return moves;
    }

    return moves;
}

/*****************************
 * UI
 *****************************/
function clearHighlight(){
    document.querySelectorAll(".highlight").forEach(s=>s.classList.remove("highlight"));
}

boardEl.addEventListener("click", e=>{
    const square = e.target.closest(".square");
    if (!square) return;

    const r = Number(square.dataset.row);
    const c = Number(square.dataset.col);
    const piece = board[r][c];

    if (!selected) {
        if (piece && ((whiteTurn && isWhite(piece)) || (!whiteTurn && isBlack(piece) && !AI_PLAYS_BLACK))) {
            selected = {r,c};
            validMoves = generateMoves(r,c);
            highlightMoves();
        }
        return;
    }

    if (piece && piece[0]===board[selected.r][selected.c][0]) {
        selected = {r,c};
        validMoves = generateMoves(r,c);
        highlightMoves();
        return;
    }

    if (validMoves.some(m=>m[0]===r&&m[1]===c)) {
        makeMove(selected.r, selected.c, r, c);
    }

    selected = null;
    validMoves = [];
    clearHighlight();
});

function highlightMoves(){
    clearHighlight();
    for (let [r,c] of validMoves) {
        document.querySelector(`.square[data-row="${r}"][data-col="${c}"]`)
            .classList.add("highlight");
    }
}

/*****************************
 * EXECUTING MOVES
 *****************************/
function makeMove(sr,sc,tr,tc) {
    const piece = board[sr][sc];
    const captured = board[tr][tc];

    // SOUND
    if (captured) captureSound.play();
    else moveSound.play();

    // PROMOTION
    if (piece[1]==="P" && (tr===0 || tr===7)) {
        showPromotionModal(piece[0], sr,sc,tr,tc);
        return;
    }

    board[tr][tc] = piece;
    board[sr][sc] = "";

    addHistory(sr,sc,tr,tc,piece,captured);

    whiteTurn = !whiteTurn;
    updateTurnIndicator();
    renderBoard();

    if (AI_PLAYS_BLACK && !whiteTurn) {
        setTimeout(()=>aiMove(), 200);
    }
}

function updateTurnIndicator(){
    turnIndicator.textContent = "Turn: " + (whiteTurn?"White":"Black (AI)");
}

function addHistory(sr,sc,tr,tc,piece,captured){
    const file="abcdefgh"[sc];
    const rank=8-sr;
    const f2="abcdefgh"[tc];
    const r2=8-tr;
    const text = `${piece}: ${file}${rank} → ${f2}${r2}${captured?" x":""}`;
    const li = document.createElement("li");
    li.textContent = text;
    historyEl.appendChild(li);
}

/*****************************
 * RESET
 *****************************/
resetBtn.addEventListener("click", ()=>{
    initBoard();
    renderBoard();
    historyEl.innerHTML = "";
    whiteTurn = true;
    updateTurnIndicator();
});

/*****************************
 * PROMOTION
 *****************************/
function showPromotionModal(color, sr,sc,tr,tc) {
    promotionModal.classList.remove("hidden");
    promotionChoices.innerHTML = "";

    ["Q","R","B","N"].forEach(t=>{
        const div=document.createElement("div");
        div.textContent = PIECES[color==="w"?"white":"black"][t];
        div.onclick = ()=>{
            board[tr][tc] = color+t;
            board[sr][sc] = "";
            promotionModal.classList.add("hidden");
            renderBoard();

            whiteTurn = !whiteTurn;
            updateTurnIndicator();

            if (AI_PLAYS_BLACK && !whiteTurn) {
                setTimeout(()=>aiMove(), 200);
            }
        };
        promotionChoices.appendChild(div);
    });
}

/********************************************************************
 * AI — MINIMAX with POSITION EVALUATION
 ********************************************************************/
function aiMove() {
    const depth = 2;  // Increase for stronger AI (slower)
    const best = minimaxRoot(depth, false);
    if (!best) return;

    makeMove(best.sr, best.sc, best.tr, best.tc);
}

function minimaxRoot(depth, isWhiteTurn) {
    let bestMove=null;
    let bestValue=isWhiteTurn?-Infinity:Infinity;
    const moves=generateAllMoves(isWhiteTurn?"w":"b");

    for (const move of moves) {
        const snap = JSON.stringify(board);
        makeMoveSilent(move.sr, move.sc, move.tr, move.tc);
        const value = minimax(depth-1, -Infinity, Infinity, !isWhiteTurn);
        board = JSON.parse(snap);

        if (isWhiteTurn && value>bestValue) {
            bestValue=value;
            bestMove=move;
        }
        if (!isWhiteTurn && value<bestValue) {
            bestValue=value;
            bestMove=move;
        }
    }
    return bestMove;
}

function minimax(depth, alpha, beta, isWhiteTurn) {
    if (depth===0) return evaluate();

    const moves = generateAllMoves(isWhiteTurn?"w":"b");

    if (isWhiteTurn) {
        let maxEval=-Infinity;
        for (const move of moves) {
            const snap=JSON.stringify(board);
            makeMoveSilent(move.sr,move.sc,move.tr,move.tc);
            const val=minimax(depth-1,alpha,beta,false);
            board=JSON.parse(snap);

            maxEval=Math.max(maxEval,val);
            alpha=Math.max(alpha,val);
            if (beta<=alpha) break;
        }
        return maxEval;
    } else {
        let minEval=Infinity;
        for (const move of moves) {
            const snap=JSON.stringify(board);
            makeMoveSilent(move.sr,move.sc,move.tr,move.tc);
            const val=minimax(depth-1,alpha,beta,true);
            board=JSON.parse(snap);

            minEval=Math.min(minEval,val);
            beta=Math.min(beta,val);
            if (beta<=alpha) break;
        }
        return minEval;
    }
}

function evaluate() {
    const val = {K:900, Q:90, R:50, B:30, N:30, P:10};
    let score=0;
    for (let r=0;r<8;r++)
        for (let c=0;c<8;c++) {
            const p = board[r][c];
            if (!p) continue;
            const s = val[p[1]];
            score += p[0]==="w"?s:-s;
        }
    return score;
}

function generateAllMoves(color) {
    let moves=[];
    for (let r=0;r<8;r++)
        for (let c=0;c<8;c++)
            if (board[r][c] && board[r][c][0]===color)
                generateMoves(r,c).forEach(m=>moves.push({sr:r,sc:c,tr:m[0],tc:m[1]}));
    return moves;
}

function makeMoveSilent(sr,sc,tr,tc) {
    const p = board[sr][sc];
    board[tr][tc]=p;
    board[sr][sc]="";
}

/*****************************
 * START
 *****************************/
initBoard();
renderBoard();
updateTurnIndicator();
