import React from 'react';
<<<<<<< HEAD
import loginLogo from '../elements/images/loginlogo.svg';
import '../styles/Header.css';
=======
import '../styles/Header.css'; // link to CSS
import { Menu } from "lucide-react";
>>>>>>> origin/mobile-ui

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