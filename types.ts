
export enum Player {
  BLACK = 'BLACK',
  WHITE = 'WHITE',
  EMPTY = 'EMPTY'
}

export type Board = Player[][];

export interface Position {
  r: number;
  c: number;
}

export interface GameState {
  board: Board;
  currentPlayer: Player;
  isGameOver: boolean;
  winner: Player | 'DRAW' | null;
  history: Board[];
}
