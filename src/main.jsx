import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, HashRouter } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import App from './App';
import './styles.css';

const directFile = window.location.protocol === 'file:';
if (directFile && window.location.hash && !window.location.hash.startsWith('#/')) {
  window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}#/`);
}
const Router = directFile ? HashRouter : BrowserRouter;

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode><Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><AppProvider><App /></AppProvider></Router></React.StrictMode>,
);
