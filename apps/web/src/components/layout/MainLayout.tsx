import React, { useState } from 'react';
import { Box, Toolbar } from '@mui/material';
import Header from './Header';
import Sidebar from './Sidebar';
import SessionTimeout from '../common/SessionTimeout';

const drawerWidth = 240;

const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [open, setOpen] = useState(true);

  const handleToggle = () => setOpen((o) => !o);

  return (
    <Box sx={{ display: 'flex' }}>
      <Header onMenuToggle={handleToggle} />
      <Sidebar open={open} onClose={() => setOpen(false)} />
      <Box component="main" sx={{ flexGrow: 1, p: 3, ml: open ? `${drawerWidth}px` : 0 }}>
        <Toolbar />
        <SessionTimeout />
        {children}
      </Box>
    </Box>
  );
};

export default MainLayout;
