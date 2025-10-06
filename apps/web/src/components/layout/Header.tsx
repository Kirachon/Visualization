import React from 'react';
import { AppBar, Toolbar, Typography, IconButton, Box, Tooltip } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import LogoutIcon from '@mui/icons-material/Logout';
import { useAuth } from '../../hooks/useAuth';

interface HeaderProps {
  onMenuToggle: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuToggle }) => {
  const { user, logout } = useAuth();

  return (
    <AppBar position="fixed" role="banner">
      <Toolbar>
        <IconButton
          color="inherit"
          aria-label="open navigation menu"
          edge="start"
          onClick={onMenuToggle}
          sx={{ mr: 2 }}
        >
          <MenuIcon />
        </IconButton>
        <Typography variant="h6" component="h1" sx={{ flexGrow: 1 }}>
          BI Platform
        </Typography>
        <Box aria-live="polite" aria-atomic="true" sx={{ mr: 2 }}>
          <Typography variant="body2">
            {user ? `${user.firstName} ${user.lastName}` : ''}
          </Typography>
        </Box>
        <Tooltip title="Sign out">
          <IconButton color="inherit" aria-label="sign out" onClick={logout}>
            <LogoutIcon />
          </IconButton>
        </Tooltip>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
