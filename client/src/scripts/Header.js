import React from 'react';
import '../styles/Header.css'; // link to CSS
import { Menu } from "lucide-react";

const Header = () => {
  return (
    <nav className="navbar">
      <div className="navbar-content">
        <h1 className="navbar-title">Insert Logo Here</h1>
      </div>
    </nav>
  );
};

export default Header;