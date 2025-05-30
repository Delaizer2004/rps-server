import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Lobby: React.FC = () => {
  const [roomId, setRoomId] = useState('');
  const navigate = useNavigate();

  const createRoom = () => {
    const newRoomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    navigate(`/game/${newRoomId}`);
  };

  const joinRoom = () => {
    if (roomId.trim()) {
      navigate(`/game/${roomId.trim()}`);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '0 auto', padding: '20px', textAlign: 'center' }}>
      <h1>Камінь, ножиці, папір</h1>
      <button 
        onClick={createRoom}
        style={{ padding: '10px 20px', fontSize: '16px', margin: '10px 0' }}
      >
        Створити гру
      </button>
      <div style={{ margin: '20px 0' }}>
        <p>Або приєднатися до існуючої:</p>
        <input
          type="text"
          placeholder="Введіть код кімнати"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          style={{ padding: '8px', width: '100%', marginBottom: '10px' }}
        />
        <button 
          onClick={joinRoom}
          style={{ padding: '10px 20px', fontSize: '16px' }}
        >
          Приєднатися
        </button>
      </div>
    </div>
  );
};

export default Lobby;