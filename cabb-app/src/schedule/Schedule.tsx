import * as React from 'react';
import Stack from '@mui/material/Stack';
import { Alert, Breadcrumbs, Divider, IconButton, ListItemIcon, ListItemText, 
  MenuItem, MenuList, Snackbar, Typography } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import SaveAsIcon from '@mui/icons-material/SaveAs';
import InputIcon from '@mui/icons-material/Input';
import OutboundIcon from '@mui/icons-material/Outbound';
import MenuIcon from '@mui/icons-material/Menu';
import Menu from '@mui/material/Menu';
import { useNavigate } from 'react-router-dom';

import ScheduleScanView from './ScheduleScanView';
import { ProjectContext } from './ProjectContext';
import { ScheduleContext } from './ScheduleContext';
import SaveScheduleDialog from '../components/SaveScheduleDialog';
import DeployScheduleDialog from '../components/DeployScheduleDialog';


export const INIT_SCHEDULE_FILE = {
    document: 'ATCA BIGCAT scheduler file',
    version: '1.0',
    schedule_info: {
      owner: '',
      observer: '',
      proposal_code: '',
      schedule_type: 'relative',
      utc_start_time: '',
      utc_start_date: '',
      lst_start_time: ''
    },
    scans: [],
};

export default function Schedule() {
  const projectContext = React.useContext(ProjectContext);
  const scheduleContext = React.useContext(ScheduleContext);

  const navigate = useNavigate();

  const [menuAnchorEl, setMenuAnchorEl] = React.useState<null | HTMLElement>(null);
  const [openSaveFileDialog, setOpenSaveFileDialog] = React.useState(false);
  const [openDeployFileDialog, setOpenDeployFileDialog] = React.useState(false);
  const [snackMessage, setSnackMessage] = React.useState<any>(null);


  const doSaveSchedule = (fullfilename: string) => {
    if (fullfilename) {
      console.log(`Schedule - save ${fullfilename}`);
      scheduleContext.saveAsSchedule(fullfilename);
      gotoScheduleFile(fullfilename);
    }

    setOpenSaveFileDialog(false);
  }

  React.useEffect(() => {
    let interval: any = null;
    if (projectContext.autoSave) {
      interval = setInterval(() => {
        // save changes, no auto save if no filename
        if (scheduleContext.isDirty) {
          if (scheduleContext.filename) {
            console.log('Schedule - auto saving');
            scheduleContext.saveSchedule();
            scheduleContext.setIsDirty(false);
          }
        }
      }, 10000);
    } else {
      clearInterval(interval);
      console.log('Schedule - clear auto saving');
    }
    return () => clearInterval(interval);
  }, [projectContext.autoSave, scheduleContext.isDirty, scheduleContext]);

  const handleDeploy = () => {
    // display the deploy content and file name in Dialog
    // (give user a chance to download it)
    setMenuAnchorEl(null);
    setOpenDeployFileDialog(true);
  }

  const handleSaveAs = () => {
    setOpenSaveFileDialog(true);
    setMenuAnchorEl(null);
  }

  const handleSave = () => {
    if (scheduleContext.filename) {
      if (scheduleContext.isDirty) {
        scheduleContext.saveSchedule();
      }
    } else {
      setOpenSaveFileDialog(true);
    }
    setMenuAnchorEl(null);
  }

  const handleClickMenu = (event: React.MouseEvent<HTMLButtonElement>) => {
    setMenuAnchorEl(event.currentTarget);
  };
  
  const handleClose = () => {
    setMenuAnchorEl(null);
  };

  const gotoScheduleFile = (filename: string) => {
    const route = '/schedule-editor';
    const project = scheduleContext.projectName;
    let fullroute = `${route}?project=${encodeURIComponent(project!)}`;
    if (filename) {
      fullroute += `&file=${filename}`;
    }
    navigate(fullroute);
  }

  return (
    <Stack spacing={2} sx={{padding: '10px'}}>
      <Snackbar
        open={Boolean(snackMessage)}
        autoHideDuration={6000}
        onClose={e => setSnackMessage(null)}
      >
        <Alert severity={snackMessage ? snackMessage.severity : 'error'}>
          {snackMessage ? snackMessage.message : ''}
        </Alert>
      </Snackbar>

      <SaveScheduleDialog 
        open={openSaveFileDialog} 
        rootPath={scheduleContext.projectName} 
        handleSave={doSaveSchedule} 
        handleCancel={() => setOpenSaveFileDialog(false)}
      />

      <DeployScheduleDialog
        open={openDeployFileDialog}
        project={scheduleContext.projectName} 
        schedule_content={JSON.stringify(scheduleContext.schedule, null, 4)}
        filename={scheduleContext.filename}
        handleDeploy={scheduleContext.deploySchedule}
        handleCancel={() => setOpenDeployFileDialog(false)}
      />

      <Stack direction="row" spacing={0} 
        justifyContent="space-between" alignItems={'center'}
      >
        <Breadcrumbs separator="›" aria-label="breadcrumb">
          <Typography key="project" variant="subtitle1" color="primary">
            {scheduleContext.projectName}
          </Typography>

          <Typography key="project" variant="subtitle1" color="primary">
            {'Schedule File'}
          </Typography>

          <Typography key="file" variant="h6" color="primary">
            {scheduleContext.filename ? scheduleContext.filename : 'New'}
          </Typography>
        </Breadcrumbs>
        
        <IconButton
          size="large"
          edge="start"
          color="primary"
          aria-label="menu"
          sx={{ mr: 2 }}
          onClick={handleClickMenu}
        >
          <MenuIcon />
        </IconButton>

        <Menu
          PaperProps={{ sx: { width: '200px'} }}
          id="menu-appbar"
          anchorEl={menuAnchorEl}
          anchorOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          keepMounted
          transformOrigin={{
            vertical: -30,
            horizontal: 'right',
          }}
          open={Boolean(menuAnchorEl)}
          onClose={handleClose}
        >
          <MenuList>
            <MenuItem>
              <ListItemIcon>
                <InputIcon />
              </ListItemIcon>
              <ListItemText>Import</ListItemText>
            </MenuItem>

            <MenuItem onClick={handleSave}>
              <ListItemIcon>
                <SaveIcon />
              </ListItemIcon>
              <ListItemText>Save</ListItemText>
            </MenuItem>

            <MenuItem onClick={handleSaveAs}>
              <ListItemIcon>
                <SaveAsIcon />
              </ListItemIcon>
              <ListItemText>Save as</ListItemText>
            </MenuItem>

            <Divider />

            <MenuItem onClick={handleDeploy}>
              <ListItemIcon>
                <OutboundIcon />
              </ListItemIcon>
              <ListItemText>Deploy</ListItemText>
            </MenuItem>

          </MenuList>
        </Menu>
      </Stack>
      <ScheduleScanView />
    </Stack>
  )
}
