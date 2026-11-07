import React from 'react'
import ReactDOM from 'react-dom/client'
import { I18nextProvider } from 'react-i18next'
import i18n from './i18n.js'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import './index.css'

// Polyfill Node.prototype.removeChild & insertBefore to prevent crashes from Google Translate DOM mutations
if (typeof window !== 'undefined' && typeof Node === 'function' && Node.prototype) {
  const originalRemoveChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function (child) {
    if (child && child.parentNode !== this) {
      return child;
    }
    return originalRemoveChild.apply(this, arguments);
  };

  const originalInsertBefore = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function (newNode, referenceNode) {
    if (referenceNode && referenceNode.parentNode !== this) {
      return newNode;
    }
    return originalInsertBefore.apply(this, arguments);
  };
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <I18nextProvider i18n={i18n}>
        <App />
      </I18nextProvider>
    </ErrorBoundary>
  </React.StrictMode>,
)
