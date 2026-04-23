import { createBrowserRouter } from 'react-router-dom';
import { BoardsPage } from './features/boards/BoardsPage';
import { BoardPage } from './features/boards/BoardPage';

export const router = createBrowserRouter([
  { path: '/', element: <BoardsPage /> },
  { path: '/boards/:id', element: <BoardPage /> },
]);
