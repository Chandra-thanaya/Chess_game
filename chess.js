const board = document.getElementById('board');
const turnIndicator = document.getElementById('turnIndicator');
const resetBtn = document.getElementById('resetBtn');
const historyList = document.getElementById('historyList');
const modeSelect = document.getElementById('modeSelect');

const piecesSymbols = {
  'K': '♔', 'Q': '♕', 'R': '♖', 'B': '♗', 'N': '♘', 'P': '♙',
  'k': '♚', 'q': '♛', 'r': '♜', 'b': '♝', 'n': '♞', 'p': '♟',
};

let boardState = [];
let turn = 'w'; // 'w' or 'b'
let selectedSquare = null;
let validMoves = [];
let moveHistory = [];
let gameMode = 'human-vs-ai';  // default mode

function createInitialBoard() {
  return [
    ['r','n','b','q','k','b','n','r'],
    ['p','p','p','p','p','p','p','p'],
    ['','','','','','','',''],
    ['','','','','','','',''],
    ['','','','','','','',''],
    ['','','','','','','',''],
    ['P','P','P','P','P','P','P','P'],
    ['R','N','B','Q','K','B','N','R'],
  ];
}

function renderBoard() {
  board.innerHTML = '';
  for(let i=0; i<8; i++) {
    for(let j=0; j<8; j++) {
      const sq = document.createElement('div');
      sq.classList.add((i + j) % 2 === 0 ? 'light' : 'dark');
      sq.dataset.row = i;
      sq.dataset.col = j;

      const piece = boardState[i][j];
      sq.innerHTML = piece ? `<span class="piece ${piece === piece.toUpperCase() ? 'white' : 'black'}">${piecesSymbols[piece]}</span>` : '';

      if(selectedSquare && i === selectedSquare[0] && j === selectedSquare[1]) {
        sq.classList.add('highlight');
      }
      if(validMoves.some(m => m[0] === i && m[1] === j)) {
        sq.classList.add('highlight');
      }

      sq.addEventListener('click', () => onSquareClick(i, j));
      board.appendChild(sq);
    }
  }
}

function onSquareClick(row, col) {
  if(selectedSquare) {
    // Try to move if clicked on valid move
    if(validMoves.some(m => m[0] === row && m[1] === col)) {
      movePiece(selectedSquare, [row, col]);
      selectedSquare = null;
      validMoves = [];
      renderBoard();
      updateTurn();
      renderHistory();

      if(gameMode === 'human-vs-ai' && turn === 'b') {
        setTimeout(aiMove, 300);
      }
      return;
    } else {
      selectedSquare = null;
      validMoves = [];
      renderBoard();
    }
  }

  // Select piece if player's turn and valid piece
  if(boardState[row][col] && isCurrentPlayersPiece(row, col)) {
    selectedSquare = [row, col];
    validMoves = calculateValidMoves(row, col);
    renderBoard();
  }
}

function isCurrentPlayersPiece(row, col) {
  const p = boardState[row][col];
  if(!p) return false;

  if(gameMode === 'human-vs-human') {
    // Both players human - just check turn matches piece color
    return (turn === 'w' && p === p.toUpperCase()) || (turn === 'b' && p === p.toLowerCase());
  } else {
    // Human vs AI - human always plays White
    if(turn === 'w') {
      return p === p.toUpperCase();
    } else {
      // black is AI
      return false;
    }
  }
}

function calculateValidMoves(row, col) {
  const moves = [];
  const p = boardState[row][col];
  if(!p) return moves;

  const isWhite = p === p.toUpperCase();

  if(p.toLowerCase() === 'p') {
    // Pawn move
    const dir = isWhite ? -1 : 1;
    if(isInBounds(row + dir, col) && !boardState[row + dir][col]) {
      moves.push([row + dir, col]);
    }
    // capture diagonals
    if(isInBounds(row + dir, col + 1) && boardState[row + dir][col + 1] && isOpponentPiece(row + dir, col + 1, isWhite)) {
      moves.push([row + dir, col + 1]);
    }
    if(isInBounds(row + dir, col - 1) && boardState[row + dir][col - 1] && isOpponentPiece(row + dir, col - 1, isWhite)) {
      moves.push([row + dir, col - 1]);
    }
  } else if(p.toLowerCase() === 'n') {
    // Knight moves
    const knightMoves = [
      [row+2, col+1],[row+2, col-1],[row-2, col+1],[row-2, col-1],
      [row+1, col+2],[row+1, col-2],[row-1, col+2],[row-1, col-2]
    ];
    for(const [r,c] of knightMoves) {
      if(isInBounds(r,c) && (!boardState[r][c] || isOpponentPiece(r,c,isWhite))) {
        moves.push([r,c]);
      }
    }
  } else {
    // King moves (1 square any direction)
    const kingDirs = [
      [1,0],[-1,0],[0,1],[0,-1],
      [1,1],[-1,-1],[1,-1],[-1,1]
    ];
    for(const [dr, dc] of kingDirs) {
      const nr = row + dr;
      const nc = col + dc;
      if(isInBounds(nr, nc) && (!boardState[nr][nc] || isOpponentPiece(nr,nc,isWhite))) {
        moves.push([nr,nc]);
      }
    }
  }
  return moves;
}

function isInBounds(r,c) {
  return r >= 0 && r < 8 && c >= 0 && c < 8;
}

function isOpponentPiece(r,c,isWhite) {
  const p = boardState[r][c];
  if(!p) return false;
  return isWhite ? (p === p.toLowerCase()) : (p === p.toUpperCase());
}

function movePiece(from, to) {
  const [fr, fc] = from;
  const [tr, tc] = to;
  const piece = boardState[fr][fc];
  const captured = boardState[tr][tc];

  boardState[tr][tc] = piece;
  boardState[fr][fc] = '';

  moveHistory.push(`${piece}${String.fromCharCode(97+fc)}${8-fr} → ${String.fromCharCode(97+tc)}${8-tr}${captured ? ' x' : ''}`);
}

function updateTurn() {
  turn = turn === 'w' ? 'b' : 'w';
  turnIndicator.textContent = `Turn: ${turn === 'w' ? 'White' : 'Black'}`;
}

function renderHistory() {
  historyList.innerHTML = '';
  for(let i = 0; i < moveHistory.length; i++) {
    const li = document.createElement('li');
    li.textContent = moveHistory[i];
    historyList.appendChild(li);
  }
  historyList.scrollTop = historyList.scrollHeight;
}

// Simple AI: random valid move for black
function aiMove() {
  if(turn !== 'b' || gameMode !== 'human-vs-ai') return;
  let allMoves = [];
  for(let r=0; r<8; r++) {
    for(let c=0; c<8; c++) {
      if(boardState[r][c] && boardState[r][c] === boardState[r][c].toLowerCase()) {
        const moves = calculateValidMoves(r,c);
        moves.forEach(mv => allMoves.push({from: [r,c], to: mv}));
      }
    }
  }
  if(allMoves.length === 0) {
    alert('Game over: White wins!');
    return;
  }
  const choice = allMoves[Math.floor(Math.random() * allMoves.length)];
  movePiece(choice.from, choice.to);
  updateTurn();
  renderBoard();
  renderHistory();
}

resetBtn.addEventListener('click', () => {
  boardState = createInitialBoard();
  turn = 'w';
  selectedSquare = null;
  validMoves = [];
  moveHistory = [];
  turnIndicator.textContent = 'Turn: White';
  renderBoard();
  renderHistory();
});

modeSelect.addEventListener('change', () => {
  gameMode = modeSelect.value;
  resetBtn.click();  // reset game on mode change
});

// Initialize
boardState = createInitialBoard();
renderBoard();
renderHistory();
