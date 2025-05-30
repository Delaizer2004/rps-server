import { JSX } from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const playerName = localStorage.getItem('rps-player-name');
  
  if (!playerName) {
    return <Navigate to="/register" replace />;
  }

  return children;
};

export default ProtectedRoute;