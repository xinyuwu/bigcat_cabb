import * as React from 'react';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import ListItemIcon from '@mui/material/ListItemText';
import ViewWeekIcon from '@mui/icons-material/ViewWeek';
import TuneIcon from '@mui/icons-material/Tune';
import BlurCircularIcon from '@mui/icons-material/BlurCircular';
import TableViewIcon from '@mui/icons-material/TableView';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';

import KeyboardDoubleArrowRightIcon from '@mui/icons-material/KeyboardDoubleArrowRight';
import KeyboardDoubleArrowLeftIcon from '@mui/icons-material/KeyboardDoubleArrowLeft';
import DriveFileMoveOutlinedIcon from '@mui/icons-material/DriveFileMoveOutlined';

import { useLocation, useNavigate } from 'react-router-dom';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { ProjectContext } from '../schedule/ProjectContext';
import { Divider, FormControlLabel, Stack, Switch } from '@mui/material';


export default function NavigationMenu() {
  const navigate = useNavigate();
  const location = useLocation();
  const projectContext = React.useContext(ProjectContext);

  const [expandMenu, setExpandMenu] = React.useState(false);
  const [scheduleAnchorEl, setScheduleAnchorEl] = React.useState<null | HTMLElement>(null);

  const [settingAnchorEl, setSettingAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleScheduleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setScheduleAnchorEl(event.currentTarget);
  };

  const handleSettingMenu = (event: React.MouseEvent<HTMLElement>) => {
    setSettingAnchorEl(event.currentTarget);
  };
  const closeScheduleMenu = () => {
    setScheduleAnchorEl(null);
  };

  const closeSettingMenu = () => {
    setSettingAnchorEl(null);
  };

  const toggleExpandMenu = () => {
    setExpandMenu(!expandMenu);
    window.dispatchEvent(new Event("resize"));
  }

  const gotoPage = (route: string, filename: string) => {
    setScheduleAnchorEl(null);
    const query = new URLSearchParams(location.search);
    const project = query.get('project') ? query.get('project') : '';

    let fullroute = `${route}?project=${encodeURIComponent(project!)}`;
    if (filename) {
      fullroute += `&file=${filename}`;
    }
    navigate(fullroute);
  }

  const isSelectedScheduleFile = (filename: string) => {
    const query = new URLSearchParams(location.search);
    const routeFilename = query.get('file');
    if (filename) {
      return routeFilename === filename;
    }

    return !routeFilename;
  }

  const ScheduleMeu = (
    <Menu
      PaperProps={{ sx: { minWidth: 200 } }}
      id="schedule-menu"
      anchorEl={scheduleAnchorEl}
      anchorOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
      keepMounted
      open={Boolean(scheduleAnchorEl)}
      onClose={closeScheduleMenu}
    >
      <MenuItem onClick={e => {gotoPage('/schedule-editor', '')}}
        sx={{
          backgroundColor: isSelectedScheduleFile('') ? '#bdbdbd' : ''
        }}
      >
        <ListItemText>New Schedule File</ListItemText>
      </MenuItem>

      <Divider />

      {projectContext.scheduleFileList.map(
        (file) => (
          <MenuItem key={file}
            onClick={e => { gotoPage('/schedule-editor', file) }}
            sx={{
              backgroundColor: isSelectedScheduleFile(file) ? '#bdbdbd' : ''
            }}
          >
            <ListItemText>{file}</ListItemText>
          </MenuItem>
      ))}
    </Menu>
  );

  const SettingMenu = (
    <Menu
      PaperProps={{ sx: { minWidth: 150 } }}
      id="setting-menu"
      anchorEl={settingAnchorEl}
      anchorOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
      keepMounted
      open={Boolean(settingAnchorEl)}
      onClose={closeSettingMenu}
    >
      <FormControlLabel
        control={
          <Switch
            checked={projectContext.autoSave}
            onChange={e => projectContext.setAutoSave(e.target.checked)}
            inputProps={{ 'aria-label': 'controlled' }}
          />}
        label="Auto Save" labelPlacement="start" />          
    </Menu>
  );

  return (
    <Stack
      width={expandMenu ? 250 : 50}
      height={'calc(100vh - 80px)'}
      sx={{
        backgroundColor: '#F5F5F5',
        borderRight: '1px solid rgba(0, 0, 0, 0.12)',
        justifyContent: 'space-between'
      }}
      role="presentation"
      className='navigation-bar'
    >
      <List>
        <ListItem key='target-catalog' disablePadding
          onClick={e => {
            gotoPage('/target-catalogue', '')
          }}          
          sx={{
            backgroundColor: location.pathname.includes('/target') ? '#bdbdbd' : ''
          }}
        >
          <ListItemButton sx={{ alignItems: 'stretch' }}>
            <ListItemIcon><BlurCircularIcon /></ListItemIcon>
            {expandMenu && <ListItemText sx={{ width: '70%' }} primary='Target Catalog' />}
          </ListItemButton>
        </ListItem>

        <ListItem key='band-config' disablePadding
          sx={{
            backgroundColor: location.pathname === '/band-config' ? '#bdbdbd' : ''
          }}
          onClick={e => {
            gotoPage('/band-config', '')
          }}
        >
          <ListItemButton sx={{alignItems: 'stretch'}}>
            <ListItemIcon ><TuneIcon /></ListItemIcon>
            {expandMenu && <ListItemText sx={{width: '70%'}} primary='Band Configuration' />}
          </ListItemButton>
        </ListItem>

        <ListItem key='corr-setting' disablePadding
          sx={{
            backgroundColor: location.pathname === '/correlator-setting' ? '#bdbdbd' : ''
          }}
          onClick={e => {
            gotoPage('correlator-setting', '')
          }}
        >
          <ListItemButton sx={{ alignItems: 'stretch' }}>
            <ListItemIcon><ViewWeekIcon /></ListItemIcon>
            {expandMenu && <ListItemText sx={{ width: '70%' }} primary='Correlator Settings' />}
          </ListItemButton>
        </ListItem>

        <ListItem disablePadding
          onClick={handleScheduleMenu}
          sx={{
            backgroundColor: location.pathname.includes('/schedule-editor') ? '#bdbdbd' : ''
          }}>
          <ListItemButton sx={{ alignItems: 'stretch' }}>
            <ListItemIcon><TableViewIcon /></ListItemIcon>
            {expandMenu && <ListItemText sx={{ width: '70%' }} primary='Schedule Editor' />}
          </ListItemButton>
        </ListItem>

        {ScheduleMeu}

      </List>

      <List id='export-project' >
        
        <ListItem disablePadding onClick={handleSettingMenu}>
          <ListItemButton sx={{ alignItems: 'stretch' }}>
            <ListItemIcon><SettingsOutlinedIcon /></ListItemIcon>
            {expandMenu && <ListItemText sx={{ width: '70%' }} primary='Settings' />}
          </ListItemButton>
        </ListItem>

        {SettingMenu}

        <ListItem disablePadding>
          <ListItemButton sx={{ alignItems: 'stretch' }}>
            <ListItemIcon><DriveFileMoveOutlinedIcon /></ListItemIcon>
            {expandMenu && <ListItemText sx={{ width: '70%' }} primary='Export Proejct' />}
          </ListItemButton>
        </ListItem>

        <ListItem key='toggle-menu' className='expend-item' disablePadding
          onClick={toggleExpandMenu} >
          <ListItemButton>
            <ListItemIcon>
              {
                expandMenu ? 
                  <KeyboardDoubleArrowLeftIcon />
                  : <KeyboardDoubleArrowRightIcon onClick={toggleExpandMenu} />
              }
            </ListItemIcon>
          </ListItemButton>
        </ListItem>
      </List>

    </Stack>
  )
}

