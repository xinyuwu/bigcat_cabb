import * as React from 'react';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import { blueGrey } from '@mui/material/colors';
import { Avatar, ButtonGroup, FormControlLabel, FormLabel, IconButton, 
  ListItem, ListItemText, Paper, Radio, RadioGroup, Switch} from '@mui/material';
import PostAddIcon from '@mui/icons-material/PostAdd';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Menu from '@mui/material/Menu';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import ControlPointIcon from '@mui/icons-material/ControlPoint';
import ContentCutOutlinedIcon from '@mui/icons-material/ContentCutOutlined'; import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ContentPasteOutlinedIcon from '@mui/icons-material/ContentPasteOutlined';
import Checkbox from '@mui/material/Checkbox';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked'; 
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import List from '@mui/material/List';
import LinkOutlinedIcon from '@mui/icons-material/LinkOutlined';

import * as ATCAConstants from '../util/ATCAConstants'

import { Box } from '@mui/system';
import {ProjectContext} from './ProjectContext';
import { ScheduleContext } from './ScheduleContext';

import ScanEditor from './ScanEditor';
import ImportSourceDialog from './ImportSourceDialog';

export default function ScheduleScanView() {
  const projectContext = React.useContext(ProjectContext);
  const scheduleContext = React.useContext(ScheduleContext);

  const [showImportDialog, setShowImportDialog] = React.useState<boolean>(false);
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [newScan, setNewScan] = React.useState<any>({});

  const [selectedIndex, setSelectedIndex] = React.useState<number[]>([]);

  const [clipBoard, setClipBoard] = React.useState<any[]>([]);

  const setNewScanValue = (fieldName: string, value: any) => {
    setNewScan({
      ...newScan,
      [fieldName]: value
    })
  }

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const updateSelectedScan = (s : any) => {
    const scans: any[] = scheduleContext.getScans();
    const newScans = [...scans];
    newScans[selectedIndex[0]] = s;
    scheduleContext.updateScans(newScans);
  }

  const importTargets = (targets: any[], defaultImportSetting: any) => {
    const scans: any[] = scheduleContext.getScans();
    let newScans: any[] = [];
    for (const target of targets) {
      const scan =  {
        name: target['name'],
        ra: target['ra'],
        dec: target['dec'],
        epoch: target['epoch'],
        duration: defaultImportSetting['duration'],
        scanType: defaultImportSetting['scanType'],
        pointing: defaultImportSetting['pointing'],
        correlatorSetting: defaultImportSetting['correlator_setting']
      };
      newScans.push(scan);
    }
    newScans = scans.concat(newScans);
    scheduleContext.updateScans(newScans);
    setSelectedIndex([0]);
    setShowImportDialog(false);
  }

  const cutScans = () => {
    const scans: any[] = scheduleContext.getScans();
    const seletedScans = scans.filter((value, index) => {
      return selectedIndex.indexOf(index) >= 0;
    });
    setClipBoard(seletedScans);

    const newScans = scans.filter((value, index) => {
      return selectedIndex.indexOf(index) === -1;
    });

    scheduleContext.updateScans(newScans);
    setSelectedIndex([]);
  }

  const copyScans = () => {
    const scans: any[] = scheduleContext.getScans();
    let seletedScans = scans.filter((value, index) => {
      return selectedIndex.indexOf(index) >= 0;
    });
    setClipBoard(seletedScans);
  }

  const pasteScans = () => {
    const scans: any[] = scheduleContext.getScans();
    // if no item selected, paste at the beginning    
    // if item selected, paste after the selected item
    let index = 0;
    if (selectedIndex.length > 0) {
      index = selectedIndex[0] + 1;
    }

    if (index >= scans.length) {
      const newScans = scans.concat(clipBoard);
      scheduleContext.updateScans([...newScans]);
    } else {
      scans.splice(index, 0, ...clipBoard);
      scheduleContext.updateScans([...scans]);
    }

    const selection = [...Array(clipBoard.length)].map((_, i) => index + i);
    setSelectedIndex(selection);
  }

  const addNewScan = () => {
    const scans: any[] = scheduleContext.getScans();
    const newScans = [...scans];
    newScans.unshift(
      {
        name: newScan['name'],
        ra: newScan['ra'],
        dec: newScan['dec'],
        epoch: newScan['epoch'],
        calCode: '',
        duration: 300,
        startTime: '',
        startDate: '',
        scanType: 'Normal',
        pointing: 'Global',
        correlatorSetting: ''
      },
    );
    scheduleContext.updateScans(newScans);
    setAnchorEl(null);
    setSelectedIndex([0]);
    // TODO: add source to catalogue
  }

  const toggleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    const scans: any[] = scheduleContext.getScans();
    if (event.target.checked) {
      const selectAll = [...Array(scans.length)].map((_, i) => i);
      setSelectedIndex(selectAll);
    } else {
      setSelectedIndex([]);
    }
  };

  const selectIndex = (index: number) => {
    setSelectedIndex([index]);
  }

  const toggleSelection = (e: React.MouseEvent<Element, MouseEvent>, index: number) => {
    let newSelections = [...selectedIndex];
    const i = selectedIndex.indexOf(index);
    if (i<0) {
      newSelections.push(index);
    } else {
      newSelections.splice(i, 1);
    }

    setSelectedIndex(newSelections.sort((n1, n2) => n1 - n2));
    e.stopPropagation();
  }

  const handleScheduleInfoChange = 
    (value: any, fieldName: string) => {

    const scheduleInfo = scheduleContext.getScheduleInfo();
    const newScheduleInfo = {
      ...scheduleInfo,
      [fieldName]: value
    };
      scheduleContext.updateScheduleInfo(newScheduleInfo);
  };

  const ImportMenu = (
    <Menu
      PaperProps={{ sx: { width: '200px', padding: '10px' } }}
      id="menu-appbar"
      anchorEl={anchorEl}
      anchorOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
      keepMounted
      transformOrigin={{
        vertical: -45,
        horizontal: 'right',
      }}
      open={Boolean(anchorEl)}
      onClose={handleClose}
    >
      <Stack spacing={2}>
        <TextField id="default-duration" label="Name"
          value={newScan['name'] || ''}
          onChange={(e) => setNewScanValue('name', e.target.value)}
          variant="standard" />

        <TextField id="default-ra" label="RA"
          value={newScan['ra'] || ''}
          onChange={(e) => setNewScanValue('ra', e.target.value)}
          variant="standard" />

        <TextField id="default-dec" label="Dec"
          value={newScan['dec'] || ''}
          onChange={(e) => setNewScanValue('dec', e.target.value)}
          variant="standard" />

        <FormControl variant="standard" fullWidth >
          <InputLabel id="scan-epoch-label">Epoch</InputLabel>
          <Select
            labelId="scan-epoch-label"
            id="scan-epoch"
            label="Epoch"
            displayEmpty={true}
            value={newScan['epoch'] || ''}
            onChange={(e) => setNewScanValue('epoch', e.target.value as string)}
          >
            {ATCAConstants.EPOCHS.map((val) => (
              <MenuItem key={val} value={val}>{val}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <Button variant="outlined" onClick={addNewScan}>
          Add
        </Button>

        <Typography variant="caption" >
          Target will be added to project catalogue.
        </Typography>
      </Stack>
    </Menu>
  );

  const ObservationDetails = (
    <Stack spacing={2} padding={'10px'}>

      <TextField id="description" label="Description"
        value={scheduleContext.getScheduleInfo()['description'] || ''}
        onChange={(e) => handleScheduleInfoChange(e.target.value as string, 'description')}
        variant="standard" sx={{ flexGrow: 1 }} />

      <Stack direction="row" spacing={2} >
        <TextField id="observer" label="Observer"
          value={scheduleContext.getScheduleInfo()['observer'] || ''}
          onChange={(e) => handleScheduleInfoChange(e.target.value as string, 'observer')}
          variant="standard" sx={{ flexGrow: 1 }}/>

        <FormControl variant="standard" sx={{ flexGrow: 1, minWidth: '150px' }}>
          <InputLabel id="array-label">Array Configuration</InputLabel>
          <Select
            labelId="array-label"
            displayEmpty={true}
            id="array"
            label="Array Configuration"
            value={scheduleContext.getScheduleInfo()['array_config'] || ''}
            onChange={(e) => handleScheduleInfoChange(e.target.value, 'array_config')}
          >
            {
              ATCAConstants.ARRAY_CONFIGURATIONS.map((config) => (
                <MenuItem key={config['name']} value={config['name']}>{config['name']}</MenuItem>
              ))
            }
          </Select>
        </FormControl>

        <Button variant="text" style={{marginLeft: '0', paddingLeft: '0'}}
          onClick={() => { window.open(ATCAConstants.ARRAY_HELP_URL, '_blank')}}
          startIcon={<LinkOutlinedIcon />}>
        </Button>

        <TextField id="proposal-code" label="Proposal Code" 
          value={scheduleContext.getScheduleInfo()['proposal_code'] || ''}
          onChange={(e) => handleScheduleInfoChange(e.target.value as string, 'proposal_code')}
          variant="standard" sx={{ flexGrow: 1 }} />
          
        <TextField id="schedule-owner" label="Schedule Owner" 
          value={scheduleContext.getScheduleInfo()['owner']}
          onChange={(e) => handleScheduleInfoChange(e.target.value as string, 'owner')}
          variant="standard" sx={{ flexGrow: 1 }} />
      </Stack>

    </Stack>
  );

  const ScheduleType = (
    <Stack spacing={2} padding={'10px'}>
      <FormControl fullWidth sx={{ flexDirection: 'row', alignItems: 'center' }}>
        <FormLabel id="schedule-type-label" sx={{ minWidth: '100px' }}>
          Start time
        </FormLabel>
        <RadioGroup
          row
          name="schedule-type-group"
          sx={{ width: 'calc(100% - 100px)' }}
          value={scheduleContext.getScheduleInfo()['schedule_type'] || ''}
          onChange={(e) => handleScheduleInfoChange(e.target.value as string, 'schedule_type')}
        >
          <FormControlLabel value="relative" control={<Radio />} label="Relative" />
          <FormControlLabel value="lst" control={<Radio />} label="LST" />
          <FormControlLabel value="utc" control={<Radio />} label="UTC" />
        </RadioGroup>
      </FormControl>     

      <FormControlLabel
        control={
          <Switch 
            checked={Boolean(scheduleContext.getScheduleInfo()['advance_mode'])} 
            onChange={(e) => handleScheduleInfoChange(e.target.checked, 'advance_mode')}
            name="advance-mode" />
        }
        label="Advance Mode"
      />
    </Stack>
  );

  const ImportDialog = (
    <ImportSourceDialog
      open={showImportDialog}
      targets={projectContext.targetFile}
      handleImport={importTargets}
      handleCancel={() => setShowImportDialog(false)}
    />
  );

  return (
    <React.Fragment>      
      <Stack direction={'row'} spacing={2} style={{ marginTop: 0 }}>
        <Paper sx={{ width: '60%', flexGrow: 1 }}>
          <Typography variant="h6"
            sx={{ backgroundColor: '#E0E0E0', 'textAlign': 'center', padding: '5px' }}>
            Schedule Information
          </Typography>
          {ObservationDetails}
        </Paper>

        <Paper sx={{ minWidth: '250px', maxWidth: '450px' }}>
          <Typography variant="h6"
            sx={{ backgroundColor: '#E0E0E0', 'textAlign': 'center', padding: '5px' }}>
            Schedule Type
          </Typography>
          {ScheduleType}
        </Paper>
      </Stack>

      <Stack direction="row" spacing={3} style={{ marginTop: 0 }}
        justifyContent="space-between">
        <ButtonGroup sx={{marginLeft: '5px'}}>
          <Checkbox sx={{ '& .MuiSvgIcon-root': { fontSize: 40 } }}
            icon={<RadioButtonUncheckedIcon />}
            checkedIcon={<CheckCircleIcon />}
            onChange={toggleSelectAll}
            checked={selectedIndex.length === scheduleContext.getScans().length}
          />
          <IconButton aria-label="cut-scan" onClick={cutScans}
            disabled={selectedIndex.length < 1}>
            <ContentCutOutlinedIcon />
          </IconButton>
          <IconButton aria-label="copy-scan" onClick={copyScans}
            disabled={selectedIndex.length < 1}>
            <ContentCopyIcon />
          </IconButton>
          <IconButton aria-label="paste-scan" onClick={pasteScans}
            disabled={clipBoard.length < 1 || selectedIndex.length > 1}>
            <ContentPasteOutlinedIcon />
          </IconButton>
        </ButtonGroup>

        <Stack direction="row" spacing={5} justifyContent="flex-end">
          <Button variant="text" startIcon={<PostAddIcon />} 
            onClick={e => setShowImportDialog(true)}>
            Add Targets from Catalogue
          </Button>
          {ImportDialog}
          <Button variant="text" 
            onClick={handleMenu}
            startIcon={<ControlPointIcon />}>
            Add Source
          </Button>
          {ImportMenu}
        </Stack>
      </Stack>

      <Stack direction={'row'} style={{ marginTop: 0 }} 
        sx={{height: 'calc(100vh - 375px)'}}>
        <Box sx={{ width: '35%', maxWidth: '450px', minWidth: '350px',
                   border: '1px solid #eeeeee', overflowY: 'scroll' }}>
          <List sx={{ padding: 0 }}>
            {scheduleContext.getScans().map((target, index) => (
              <ListItem key={`target-${index}`}
                onClick={e => selectIndex(index)}
                sx={{
                  padding: '10px',
                  borderBottom: '1px solid #eeeeee',
                  bgcolor: (selectedIndex.indexOf(index) >= 0) ? '#e0f7fa' : '',
                  "&:hover": {
                    cursor: 'pointer',
                    bgcolor: '#f5f5f5',
                  }
                }}>
                <Avatar
                  onClick={e => toggleSelection(e, index)}
                  sx={{
                    fontSize: '80%',
                    marginRight: '50px',
                    width: 40, height: 40,
                    bgcolor: (selectedIndex.indexOf(index) >= 0) ? '#1976d2' : blueGrey[100],
                    "&:hover": {
                      cursor: 'pointer',
                      bgcolor: blueGrey[500],
                    }
                  }}
                >
                  {index}
                </Avatar>
                <ListItemText primary={target['name']} 
                  secondary={`${target['ra']} ${target['ra']} ${target['duration']}s`}
                />
              </ListItem>
            ))}
          </List>
        </Box>
        {
          (selectedIndex.length === 1 && scheduleContext.getScans().length > 0 
            && scheduleContext.getScans().length > selectedIndex[0] ) &&
            <ScanEditor
              scan={scheduleContext.getScans()[selectedIndex[0]] }
              setScan={updateSelectedScan }
            />
        }
      </Stack>
    </React.Fragment>
  )
}