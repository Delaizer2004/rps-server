import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Socket } from 'socket.io-client';

export type Choice = 'rock' | 'paper' | 'scissors';

export interface Player {
  id: string;
  name: string;
  choice: Choice | null;
  score: number;
}

interface GameState {
  socket: Socket | null;
  currentPlayer: Player;
  opponent: Player | null;
  gameStatus: 'waiting' | 'ready' | 'playing' | 'finished';
  result: string;
}

const initialState: GameState = {
  socket: null,
  currentPlayer: {
    id: '',
    name: '',
    choice: null,
    score: 0,
  },
  opponent: null,
  gameStatus: 'waiting',
  result: '',
};

// створення нового сокету без змін
const safeSetSocket = (state: GameState, action: PayloadAction<Socket | null>) => {
  return {
    ...state,
    socket: action.payload
  };
};

const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    setSocket: (state, action: PayloadAction<Socket | null>) => {
      // повна заміна сокету
      return {
        ...state,
        socket: action.payload
      };
    },
    setPlayerData: (state, action: PayloadAction<Player>) => {
      state.currentPlayer = action.payload;
    },
    setOpponent: (state, action: PayloadAction<Player | null>) => {
      state.opponent = action.payload;
    },
    setGameStatus: (state, action: PayloadAction<GameState['gameStatus']>) => {
      state.gameStatus = action.payload;
    },
    setResult: (state, action: PayloadAction<string>) => {
      state.result = action.payload;
    },
    makeChoice: (state, action: PayloadAction<Choice>) => {
      state.currentPlayer.choice = action.payload;
    },
    resetRound: (state) => {
      state.currentPlayer.choice = null;
      if (state.opponent) {
        state.opponent.choice = null;
      }
      state.result = '';
      state.gameStatus = 'playing';
    },
  },
});

export const {
  setSocket,
  setPlayerData,
  setOpponent,
  setGameStatus,
  setResult,
  makeChoice,
  resetRound,
} = gameSlice.actions;

export default gameSlice.reducer;