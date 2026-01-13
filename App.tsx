
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Player, Board, GameState, Position } from './types';
import { INITIAL_BOARD, isValidMove, getValidMoves, makeMove, countPieces } from './logic';
import { getGeminiMove } from './geminiService';
import { Trophy, RefreshCcw, User, Cpu, ChevronLeft, BrainCircuit } from 'lucide-react';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    board: INITIAL_BOARD,
    currentPlayer: Player.BLACK,
    isGameOver: false,
    winner: null,
    history: [INITIAL_BOARD],
  });

  const [aiThinking, setAiThinking] = useState(false);
  const [vsAI, setVsAI] = useState(true);
  const [showValidMoves, setShowValidMoves] = useState(true);

  const scores = useMemo(() => countPieces(gameState.board), [gameState.board]);
  const validMoves = useMemo(() => getValidMoves(gameState.board, gameState.currentPlayer), [gameState.board, gameState.currentPlayer]);

  const handleCellClick = (r: number, c: number) => {
    if (gameState.isGameOver || aiThinking) return;
    if (vsAI && gameState.currentPlayer === Player.WHITE) return;

    if (isValidMove(gameState.board, r, c, gameState.currentPlayer)) {
      executeMove(r, c);
    }
  };

  const executeMove = useCallback((r: number, c: number) => {
    setGameState(prev => {
      const nextBoard = makeMove(prev.board, r, c, prev.currentPlayer);
      const nextPlayer = prev.currentPlayer === Player.BLACK ? Player.WHITE : Player.BLACK;
      
      const nextValidMoves = getValidMoves(nextBoard, nextPlayer);
      
      if (nextValidMoves.length === 0) {
        // Current player has no moves, check if other player has moves
        const otherPlayerValidMoves = getValidMoves(nextBoard, prev.currentPlayer);
        if (otherPlayerValidMoves.length === 0) {
          // Game Over
          const finalScores = countPieces(nextBoard);
          let winner: Player | 'DRAW' | null = null;
          if (finalScores.black > finalScores.white) winner = Player.BLACK;
          else if (finalScores.white > finalScores.black) winner = Player.WHITE;
          else winner = 'DRAW';
          
          return {
            ...prev,
            board: nextBoard,
            isGameOver: true,
            winner,
            history: [...prev.history, nextBoard]
          };
        } else {
          // Skip turn
          return {
            ...prev,
            board: nextBoard,
            currentPlayer: prev.currentPlayer, // Switch back
            history: [...prev.history, nextBoard]
          };
        }
      }

      return {
        ...prev,
        board: nextBoard,
        currentPlayer: nextPlayer,
        history: [...prev.history, nextBoard]
      };
    });
  }, []);

  // AI Turn Effect
  useEffect(() => {
    if (vsAI && gameState.currentPlayer === Player.WHITE && !gameState.isGameOver) {
      const performAiMove = async () => {
        setAiThinking(true);
        // Add a slight delay for realism
        await new Promise(res => setTimeout(res, 800));
        
        const move = await getGeminiMove(gameState.board, Player.WHITE, validMoves);
        if (move) {
          executeMove(move.r, move.c);
        }
        setAiThinking(false);
      };
      performAiMove();
    }
  }, [gameState.currentPlayer, gameState.isGameOver, vsAI, validMoves, executeMove, gameState.board]);

  const resetGame = () => {
    setGameState({
      board: INITIAL_BOARD,
      currentPlayer: Player.BLACK,
      isGameOver: false,
      winner: null,
      history: [INITIAL_BOARD],
    });
    setAiThinking(false);
  };

  const undoMove = () => {
    if (gameState.history.length <= 1 || aiThinking) return;
    setGameState(prev => {
      const newHistory = [...prev.history];
      newHistory.pop(); // Remove current
      // If vs AI, undo twice to get back to user turn
      if (vsAI && newHistory.length > 1) {
        newHistory.pop();
      }
      const lastBoard = newHistory[newHistory.length - 1];
      return {
        ...prev,
        board: lastBoard,
        currentPlayer: Player.BLACK,
        isGameOver: false,
        winner: null,
        history: newHistory
      };
    });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-900 text-slate-100">
      <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Sidebar: Controls & Info */}
        <div className="flex flex-col gap-6 order-2 lg:order-1">
          <div className="bg-slate-800 p-6 rounded-2xl shadow-xl border border-slate-700">
            <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              Othello AI
            </h1>
            <p className="text-slate-400 text-sm mb-6">Master the corners, flip the board.</p>
            
            <div className="space-y-4">
              <button 
                onClick={() => setVsAI(!vsAI)}
                className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${vsAI ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' : 'bg-slate-700/50 border-slate-600'}`}
              >
                <span className="flex items-center gap-2">
                  <Cpu size={20} /> VS Gemini AI
                </span>
                <div className={`w-10 h-5 rounded-full relative transition-colors ${vsAI ? 'bg-emerald-500' : 'bg-slate-600'}`}>
                  <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${vsAI ? 'left-6' : 'left-1'}`} />
                </div>
              </button>

              <button 
                onClick={() => setShowValidMoves(!showValidMoves)}
                className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${showValidMoves ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-400' : 'bg-slate-700/50 border-slate-600'}`}
              >
                <span className="flex items-center gap-2">
                  <BrainCircuit size={20} /> Hint Moves
                </span>
                <div className={`w-10 h-5 rounded-full relative transition-colors ${showValidMoves ? 'bg-cyan-500' : 'bg-slate-600'}`}>
                  <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${showValidMoves ? 'left-6' : 'left-1'}`} />
                </div>
              </button>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-4">
              <button onClick={resetGame} className="flex flex-col items-center gap-2 p-3 bg-slate-700 hover:bg-slate-600 rounded-xl transition-colors">
                <RefreshCcw size={20} />
                <span className="text-xs font-medium">Reset</span>
              </button>
              <button onClick={undoMove} className="flex flex-col items-center gap-2 p-3 bg-slate-700 hover:bg-slate-600 rounded-xl transition-colors">
                <ChevronLeft size={20} />
                <span className="text-xs font-medium">Undo</span>
              </button>
            </div>
          </div>

          <div className="bg-slate-800 p-6 rounded-2xl shadow-xl border border-slate-700">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Trophy size={20} className="text-amber-400" /> Leaderboard
            </h2>
            <div className="flex justify-around items-center py-4">
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-full bg-black border-2 border-slate-600 flex items-center justify-center shadow-lg">
                  <User size={24} className="text-white" />
                </div>
                <span className="text-2xl font-bold">{scores.black}</span>
                <span className="text-xs text-slate-400">Black (You)</span>
              </div>
              <div className="h-12 w-px bg-slate-700" />
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center shadow-lg">
                  {vsAI ? <Cpu size={24} className="text-slate-900" /> : <User size={24} className="text-slate-900" />}
                </div>
                <span className="text-2xl font-bold">{scores.white}</span>
                <span className="text-xs text-slate-400">White {vsAI ? '(AI)' : '(P2)'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Center: Game Board */}
        <div className="lg:col-span-2 flex flex-col items-center order-1 lg:order-2">
          {/* Status Bar */}
          <div className="w-full mb-4 px-2 flex items-center justify-between">
            <div className={`flex items-center gap-3 px-4 py-2 rounded-full transition-all border ${gameState.currentPlayer === Player.BLACK ? 'bg-black text-white border-slate-600 scale-105 shadow-lg' : 'bg-slate-800 text-slate-400 border-transparent'}`}>
              <div className="w-3 h-3 rounded-full bg-white animate-pulse" style={{ display: gameState.currentPlayer === Player.BLACK ? 'block' : 'none' }} />
              <span className="font-bold tracking-wider">BLACK'S TURN</span>
            </div>
            
            <div className="text-slate-500 font-mono text-sm">
              {aiThinking ? <span className="flex items-center gap-2 text-cyan-400"><Cpu size={14} className="animate-spin" /> Gemini is thinking...</span> : "Ready"}
            </div>

            <div className={`flex items-center gap-3 px-4 py-2 rounded-full transition-all border ${gameState.currentPlayer === Player.WHITE ? 'bg-white text-slate-900 border-slate-200 scale-105 shadow-lg' : 'bg-slate-800 text-slate-400 border-transparent'}`}>
              <div className="w-3 h-3 rounded-full bg-slate-900 animate-pulse" style={{ display: gameState.currentPlayer === Player.WHITE ? 'block' : 'none' }} />
              <span className="font-bold tracking-wider">WHITE'S TURN</span>
            </div>
          </div>

          <div className="othello-board w-full max-w-[600px] rounded-lg overflow-hidden relative">
            {gameState.board.map((row, r) => (
              row.map((cell, c) => {
                const isPossible = showValidMoves && validMoves.some(m => m.r === r && m.c === c);
                return (
                  <div 
                    key={`${r}-${c}`} 
                    className={`cell ${isPossible ? 'valid-move' : ''}`}
                    onClick={() => handleCellClick(r, c)}
                  >
                    {cell !== Player.EMPTY && (
                      <div className={`piece ${cell === Player.BLACK ? 'black' : 'white'}`} />
                    )}
                  </div>
                );
              })
            ))}

            {/* Game Over Overlay */}
            {gameState.isGameOver && (
              <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in duration-500">
                <Trophy size={64} className="text-amber-400 mb-4 animate-bounce" />
                <h2 className="text-4xl font-black mb-2 text-white">
                  {gameState.winner === 'DRAW' ? "It's a Draw!" : `${gameState.winner} Wins!`}
                </h2>
                <div className="text-xl text-slate-300 mb-8">
                  {scores.black} - {scores.white}
                </div>
                <button 
                  onClick={resetGame}
                  className="px-8 py-3 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-full transition-all transform hover:scale-105 shadow-xl"
                >
                  Play Again
                </button>
              </div>
            )}
          </div>
          
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {['A','B','C','D','E','F','G','H'].map(label => (
              <div key={label} className="w-12 text-center text-slate-500 font-mono font-bold text-xs uppercase">{label}</div>
            ))}
          </div>
        </div>
      </div>

      <footer className="mt-12 text-slate-500 text-xs flex flex-col items-center gap-2">
        <p>© 2024 Othello AI Master | Powered by Google Gemini</p>
        <div className="flex gap-4">
          <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500" /> Strategy Engine v2.0</span>
          <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-cyan-500" /> Real-time Processing</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
