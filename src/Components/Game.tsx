import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import {
  setSocket,
  setPlayerData,
  setOpponent,
  setGameStatus,
  setResult,
  makeChoice as makeChoiceAction,
  resetRound
} from '../redux/slices/gameSlice';
import { Player, Choice } from '../redux/slices/gameSlice';

const Game: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  
  const {
    socket,
    currentPlayer,
    opponent,
    gameStatus,
    result
  } = useAppSelector((state) => state.game);

  // Додаємо в початку компоненту Game:
  useEffect(() => {
    const playerName = localStorage.getItem('rps-player-name');
    
    if (!playerName) {
      navigate('/register'); // Перенаправлення на реєстрацію, якщо ім'я відсутнє
      return;
    }

    // Використання даних з форми
    const playerData = {
      name: playerName,
    };
  }, [navigate]);

  useEffect(() => {
    const serverUrl = process.env.NODE_ENV === 'production'
      ? 'https://your-vercel-app.vercel.app'
      : 'http://localhost:3000';

    const newSocket = io(serverUrl, {
      path: '/api/socket',
      transports: ['websocket'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });
    dispatch(setSocket(newSocket));

    let playerName = localStorage.getItem('rps-player-name');
    if (!playerName) {
      playerName = prompt('Введіть ваше імʼя:') || 'Гравець';
      localStorage.setItem('rps-player-name', playerName);
    }

    newSocket.emit('joinRoom', { roomId, playerName });

    newSocket.on('playerData', (data: Player & { isPlayer1: boolean }) => {
      dispatch(setPlayerData({
        id: data.id,
        name: data.name,
        choice: null,
        score: 0
      }));
    });

    newSocket.on('gameReady', (data: { 
      currentPlayer: Player; 
      opponent: Player;
      isPlayer1: boolean;
    }) => {
      dispatch(setPlayerData(data.currentPlayer));
      dispatch(setOpponent(data.opponent));
      dispatch(setGameStatus('ready'));
      setTimeout(() => dispatch(setGameStatus('playing')), 1000);
    });

    newSocket.on('opponentChoice', (choice: Choice) => {
      dispatch(setOpponent({ ...opponent!, choice }));
    });

    newSocket.on('gameResult', (data: {
      result: 'win' | 'lose' | 'draw';
      currentPlayer: Player;
      opponent: Player;
    }) => {
      dispatch(setPlayerData(data.currentPlayer));
      dispatch(setOpponent(data.opponent));
      dispatch(setResult(
        data.result === 'win' ? 'Ви перемогли!' :
        data.result === 'lose' ? 'Ви програли!' : 'Нічия!'
      ));
      dispatch(setGameStatus('finished'));
    });

    newSocket.on('opponentDisconnected', () => {
      alert('Опонент покинув гру');
      navigate('/');
    });

    newSocket.on('roomFull', () => {
      alert('Кімната вже заповнена!');
      navigate('/');
    });

    return () => {
      newSocket.disconnect();
      dispatch(setSocket(null));
    };
  }, [roomId, navigate, dispatch]);

  const handleMakeChoice = (choice: Choice) => {
    if (!socket || gameStatus !== 'playing') return;
    
    dispatch(makeChoiceAction(choice));
    socket.emit('makeChoice', { roomId, choice });
  };

  const handlePlayAgain = () => {
    if (!socket) return;
    
    dispatch(resetRound());
    socket.emit('playAgain', { roomId });
  };

  return (
    <div style={{ 
      padding: '20px', 
      maxWidth: '600px', 
      margin: '0 auto',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{ textAlign: 'center' }}>Камінь, ножиці, папір</h1>
      <p style={{ textAlign: 'center', fontWeight: 'bold' }}>Кімната: {roomId}</p>
      
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        margin: '20px 0'
      }}>
        <div style={{ 
          border: '1px solid #ccc', 
          padding: '15px', 
          borderRadius: '8px',
          flex: 1,
          marginRight: '10px',
          backgroundColor: '#e6f7ff'
        }}>
          <h2 style={{ marginTop: 0 }}>{currentPlayer.name} (Ви)</h2>
          <p>Рахунок: <strong>{currentPlayer.score}</strong></p>
          {/* {currentPlayer.choice && <p>Останній вибір: <strong>{currentPlayer.choice}</strong></p>} */}
        </div>
        
        {opponent && (
          <div style={{ 
            border: '1px solid #ccc', 
            padding: '15px', 
            borderRadius: '8px',
            flex: 1,
            marginLeft: '10px',
            backgroundColor: '#f9f9f9'
          }}>
            <h2 style={{ marginTop: 0 }}>{opponent.name}</h2>
            <p>Рахунок: <strong>{opponent.score}</strong></p>
            {/* {opponent.choice && <p>Останній вибір: <strong>{opponent.choice}</strong></p>} */}
          </div>
        )}
      </div>
      
      {gameStatus === 'waiting' && (
        <div style={{ 
          marginTop: '30px',
          padding: '20px',
          border: '1px dashed #ccc',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <p>Очікування іншого гравця...</p>
          <p>Дайте цей код другу:</p>
          <div style={{
            fontSize: '24px',
            fontWeight: 'bold',
            letterSpacing: '2px',
            margin: '10px 0',
            padding: '10px',
            backgroundColor: '#f0f0f0',
            borderRadius: '5px'
          }}>
            {roomId}
          </div>
        </div>
      )}
      
      {gameStatus === 'playing' && !currentPlayer.choice && (
        <div style={{ 
          marginTop: '30px',
          textAlign: 'center'
        }}>
          <h3 style={{ marginBottom: '15px' }}>Зробіть ваш вибір:</h3>
          <div style={{ 
            display: 'flex',
            justifyContent: 'center',
            gap: '15px'
          }}>
            <button 
              onClick={() => handleMakeChoice('rock')}
              style={{
                padding: '10px 20px',
                fontSize: '16px',
                backgroundColor: '#e74c3c',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              Камінь
            </button>
            <button 
              onClick={() => handleMakeChoice('paper')}
              style={{
                padding: '10px 20px',
                fontSize: '16px',
                backgroundColor: '#3498db',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              Папір
            </button>
            <button 
              onClick={() => handleMakeChoice('scissors')}
              style={{
                padding: '10px 20px',
                fontSize: '16px',
                backgroundColor: '#2ecc71',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              Ножиці
            </button>
          </div>
        </div>
      )}
      
      {gameStatus === 'playing' && currentPlayer.choice && (
        <div style={{ 
          marginTop: '30px',
          textAlign: 'center',
          padding: '20px',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px'
        }}>
          <p>Ви обрали: <strong>{currentPlayer.choice}</strong></p>
          <p>Очікування ходу опонента...</p>
        </div>
      )}
      
      {gameStatus === 'finished' && (
        <div style={{ 
          marginTop: '30px',
          textAlign: 'center',
          padding: '20px',
          backgroundColor: result.includes('перемогли') ? '#d4edda' : 
                         result.includes('програли') ? '#f8d7da' : '#e2e3e5',
          borderRadius: '8px'
        }}>
          <h2 style={{ 
            color: result.includes('перемогли') ? '#155724' : 
                  result.includes('програли') ? '#721c24' : '#383d41'
          }}>
            {result}
          </h2>
          <button 
            onClick={handlePlayAgain}
            style={{
              padding: '10px 25px',
              fontSize: '16px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              marginTop: '15px'
            }}
          >
            Грати ще раз
          </button>
        </div>
      )}
    </div>
  );
};

export default Game;