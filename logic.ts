
import { Board, Player, Position } from './types';

export const INITIAL_BOARD: Board = Array(8).fill(null).map(() => Array(8).fill(Player.EMPTY));
INITIAL_BOARD[3][3] = Player.WHITE;
INITIAL_BOARD[3][4] = Player.BLACK;
INITIAL_BOARD[4][3] = Player.BLACK;
INITIAL_BOARD[4][4] = Player.WHITE;

const DIRECTIONS = [
  [-1, -1], [-1, 0], [-1, 1],
  [0, -1],           [0, 1],
  [1, -1],  [1, 0],  [1, 1]
];

export const isValidMove = (board: Board, r: number, c: number, player: Player): boolean => {
  if (board[r][c] !== Player.EMPTY) return false;

  const opponent = player === Player.BLACK ? Player.WHITE : Player.BLACK;

  for (const [dr, dc] of DIRECTIONS) {
    let nr = r + dr;
    let nc = c + dc;
    let hasOpponentBetween = false;

    while (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
      if (board[nr][nc] === opponent) {
        hasOpponentBetween = true;
      } else if (board[nr][nc] === player) {
        if (hasOpponentBetween) return true;
        break;
      } else {
        break;
      }
      nr += dr;
      nc += dc;
    }
  }

  return false;
};

export const getValidMoves = (board: Board, player: Player): Position[] => {
  const moves: Position[] = [];
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (isValidMove(board, r, c, player)) {
        moves.push({ r, c });
      }
    }
  }
  return moves;
};

export const makeMove = (board: Board, r: number, c: number, player: Player): Board => {
  const newBoard = board.map(row => [...row]);
  newBoard[r][c] = player;

  const opponent = player === Player.BLACK ? Player.WHITE : Player.BLACK;

  for (const [dr, dc] of DIRECTIONS) {
    let nr = r + dr;
    let nc = c + dc;
    const piecesToFlip: Position[] = [];

    while (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
      if (newBoard[nr][nc] === opponent) {
        piecesToFlip.push({ r: nr, c: nc });
      } else if (newBoard[nr][nc] === player) {
        for (const p of piecesToFlip) {
          newBoard[p.r][p.c] = player;
        }
        break;
      } else {
        break;
      }
      nr += dr;
      nc += dc;
    }
  }

  return newBoard;
};

export const countPieces = (board: Board) => {
  let black = 0;
  let white = 0;
  for (const row of board) {
    for (const cell of row) {
      if (cell === Player.BLACK) black++;
      if (cell === Player.WHITE) white++;
    }
  }
  return { black, white };
};
