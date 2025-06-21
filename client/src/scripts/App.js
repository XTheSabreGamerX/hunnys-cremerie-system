import React from 'react';
import Header from '../scripts/Header';
import Login from '../pages/Login';
import Footer from '../scripts/Footer'

function App() {
  console.log("App component is rendering");
  return (
    <div>
      <Header />
      <Login />
      <Footer />
    </div>
  );
}

export default App;