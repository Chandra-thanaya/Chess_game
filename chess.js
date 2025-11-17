// Unicode chess pieces for better visibility
const PIECES_UNICODE = {
  'P': '♙', 'R': '♖', 'N': '♘', 'B': '♗', 'Q': '♕', 'K': '♔',
  'p': '♟', 'r': '♜', 'n': '♞', 'b': '♝', 'q': '♛', 'k': '♚',
};

const boardEl = document.getElementById('chessboard');
const turnIndicator = document.getElementById('turnIndicator');
const resetBtn = document.getElementById('resetBtn');

let board = [];
let selectedSquare = null;
let validMoves = [];
let turn = 'w'; // 'w' for white, 'b' for black

// Initial chessboard setup using FEN notation style (simplified)
const initialBoardSetup = [
  ['r','n','b','q','k','b','n','r'],
  ['p','p','p','p','p','p','p','p'],
  ['','','','','','','',''],
  ['','','','','','','',''],
  ['','','','','','','',''],
  ['','','','','','','',''],
  ['P','P','P','P','P','P','P','P'],
  ['R','N','B','Q','K','B','N','R'],
];

// Utility function: check if coordinates are on board
function onBoard(r, c) {
  return r >= 0 && r < 8 && c >= 0 && c < 8;
}

// Initialize board state
function initBoard() {
  board = [];
  for(let r=0; r<8; r++) {
    board[r] = [];
    for(let c=0; c<8; c++) {
      board[r][c] = initialBoardSetup[r][c];
    }
  }
  turn = 'w';
  selectedSquare = null;
  validMoves = [];
  updateTurnIndicator();
  renderBoard();
}

// Render the chessboard grid and pieces
function renderBoard() {
  boardEl.innerHTML = '';
  for(let r=0; r<8; r++) {
    for(let c=0; c<8; c++) {
      const square = document.createElement('div');
      square.classList.add('square');
      square.classList.add((r + c) % 2 === 0 ? 'light' : 'dark');
      square.dataset.row = r;
      square.dataset.col = c;

      if (board[r][c]) {
        square.textContent = PIECES_UNICODE[board[r][c]];
      }

      // Highlight selected
      if (selectedSquare && selectedSquare[0] === r && selectedSquare[1] === c) {
        square.classList.add('selected');
      }

      // Highlight valid moves
      for (const m of validMoves) {
        if (m[0] === r && m[1] === c) {
          square.classList.add('valid-move');
          break;
        }
      }

      square.addEventListener('click', () => onSquareClick(r, c));

      boardEl.appendChild(square);
    }
  }
}

// Update turn display
function updateTurnIndicator() {
  turnIndicator.textContent = `Turn: ${turn === 'w' ? 'White' : 'Black'}`;
}

// Get piece color (lowercase = black, uppercase = white)
function pieceColor(piece) {
  if (!piece) return null;
  return piece === piece.toUpperCase() ? 'w' : 'b';
}

// Check if move is valid according to piece move rules
function getValidMoves(r, c) {
  const piece = board[r][c];
  if (!piece || pieceColor(piece) !== turn) return [];

  const moves = [];

  // Directions for sliding pieces
  const rookDirs = [[1,0],[-1,0],[0,1],[0,-1]];
  const bishopDirs = [[1,1],[1,-1],[-1,1],[-1,-1]];

  function addMovesInDirection(dirs) {
    for (const [dr, dc] of dirs) {
      let nr = r + dr;
      let nc = c + dc;
      while (onBoard(nr, nc)) {
        if (!board[nr][nc]) {
          moves.push([nr,nc]);
        } else {
          if (pieceColor(board[nr][nc]) !== turn) {
            moves.push([nr,nc]); // can capture enemy
          }
          break;
        }
        nr += dr;
        nc += dc;
      }
    }
  }

  switch(piece.toLowerCase()) {
    case 'p': {
      // Pawn moves
      let dir = (pieceColor(piece) === 'w') ? -1 : 1;
      // One step forward
      if (onBoard(r+dir, c) && !board[r+dir][c]) {
        moves.push([r+dir,c]);
        // Two steps if first move
        if ((r === 6 && dir === -1) || (r === 1 && dir === 1)) {
          if (!board[r + 2*dir][c]) moves.push([r + 2*dir,c]);
        }
      }
      // Captures
      for (const dc of [-1, 1]) {
        let nr = r + dir;
        let nc = c + dc;
        if (onBoard(nr,nc) && board[nr][nc] && pieceColor(board[nr][nc]) !== turn) {
          moves.push([nr,nc]);
        }
      }
      break;
    }
    case 'r': {
      addMovesInDirection(rookDirs);
      break;
    }
    case 'b': {
      addMovesInDirection(bishopDirs);
      break;
    }
    case 'q': {
      addMovesInDirection([...rookDirs, ...bishopDirs]);
      break;
    }
    case 'k': {
      // King moves one square in all directions
      const kingDirs = [...rookDirs, ...bishopDirs];
      for (const [dr, dc] of kingDirs) {
        let nr = r + dr;
        let nc = c + dc;
        if (onBoard(nr,nc)) {
          if (!board[nr][nc] || pieceColor(board[nr][nc]) !== turn) {
            moves.push([nr,nc]);
          }
        }
      }
      break;
    }
    case 'n': {
      // Knight moves (L shape)
      const knightMoves = [
        [-2, -1], [-2, 1],
        [-1, -2], [-1, 2],
        [1, -2], [1, 2],
        [2, -1], [2, 1]
      ];
      for (const [dr, dc] of knightMoves) {
        let nr = r + dr;
        let nc = c + dc;
        if (onBoard(nr,nc)) {
          if (!board[nr][nc] || pieceColor(board[nr][nc]) !== turn) {
            moves.push([nr,nc]);
          }
        }
      }
      break;
    }
  }

  return moves;
}

// Move piece and change turn
function makeMove(fromR, fromC, toR, toC) {
  board[toR][toC] = board[fromR][fromC];
  board[fromR][fromC] = '';

  // Switch turn
  turn = turn === 'w' ? 'b' : 'w';
  selectedSquare = null;
  validMoves = [];
  updateTurnIndicator();
  renderBoard();
}

// Handle clicking a square
function onSquareClick(r, c) {
  if (selectedSquare) {
    // If clicked a valid move
    if (validMoves.some(m => m[0] === r && m[1] === c)) {
      makeMove(selectedSquare[0], selectedSquare[1], r, c);
    } else {
      // Select new piece if it's player's turn and valid
      if (board[r][c] && pieceColor(board[r][c]) === turn) {
        selectedSquare = [r, c];
        validMoves = getValidMoves(r, c);
        renderBoard();
      } else {
        // Deselect if clicked invalid
        selectedSquare = null;
        validMoves = [];
        renderBoard();
      }
    }
  } else {
    // No piece selected: select if player's turn piece
    if (board[r][c] && pieceColor(board[r][c]) === turn) {
      selectedSquare = [r, c];
      validMoves = getValidMoves(r, c);
      renderBoard();
    }
  }
}

resetBtn.addEventListener('click', initBoard);

initBoard();
