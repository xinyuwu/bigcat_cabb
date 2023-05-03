import * as React from 'react';
import Stack from '@mui/material/Stack';
import { IconButton, Typography } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import InputIcon from '@mui/icons-material/Input';
import Button from '@mui/material/Button';
import ControlPointIcon from '@mui/icons-material/ControlPoint';

import TextField from '@mui/material/TextField';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined';
import Box from '@mui/material/Box';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import ConfirmationDialog from '../util/ConfirmationDialog';
import Breadcrumbs from '@mui/material/Breadcrumbs';

import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';

import * as ATCAConstants from '../util/ATCAConstants'

import SubBandBox from './SubBandBox';
import { useLocation } from 'react-router-dom';
import { ProjectContext } from './ProjectContext';


const correlator_configurations = ATCAConstants.correlator_configurations;

enum CONFIRMATION_TYPE {
  SET_CORR_CONFIG,
  SET_CORR_MODE,
  DELETE_CORR_SETTING,
}

export default function CorrelatorConfigurationView() {
  const projectContext = React.useContext(ProjectContext);
  const queryParams = new URLSearchParams(useLocation().search);
  const [isDirty, setIsDirty] = React.useState(false);

  const [selectedCorrSetting, setSelectedCorrSetting] = React.useState(-1);
  const [confirmation, setConfirmation] = React.useState<any>({
    showConfirmation: false,
    data: '',
    changeType: ''
  });

  // corrSettings is a list of corrSetting
  // {
  //    name: string
  //    band_configuration: string - name,
  //    correlator_configuration: string - name,
  //    sub_band_configuration: list of
  //        { band: 1, subband: 6, 
  //          zoom: zoom or spectra window config(eg: zoom 1),  center_freq}}
  //        }
  // }

  React.useEffect(() => {
    let interval: any = null;
    if (projectContext.autoSave) {
      interval = setInterval(() => {
        // save changes
        if (isDirty) {
          console.log('CorrelatorConfig - auto saving');
          setIsDirty(false);
          projectContext.saveCorrelatorSetting();
        }
      }, 10000);
    } else {
      clearInterval(interval);
      console.log('CorrelatorConfig - clear auto saving');
    }
    return () => clearInterval(interval);
  }, [projectContext, isDirty]);


  const setCorrelatorSetting = (config: any[]) => {
    setIsDirty(true);
    projectContext.setCorrelatorSetting(config);
  }

  const setSubBandConfigs = (config: any[]) => {
    const newCorrSettings = [...projectContext.correlatorSetting];
    const corrSetting = newCorrSettings[selectedCorrSetting];
    corrSetting['sub_band_configuration'] = config;

    setCorrelatorSetting(newCorrSettings);
  }


  const deleteCorrSetting = () => {
    setConfirmation({
      showConfirmation: true,
      data: selectedCorrSetting,
      changeType: CONFIRMATION_TYPE.DELETE_CORR_SETTING,
      title: 'Confirm delete correlator setting',
      message: 'Do you want to delete the corrector setting? You will lose its sub band configurations.',
    });
  }

  const handleBandConfigChange = (event: SelectChangeEvent) => {
    const showConfirmation = (getSelectedCorrSetting('sub_band_configuration').length > 0);

    if (!showConfirmation) {
      setBandConfigName(event.target.value as string);
    } else {
      setConfirmation({
        showConfirmation: true,
        data: event.target.value as string,
        changeType: CONFIRMATION_TYPE.SET_CORR_MODE,
        title: 'Confirm correlator mode change',
        message: 'Do you want to change mode configuration change? You will lose all subband configrations.',
      });
    }

  }

  const handleCorrelatorConfigChange = (event: SelectChangeEvent) => {
    const showConfirmation = (getSelectedCorrSetting('sub_band_configuration').length > 0);

    if (!showConfirmation) {
      setCorrConfigName(event.target.value as string);
    } else {
      setConfirmation({
        showConfirmation: true,
        data: event.target.value as string,
        changeType: CONFIRMATION_TYPE.SET_CORR_CONFIG,
        title: 'Confirm correlator configuration change',
        message: 'Do you want to change correlator configuration change? You will lose all subband configrations.',
      });
    }
  }

  const handleConfirmationNo = () => {
    setConfirmation({showConfirmation: false});
  }

  const handleConfirmationYes = () => {
    const data = confirmation['data'];

    if (confirmation['changeType'] === CONFIRMATION_TYPE.SET_CORR_MODE) {
      setBandConfigName(data);
      setSubBandConfigs([])
    } else if (confirmation['changeType'] === CONFIRMATION_TYPE.SET_CORR_CONFIG) {
      setCorrConfigName(data);
      setSubBandConfigs([])
    } else if (confirmation['changeType'] === CONFIRMATION_TYPE.DELETE_CORR_SETTING) {
      handleDeleteCorrSetting(data);
    }
    setConfirmation({
      showConfirmation: false,
      data: null,
      changeType: null
    });
  }

  const handleDeleteCorrSetting = (selectedSetting: number) => {
    const newConfigs = [...projectContext.correlatorSetting];
    newConfigs.splice(selectedSetting, 1);
    setCorrelatorSetting(newConfigs);
    let index = selectedSetting - 1;
    index = selectedSetting < 0 ? 0: index;
    setSelectedCorrSetting(index);
  }

  const setCorrConfigName = (corrConfigName: string) => {
    const newCorrSettings = [...projectContext.correlatorSetting];
    const corrSetting = newCorrSettings[selectedCorrSetting];
    corrSetting['correlator_configuration'] = corrConfigName;
    setCorrelatorSetting(newCorrSettings);
  }

  const setBandConfigName = (bandConfigName: string) => {
    const newCorrSettings = [...projectContext.correlatorSetting];
    const corrSetting = newCorrSettings[selectedCorrSetting];
    corrSetting['band_configuration'] = bandConfigName;
    setCorrelatorSetting(newCorrSettings);
  }

  const handleSelectSetting = (index: number) => {
    setSelectedCorrSetting(index);
  };

  const addNewCorrSetting = () => {
    const newSettings = [...projectContext.correlatorSetting];
    newSettings.push({
      name: 'untitled',
      correlator_configuration: '',
      band_configuration: '',
      sub_band_configuration: [],
    });

    setCorrelatorSetting(newSettings);
    setSelectedCorrSetting(newSettings.length - 1);
  }

  const getSelectedCorrSetting = (name: string) => {
    if (!name) {
      if (selectedCorrSetting<0)
        return {};
      else if (selectedCorrSetting < 0)
        return {};
      else
        return projectContext.correlatorSetting[selectedCorrSetting];
    }
    if (selectedCorrSetting < 0) {
      if (name === 'sub_band_configuration')
        return [];

      return {};
    }

    return projectContext.correlatorSetting[selectedCorrSetting][name];
  }

  const setCorrSettingName = 
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newSettings = [...projectContext.correlatorSetting];
    const setting = newSettings[selectedCorrSetting];
    setting['name'] = event.target.value;

    setCorrelatorSetting(newSettings);
  }

  const CustomModeBox = (
    <React.Fragment>
      <Stack direction={'row'} spacing={3} 
        sx={{ marginBottom: '10px', alignItems: 'baseline'}}>

        <TextField id="band-config-name" label="Name" 
          variant="standard" sx={{ width: '30%' }}
          value={getSelectedCorrSetting('name') || ''}
          onChange={setCorrSettingName}
        />

        <FormControl sx={{ width: '35%' }} variant="standard">
          <InputLabel id="cor-mode">Correlator mode</InputLabel>
          <Select
            labelId="cor-mode-label"
            id="cor-mode-select-value"
            label="Correlator mode"
            onChange={handleBandConfigChange}
            value={getSelectedCorrSetting('band_configuration')||''}
            displayEmpty={true}
          >
            {projectContext.bandConfiguration.map((mode) => (
              <MenuItem key={mode['name']} value={mode['name']}>{mode['name']}</MenuItem>
            ))}
          </Select>
        </FormControl>  

        <FormControl sx={{ width: '35%' }} variant="standard">
          <InputLabel id="cor-config">Correlator configuration</InputLabel>
          <Select
            labelId="cor-config-label"
            id="cor-config-select-value"
            label="Correlator configuration"
            onChange={handleCorrelatorConfigChange}
            value={getSelectedCorrSetting('correlator_configuration')||''}
            displayEmpty={true}
          >
            {correlator_configurations.map((config: any) => (
              <MenuItem key={config['name']} value={config['name']}>{config['name']}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>

      <SubBandBox
        corrSetting={getSelectedCorrSetting('')}
        setSubBandConfigs={setSubBandConfigs}
      />
    </React.Fragment>
  );

  return (
    <Stack id='sub-band-view' 
      margin={'10px'} height={'calc(100vh - 100px)'}>

      <ConfirmationDialog open={confirmation.showConfirmation}
        title={confirmation['title']}
        message={confirmation['message']}
        handleNo={handleConfirmationNo}
        handleYes={handleConfirmationYes}
      />

      <Stack direction={'row'} alignItems={'center'} justifyContent={'space-between'}>
        <Breadcrumbs separator="›" aria-label="breadcrumb">
          <Typography key="project" variant="subtitle1" color="primary">
            {queryParams.get('project')}
          </Typography>

          <Typography key="file" variant="h6" color="primary">
            {'Correlator Settings'}
          </Typography>
        </Breadcrumbs>

        <Button variant="text" onClick={addNewCorrSetting}
          startIcon={<ControlPointIcon />}>
          Add Setting
        </Button>

        <Stack direction={'row'} alignItems={'center'} width={'250px'}
          spacing={1} justifyContent="flex-end">
          <IconButton aria-label="import" color='primary'>
            <InputIcon />
          </IconButton>

          <IconButton aria-label="delete" color='primary'>
            <SaveIcon />
          </IconButton>
        </Stack>
      </Stack>

      <Stack spacing={2} direction={'row'}
        sx={{
          flexGrow: 4,
          border: 'solid 1px #eeeeee',
          borderRadius: '5px',
          height: 'calc(100% - 80px)',
          overflow: 'hidden'
        }}>
        <Box sx={{ width: '25%', height: '100%', overflow: 'scroll',
                    backgroundColor: '#fafafa'}}>
          <List sx={{ padding: 0}}>
            {projectContext.correlatorSetting.map((row, index) => (
              <ListItem
                key={'corr-setting-' + index}
                onClick={e => handleSelectSetting(index)}
                sx={{ 
                  backgroundColor: index === selectedCorrSetting ? '#eeeeee' : 0 
                }}
                secondaryAction={
                  (index === selectedCorrSetting) &&
                  <React.Fragment>
                    <IconButton disabled={index !== selectedCorrSetting}
                      onClick={deleteCorrSetting} edge="end" aria-label="delete">
                      <DeleteOutlineIcon />
                    </IconButton>
                    <IconButton disabled={index !== selectedCorrSetting}
                      edge="end" aria-label="delete">
                      <ContentCopyOutlinedIcon />
                    </IconButton>
                  </React.Fragment>
                }>
                <ListItemText
                  primary={row['name']}
                  secondary={
                    <Typography variant="body2" 
                      sx={{color: 'red'}}>
                      500kB/s
                    </Typography>
                  } />
              </ListItem>
            ))}
          </List>
        </Box>

        <Box
          sx={{ width: '80%', padding: '15px'}}
          style={{margin: 0, borderLeft: 0}}
        >
          {selectedCorrSetting>=0 && CustomModeBox}
        </Box>
      </Stack>
    </Stack>
  )
}
