import * as React from 'react';
import Stack from '@mui/material/Stack';
import { grey } from '@mui/material/colors';
import { Box, Breadcrumbs, DialogContent, IconButton, Paper, TextField} from '@mui/material';
import Button from '@mui/material/Button';
import ControlPointIcon from '@mui/icons-material/ControlPoint';
import Chip from '@mui/material/Chip';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import InfoIcon from '@mui/icons-material/Info';
import Dialog from '@mui/material/Dialog';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import SaveIcon from '@mui/icons-material/Save';
import InputIcon from '@mui/icons-material/Input';

import ConfirmationDialog from '../util/ConfirmationDialog';
import * as ATCAConstants from '../util/ATCAConstants'
import { useLocation } from 'react-router-dom';
import {ProjectContext} from './ProjectContext';


export default function BanConfigurationView() {
  const queryParams = new URLSearchParams(useLocation().search);
  const projectContext = React.useContext(ProjectContext);

  const [isDirty, setIsDirty] = React.useState(false);

  const [showInfoDialog, setShowInfoDialog] = React.useState<boolean>(false);
  const [showConfirmationIndex, setShowConfirmationIndex] = React.useState(-1);

  const [isAllValid, setIsAllValid] = React.useState<boolean>(true);

  const setBandConfiguration = (config: any) => {
    setIsDirty(true);
    projectContext.setBandConfiguration(config);
  }

  React.useEffect(() => {
    let interval: any = null;
    if (projectContext.autoSave) {
      interval = setInterval(() => {
        // save changes
        if (isDirty) {
          console.log('BandConfiguration - auto saving');
          setIsDirty(false);
          projectContext.saveBandConfiguration();
        }
      }, 10000);
    } else {
      clearInterval(interval);
      console.log('BandConfiguration - clear auto saving');
    }
    return () => clearInterval(interval);
  }, [projectContext, isDirty]);

  const saveBandConfiguration = () => {
    setIsDirty(false);
    projectContext.saveBandConfiguration();
  }

  const calculateIsAllValid = () => {
    const modes = projectContext.bandConfiguration;
    for (let i=0; i<modes.length; i++ ) {
      if (!validateMode(i)) {
        setIsAllValid(false);
        return;
      }
    }

    setIsAllValid(true);
    return;
  }

  const validateMode = (index: number) => {
    let error = validateModeName(index);
    if (error)
      return false;

    error = validateModeName(index);
    if (error)
      return false;
    
    const validation = validateFreqs(index);
    
    return validation.areBothFreqValid;
  }

  const validateModeName = (index: number) => {
    const modes = projectContext.bandConfiguration;
    const mode = modes[index];
    if (!mode['name'])
      return 'Please enter a name';
    
    const arr = modes.filter((val) => {
      return val['name'] === mode['name'];
    });

    if (arr.length > 1)
      return 'Name has to be unique';
  }

  const validateFreqs = (index: number) => {
    const modes = projectContext.bandConfiguration;
    const freq1 = Number(modes[index]['centreFreq1']);
    const freq2 = Number(modes[index]['centreFreq2']);

    // both have to be within a single receiver
    let error1 = ''
    let error2 = ''
    let isFreq1Error = false;
    let isFreq2Error = false;

    if (freq1 <= 0) {
      error1 = 'Please enter a centre frequency';
    }

    if (freq2 <= 0) {
      error2 = 'Please enter a centre frequency';
    }

    if (error1 && error2) {
      return {
        areBothFreqValid: false,
        isFreq1Error: isFreq1Error,
        freq1Message: error1,
        isFreq2Error: isFreq2Error,
        freq2Message: error2,
      };
    }

    let areBothFreqValid = true;
    // find the receiver for to freq1, 
    // make sure it's within the receiver range
    let receiver;
    const freq1_start = freq1 - ATCAConstants.IF_BAND_WIDTH /2;
    const freq1_end = freq1 + ATCAConstants.IF_BAND_WIDTH /2;
    for (const rec of ATCAConstants.ReceiverRange) {
      if (freq1_start >= rec['start'] && freq1_end <= rec['end']) {
        receiver = rec;
        break;
      }
    }

    // use the same receiver
    // make sure it's within the receiver range
    const freq2_start = freq2 - ATCAConstants.IF_BAND_WIDTH / 2;
    const freq2_end = freq2 + ATCAConstants.IF_BAND_WIDTH / 2;
    if (receiver) {
      if (freq2_start >= receiver['start'] && freq2_end <= receiver['end']) {
        // do nothing
      } else {
        if (!error2) {
          isFreq2Error = true;
          error2 = 'Out of range';
          areBothFreqValid = false;
        }
      }
    } else {
      if (freq1 > 0) {
        if (!error1) {
          isFreq1Error = true;
          error1 = 'Out of range'
          areBothFreqValid = false;
       }
      }
    }

    if (receiver && receiver.name !== modes[index]['receiver']) {
      const newModes = [...modes];
      newModes[index]['receiver'] = receiver['name'];
      setBandConfiguration(newModes);
    }

    return {
      areBothFreqValid: areBothFreqValid,
      isFreq1Error: isFreq1Error,
      freq1Message: error1,
      isFreq2Error: isFreq2Error,
      freq2Message: error2,
    };
  }

  const deleteMode = (index: number) => {
    setShowConfirmationIndex(index);
  }

  const handleConfirmationYes = () => {
    const index = showConfirmationIndex;

    const newModes = [...projectContext.bandConfiguration];
    newModes.splice(index, 1);
    setBandConfiguration(newModes);

    if (newModes.length > 0)
      calculateIsAllValid();
    else
      setIsAllValid(true);

    setShowConfirmationIndex(-1);
  }

  const addNewMode = (event: React.MouseEvent<HTMLElement>) => {
    const mode = {
      name: '',
      centreFreq1: 0,
      centreFreq2: 0,
      receiver: ''
    };
    const newModes = [...projectContext.bandConfiguration, mode];
    setBandConfiguration(newModes);
    setIsAllValid(false);
  };

  const getValue = (fieldName:string, index: number) => {
    return projectContext.bandConfiguration[index][fieldName] || '';
  };

  const setValue = (
    event: React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement>, 
    fieldName: string, 
    index: number) => {
    const newModes = [...projectContext.bandConfiguration];
    if (fieldName === 'name')
      newModes[index][fieldName] = event.target.value || '';
    else
      newModes[index][fieldName] = event.target.value || '';

    setBandConfiguration(newModes);
    calculateIsAllValid();
  };

  const BandModeRow = (mode: any, index: number) => (
    <Stack direction="row" spacing={1} key={`mode-row-${index}`}
      sx={{ alignItems: 'center', marginTop: '15px' }}>

      <IconButton aria-label="save" size='small' onClick={e => deleteMode(index-1)}>
        <DeleteOutlineIcon />
      </IconButton>

      <TextField required 
          label="Name" sx={{ height: '80px', width: '25%' }}
          id={`name-${index}`}
          value={getValue('name', index - 1)}
          helperText={validateModeName(index - 1)}
          onChange={(e) => setValue(e, 'name', index - 1)} />

      <TextField required
        label="Centre Freq (GHz) - Band 1" sx={{ height: '80px', width: '25%' }}
        id={`centre_freq_1-${index}`}
        value={getValue('centreFreq1', index - 1)}
        error = {validateFreqs(index - 1)['isFreq1Error']}
        helperText={ validateFreqs(index - 1)['freq1Message'] }
        onChange={(e) => setValue(e, 'centreFreq1', index - 1)} />

      <TextField required
        label="Centre Freq (GHz) - Band 2" sx={{ height: '80px', width: '25%' }}
        id={`centre_freq_2-${index}`}
        value={getValue('centreFreq2', index - 1)}
        error={validateFreqs(index - 1)['isFreq2Error']}
        helperText={validateFreqs(index - 1)['freq2Message']}
        onChange={(e) => setValue(e, 'centreFreq2', index - 1)} />

      <Chip label={'Receiver: ' + getValue('receiver', index - 1)} size="medium" 
        key={`mode-receiver-${index}`}
        sx={{
          color: 'black', backgroundColor: grey[100], width: '25%'
        }}/>
      </Stack>
  );

  const BandInfoDialog = (
    <Dialog onClose={ e => setShowInfoDialog(false) } open={showInfoDialog}>
      <DialogContent>
        <Typography variant="h5" gutterBottom>
          There are {ATCAConstants.NUMBER_OF_IF} bands of width
          {ATCAConstants.IF_BAND_WIDTH}GHz, both have to be within a receiver range.
        </Typography>
        <List sx={{ pt: 0 }}>
          {
            ATCAConstants.ReceiverRange.map((receiver) =>(
              <ListItem key={`receiver-${receiver.name}`}>
                <Typography width={'70px'}>
                  {receiver['name']}:
                </Typography>
                <Typography>
                {receiver.start} - {receiver.end} GHz
                </Typography>
              </ListItem>
            ))
          }
      </List>
      </DialogContent>
    </Dialog>
  );

  const handleConfirmationNo = () => {
    setShowConfirmationIndex(-1);
  }

  return (
    <Box margin={'10px'}>
      {BandInfoDialog}

      <ConfirmationDialog open={ showConfirmationIndex>=0 }
        title='Delete mode'
        message='Do you want to delete the selected mode configuration?'
        handleNo={handleConfirmationNo}
        handleYes={handleConfirmationYes}
      />

      <Stack direction="row" spacing={5} justifyContent="space-between" >
        <Breadcrumbs separator="›" aria-label="breadcrumb">
          <Typography key="project" variant="subtitle1" color="primary">
            {queryParams.get('project')}
          </Typography>

          <Stack direction={'row'}>
            <Typography key="file" variant="h6" color="primary">
              {'Band Configuration'}
            </Typography>
            <IconButton aria-label="save" size='small' onClick={e => setShowInfoDialog(true)}>
              <InfoIcon color='secondary' />
            </IconButton>
          </Stack>
        </Breadcrumbs>

        <Stack id={'add-mode-button'}
          direction="row" spacing={5} justifyContent="flex-end">

          <Button variant="text" startIcon={<ControlPointIcon />}
            onClick={addNewMode} disabled={!isAllValid}>
            Add Mode
          </Button>
        </Stack>

        <Stack id={'save-mode'} minWidth={'250px'} 
          direction="row" spacing={1} justifyContent="flex-end">
          <IconButton aria-label="import" color='primary'>
            <InputIcon />
          </IconButton>

          <IconButton aria-label="delete" color='primary' 
            onClick={saveBandConfiguration}>
            <SaveIcon />
          </IconButton>
        </Stack>

      </Stack>

      {
        (projectContext.bandConfiguration && projectContext.bandConfiguration.length > 0)
        &&
        <Paper elevation={3} style={{ padding: '10px', margin: 0 }}>
          <Stack spacing={2}>
            {
              projectContext.bandConfiguration.map((mode, index) => (
                BandModeRow(mode, index + 1)
              ))
            }
          </Stack>
        </Paper>
      }
    </Box>
  )
}
