import React from 'react';
import loginLogo from '../elements/images/loginlogo.svg';
import '../styles/Header.css';

const Header = () => {
  return (
    <nav className="navbar">
      <div className="navbar-content">
        <img src={loginLogo} alt="Insert Logo Here" className='navbar-logo'/>
      </div>
    </nav>
  );
};

export default Header;