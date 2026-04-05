import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
// import { register } from 'boneyard-js';
// import bones from './bones.js'; // Generated after running boneyard-js build

// if (bones) register(bones);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
