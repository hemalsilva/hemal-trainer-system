import React from 'react'
import ReactDOM from 'react-dom/client'
import axios from 'axios'

if (window.location.protocol === 'file:' || window.location.hostname === 'localhost') {
  axios.defaults.baseURL = 'http://localhost:5000';
} else {
  axios.defaults.baseURL = 'https://hemal-trainer-backend.onrender.com';
}
import App from './App.jsx';
import ErrorBoundary from './ErrorBoundary.jsx';
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary><App /></ErrorBoundary>
  </React.StrictMode>,
)
