import * as React from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Link from '@mui/material/Link';
import {Link as RouterLink} from 'react-router-dom';
import { Avatar, IconButton, Stack } from '@mui/material';
import { blueGrey } from '@mui/material/colors';
import MenuItem from '@mui/material/MenuItem';
import Menu from '@mui/material/Menu';
import LogoutIcon from '@mui/icons-material/Logout';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts'; import ListItemText from '@mui/material/ListItemText';
import ListItemIcon from '@mui/material/ListItemIcon';
import DashboardIcon from '@mui/icons-material/Dashboard';


export default function CabbAppBar() {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };


  return (
    <AppBar position="static" 
      sx={{
        backgroundImage: 'url(/bigcat-app/line.png)',
        backgroundSize: '100%  74px',
        backgroundRepeat: 'no-repeat',
        height: '74px',
        justifyContent: 'center',
        paddingRight: '10px'
      }}>
      <Toolbar sx={{
        backgroundRepeat: 'no-repeat',
        width: '100%',
        padding: '0 !important',
        display: 'flex',
        justifyContent: 'space-between',
      }}>
        <a href="https://www.atnf.csiro.au/" title="ATNF Home" id="logo">
            <img src="/bigcat-app/logo.png" alt="Home"/>
        </a>
        <Link component={RouterLink} to="/" 
        underline="none" sx={{
          color: 'white',
          fontSize: '150%',
        }}
        >
          ATCA BIGCAT Scheduler
        </Link>

        <Stack direction={'row'} spacing={3}>
          <IconButton aria-label="dashboard" size="large"
            component={RouterLink} to="/"
            sx={{color: 'whitesmoke'}} >
            <DashboardIcon />
          </IconButton>

          <Avatar 
            onClick={handleMenu}
            sx={{ 
              fontSize: '150%',
              width: 50, height: 50,
              bgcolor: blueGrey[500],
              "&:hover": {
                cursor: 'pointer',
                bgcolor: blueGrey[100],
              }
            }}
          >
              XW
          </Avatar>
        </Stack>
        
        <Menu
          PaperProps={{ sx: {width: 200}}}
          id="menu-appbar"
          anchorEl={anchorEl}
          anchorOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          keepMounted
          transformOrigin={{
            vertical: -55,
            horizontal: 'right',
          }}
          open={Boolean(anchorEl)}
          onClose={handleClose}
        >
          <MenuItem onClick={handleClose}>
            <ListItemIcon>
              <ManageAccountsIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Profile</ListItemText>
          </MenuItem>

          <MenuItem onClick={handleClose}>
            <ListItemIcon>
              <LogoutIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Logout</ListItemText>
          </MenuItem>
        </Menu>

      </Toolbar>
    </AppBar>
  );
}