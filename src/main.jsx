import React from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.jsx';
import PreferencesProvider from './components/PreferencesProvider.jsx';
import {readPreferences} from './i18n/messages.js';
import './styles/index.css';

try{const saved=readPreferences(localStorage);document.documentElement.lang=saved.language;document.documentElement.dataset.theme=saved.theme;}catch{}
createRoot(document.getElementById('root')).render(<PreferencesProvider><App/></PreferencesProvider>);
