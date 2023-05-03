import * as React from 'react';

import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import { TableContainer, Paper, Table, TableHead, TableRow, 
        TableCell, TableBody, Chip, IconButton, Box, FormControl, 
        InputLabel, MenuItem, TextField } from '@mui/material';
import SubBandView from './SubBandView';
import ConfirmationDialog from '../util/ConfirmationDialog';
import * as ATCAConstants from '../util/ATCAConstants'
import { ProjectContext } from './ProjectContext';


const zoom_configurations = ATCAConstants.correlator_configurations[2].zoom || [];

export default function SubBandBox(props: {
  corrSetting: any,
  setSubBandConfigs: (subBandConfigs: any[]) => void,
}) {
  const projectContext = React.useContext(ProjectContext);

  const [showConfirmationIndex, setShowConfirmationIndex] = React.useState(-1);
  const [subBandConfigs, setSubBandConfigs] = 
    React.useState<any[]>(props.corrSetting['sub_band_configuration'] || []);

  React.useEffect(() => {
    setSubBandConfigs(props.corrSetting['sub_band_configuration'] || []);
  }, [props.corrSetting]);

  const hasSubBands = () => {
    // corrmode is valid
    // corrconfig is valid
    // and corrconfig has zoom or spectral windows
    const corrModeName = props.corrSetting['band_configuration'];
    const corrModes = projectContext.bandConfiguration.filter(c => {
      return c['name'] === corrModeName;
    });

    if (corrModes.length < 1)
      return false;

    const corrConfigName = props.corrSetting['correlator_configuration'];
    const corrConfigs = ATCAConstants.correlator_configurations.filter(c => {
      return c['name'] === corrConfigName;
    });

    if (corrConfigs.length < 1)
      return false;

    if (corrConfigs[0].number_of_spectral_windows > 0 ||
          corrConfigs[0].number_of_zoom_windows > 0 )
      return true;

    return false;
  }

  const sortSubBandConfigs = (configs: any[]) => {
    const sortedList = configs.sort((a: any, b: any) => {
      if (a['band'] === b['band']) {
        if (a['subband'] === b['subband']) {
          return 0;
        }
        return (a['subband'] < b['subband']) ? -1 : 1;
      }
      return a['band'] < b['band'] ? -1 : 1;
    });

    setSubBandConfigs(sortedList);
    props.setSubBandConfigs(sortedList);
  }

  const deleteSubBandConfig = (selectedBand: number) => {
    setShowConfirmationIndex(selectedBand);
  }

  const handleConfirmationNo = () => {
    setShowConfirmationIndex(-1);
  }

  const handleConfirmationYes = () => {
    const newConfigs = [...subBandConfigs];
    newConfigs.splice(showConfirmationIndex, 1);
    props.setSubBandConfigs(newConfigs);

    setShowConfirmationIndex(-1);
  }

  const getCorrConfig = () => {
    const corrConfigName = props.corrSetting['correlator_configuration'];
    const corrConfigs = ATCAConstants.correlator_configurations.filter(c => {
      return c['name'] === corrConfigName;
    });

    if (corrConfigs.length > 0 ) {
      return corrConfigs[0];
    }
    return {};
  }

  const getCorrMode = () => {
    const modes = projectContext.bandConfiguration;
    const selectedMode = modes.filter(m => {
      return m['name'] === props.corrSetting['band_configuration'];
    });
    if (selectedMode.length > 0) {
      return selectedMode[0];
    }
    return {};
  }

  const getZoomFreqConfig = (band: number, subband: number) => {
    const configs = subBandConfigs.filter((config) => {
      return(config['band'] === band) && (config['subband'] === subband);
    });
    if (configs.length > 0) {
      const config = configs[0];
      return [config['zoom'], config['center_freq']];
    }
    return ['', 0];
  }

  const setZoomConfig = (event: SelectChangeEvent, band: number, subband: number) => {
    const configs = subBandConfigs.filter((config) => {
      return (config['band'] === band) && (config['subband'] === subband);
    });
    if (configs.length > 0) {
      const config = configs[0];
      config['zoom'] = event.target.value as string;
      props.setSubBandConfigs([...subBandConfigs]);
    }
  }

  const setCentreFreq = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, 
    band: number, subband: number) => {
    const configs = subBandConfigs.filter((config) => {
      return (config['band'] === band) && (config['subband'] === subband);
    });
    if (configs.length > 0) {
      const config = configs[0];
      config['center_freq'] = event.target.value;
      props.setSubBandConfigs([...subBandConfigs]);
    }
  }

  const subBandTable = (
    <TableContainer component={Paper} sx={{ 
      width: 'calc(100% - 10px)', height: 'calc(100% - 30px)' }}>
      <Table aria-label="simple table">
        <TableHead>
          <TableRow>
            <TableCell width={'5%'} align="center">Band</TableCell>
            <TableCell width={'5%'} align="center">Sub Band</TableCell>
            <TableCell width={'20%'} align="center">Frequency Range (GHz)</TableCell>
            <TableCell width={'20%'} align="center">Zoom Config</TableCell>
            <TableCell width={'30%'} align="center">Center Frequency (GHz)</TableCell>
            <TableCell width={'15%'} align="center">Data Rate (kB/sec)</TableCell>
            <TableCell align="center"></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {subBandConfigs.map((row: any, index: number) => (
            <TableRow
              key={'row-' + row['band'] + '-' + row['subband'] + '-' + index}
              sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
            >
              <TableCell align="center">{row.band}</TableCell>
              <TableCell align="center">{row.subband}</TableCell>
              <TableCell align="center">
                {ATCAConstants.getStartFreq(getCorrMode(), row['band'], row['subband']) + ' - ' 
                  + ATCAConstants.getEndFreq(getCorrMode(), row['band'], row['subband']) }
              </TableCell>
              <TableCell align="center">
                <FormControl fullWidth variant="standard" sx={{ height: '70px' }}>
                  <InputLabel id="zoom-selection">Zoom band</InputLabel>
                  <Select
                    labelId="zoom-selection-label"
                    id="zoom-selection-value"
                    label="Zoom band"
                    displayEmpty={true}
                    renderValue={(selected: any) => {
                      if (selected)
                        return selected;
                      else
                        return '';
                    }}
                    value={getZoomFreqConfig(row['band'], row['subband'])[0] || ''}
                    onChange={(e) => setZoomConfig(e, row['band'], row['subband'])}
                  >
                    {zoom_configurations.map((config) => (
                      <MenuItem key={config['name']} value={config['name']}>
                        {config['name'] + ': [ ' +
                          'points: ' + config['points'] +
                          ' resolution: ' + config['spectral_resolution'].toFixed(3) + config['unit'] +
                          ' band width: ' + (config['points'] * config['spectral_resolution']).toFixed(3) + 'MHz]'
                        }
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>  
              </TableCell>

              <TableCell align="center">
                <TextField id={`center-freq-{index}`} label="Centre Frequency"
                  variant="standard" sx={{ flexGrow: 1 }}
                  helperText={' '}
                  value={getZoomFreqConfig(row['band'], row['subband'])[1] || ''}
                  fullWidth
                  onChange={(e) => setCentreFreq(e, row['band'], row['subband'])}
              />
              </TableCell>

              <TableCell align="center">
                <Chip label={row.data_rate} size="medium"
                  sx={{
                    minWidth: '150px',
                    color: 'black', backgroundColor: '#c8e6c9',
                  }}
                />
              </TableCell>

              <TableCell align="center">
                <IconButton color='primary'
                  onClick={(e) => deleteSubBandConfig(index)}
                >
                  <DeleteOutlineIcon />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  return (
    <React.Fragment>
      <ConfirmationDialog open={showConfirmationIndex > -1}
        title={'Confirm delete sub band configuration'}
        message={'Do you want to delete the sub band configuration?'}
        handleNo={handleConfirmationNo}
        handleYes={handleConfirmationYes}
      />

      {hasSubBands() &&
        <React.Fragment>
          <SubBandView
            subBandConfigs={subBandConfigs}
            setSubBandConfigs={sortSubBandConfigs}
            corrMode={getCorrMode()}
            corrConfig={getCorrConfig()}
          />

          <Box sx={{ marginTop: '10px', padding: '5px', 
            width: '100%', height: 'calc(100vh - 350px)' }}>
            {subBandTable}
          </Box>
        </React.Fragment>
      }
      
    </React.Fragment>
  );

};
