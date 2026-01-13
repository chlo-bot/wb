
import { GoogleGenAI, Type } from "@google/genai";
import { Board, Player, Position } from './types';

export const getGeminiMove = async (board: Board, player: Player, validMoves: Position[]): Promise<Position | null> => {
  if (validMoves.length === 0) return null;
  if (validMoves.length === 1) return validMoves[0];

  // 每次呼叫時初始化，以確保獲取最新的 API_KEY 環境變數
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.warn("API_KEY not found. Falling back to basic strategy.");
    return fallbackStrategy(validMoves);
  }

  const ai = new GoogleGenAI({ apiKey });

  const boardStr = board.map(row => row.map(cell => cell === Player.BLACK ? 'B' : cell === Player.WHITE ? 'W' : '.').join('')).join('\n');
  const movesStr = validMoves.map((m, i) => `(${m.r},${m.c})`).join(', ');

  const prompt = `
    You are an expert Othello (Reversi) player. 
    Current Board (B=Black, W=White, .=Empty):
    ${boardStr}
    
    Current Player: ${player}
    Valid Moves (row, column): ${movesStr}
    
    Instructions:
    1. Analyze the board state.
    2. Consider corner positions (0,0), (0,7), (7,0), (7,7) as high priority.
    3. Avoid positions next to corners (C-squares and X-squares) unless you own the corner.
    4. Focus on mobility and stability.
    5. Choose the best move from the Valid Moves list.
    
    Return ONLY the chosen move as a JSON object with properties 'r' and 'c'.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            r: { type: Type.INTEGER },
            c: { type: Type.INTEGER }
          },
          required: ["r", "c"]
        }
      }
    });

    const result = JSON.parse(response.text || '{}');
    const isValid = validMoves.some(m => m.r === result.r && m.c === result.c);
    return isValid ? result : validMoves[0];
  } catch (error) {
    console.error("Gemini AI failed:", error);
    return fallbackStrategy(validMoves);
  }
};

function fallbackStrategy(validMoves: Position[]): Position {
  const corners = validMoves.filter(m => (m.r === 0 || m.r === 7) && (m.c === 0 || m.c === 7));
  return corners.length > 0 ? corners[0] : validMoves[0];
}
