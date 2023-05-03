import * as React from 'react';
import Stack from '@mui/material/Stack';
import { Checkbox, Divider, IconButton, ListItemText, 
  Paper, Tooltip, Typography} from '@mui/material';
import Menu from '@mui/material/Menu';
import TextField from '@mui/material/TextField';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import PreviewIcon from '@mui/icons-material/Preview';
import CompareIcon from '@mui/icons-material/Compare';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';

import 'dayjs/locale/en-gb';
import dayjs from 'dayjs';

import * as ATCAConstants from '../util/ATCAConstants'

import SourceGraph from '../graphs/SourceGraph';
import {ProjectContext} from './ProjectContext';
import {ScheduleContext} from './ScheduleContext';

const ITEM_HEIGHT = 35;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 12 + ITEM_PADDING_TOP,
      // width: 250,
    },
  },
};


export default function ScanEditor(
  props: {
    scan: any,
    setScan: (s: any) => void,
}) {
  const projectContext = React.useContext(ProjectContext);
  const scheduleContext = React.useContext(ScheduleContext);
  
  const [scanView, setScanView] = React.useState('form');

  const [scan, setScan] = React.useState<any>(props.scan);
  const [dateMenuAnchorEl, setDateMenuAnchorEl] = React.useState<null | HTMLElement>(null);
  const [utcDate, setUTCDate] = React.useState<Date>(new Date());

  React.useEffect(() => {
    setScan(props.scan);
  }, [props.scan])

  const handleDateMenu = (event: React.MouseEvent<HTMLElement>) => {
    setDateMenuAnchorEl(event.currentTarget);
  };

  const onChangesUTCDate = (newValue: any) => {
    if (newValue) {
      setUTCDate(newValue.toDate());
    }
    setDateMenuAnchorEl(null);
  }

  const toggleTargetView = () => {
    if (scanView === 'form') {
      setScanView('graph');
    } else {
      setScanView('form');
    }
  }

  const setScanValue = (value: any, fieldName: string) => {
    const newScan = { ...scan, [fieldName]: value};
    props.setScan(newScan);
  }

  const handleScanIntentChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    const calCodes: string[] = (typeof value === 'string') ? value.split(',') : value;
    setScanValue(calCodes, 'scan_intents')
  }

  const GraphView = (
    <SourceGraph utcDate={utcDate}
      source={scan}/>
  );

  const SourceConfig = (
    <Stack spacing={3}>

      <Stack direction={'row'} spacing={3} 
        sx={{ alignItems: 'flex-end', width: '90%' }}>

        <FormControl variant="standard" 
          sx={{ width: 'calc(90% - 50px)', maxWidth: '700px'}}>
          <InputLabel id="scan-intent-label">Intents</InputLabel>
          <Select
            labelId="scan-intent-label"
            id="scan-intents"
            label="Intents"
            displayEmpty={true}
            multiple
            value={(scan['scan_intents'] || []) as string[]}
            onChange={handleScanIntentChange}
            renderValue={(selected) => selected.join(', ')}
            MenuProps={MenuProps}
          >
            <Typography variant='h6' color={'primary'} sx={{marginLeft: '30px'}}>Normal</Typography>
            {ATCAConstants.SCAN_INTENTS['normal'].map((intent) => (
              <MenuItem key={intent['name']} value={intent['name']}>
                <Checkbox checked={(scan['scan_intents'] || []).indexOf(intent['name']) > -1} />
                <ListItemText primary={intent['name']} />
              </MenuItem>
            ))}

            {
              Boolean(scheduleContext.getScheduleInfo()['advance_mode']) &&
              <React.Fragment>
                <Divider />

                <Typography variant='h6' color={'primary'} sx={{ marginLeft: '30px' }}>Advanced</Typography>
                {ATCAConstants.SCAN_INTENTS['advanced'].map((intent) => (
                  <MenuItem key={intent['name']} value={intent['name']}>
                    <Checkbox checked={(scan['scan_intents'] || []).indexOf(intent['name']) > -1} />
                    <ListItemText primary={intent['name']} />
                  </MenuItem>
                ))}
              </React.Fragment>
            }
          </Select>
        </FormControl>

        <Tooltip title="Search Calibrator">
          <IconButton color="primary" aria-label="setting" sx={{width: '50px'}}>
            <CompareIcon />
          </IconButton>
        </Tooltip>
      </Stack>
      
      <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-end' }}>
        <TextField id="duration" label="Duration" variant="standard" 
          value={scan['duration'] || 0}
          onChange={(e) => setScanValue(Number(e.target.value), 'duration')}
          sx={{ maxWidth: '40%', flexGrow: '1' }} />

        {
          scheduleContext.getScheduleInfo()['schedule_type'] === 'lst'
          &&
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <TimePicker label="LST Start time"
              format="HH:mm"
              value={dayjs(scan['lst_start_time'] || '', 'HH:mm')}
              onChange={(e) => setScanValue(e ? e.format('HH:mm') : '', 'lst_start_time')}
            />
          </LocalizationProvider>
        }

        {
          scheduleContext.getScheduleInfo()['schedule_type'] === 'utc'
          &&
          <React.Fragment>
              <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale={'en-gb'}>
                <DateTimePicker label="UTC start date and time" 
                  sx={{ maxWidth: '40%', flexGrow: '1' }} 
                  format='L HH:mm'
                  value={dayjs(scan['utc_start_date'] || '', 'YYYY-MM-DD HH:mm')}
                  onChange={(e) => setScanValue(e ? e.format('YYYY-MM-DD HH:mm') : '', 'utc_start_date')}
                />
              </LocalizationProvider>
          </React.Fragment>
        }

      </Stack>

      <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-end' }}>
        <FormControl variant="standard" sx={{ flexGrow: '1' }}>
          <InputLabel id="scan-type-label">Scan Type</InputLabel>
          <Select
            labelId="scan-type-label"
            displayEmpty={true}
            id="scan-type"
            label="Type"
            value={scan['scanType'] || ''}
            onChange={(e) => setScanValue(e.target.value, 'scanType')}
          >
            {
              ATCAConstants.SCAN_TYPES.map((type) => (
                <MenuItem key={type} value={type}>{type}</MenuItem>
              ))
            }
          </Select>
        </FormControl>

        <FormControl variant="standard" sx={{ flexGrow: '1' }}>
          <InputLabel id="pointing-label">Pointing</InputLabel>
          <Select
            labelId="pointing-label"
            displayEmpty={true}
            id="pointing"
            label="Pointing"
            value={scan['pointing'] || ''}
            onChange={(e) => setScanValue(e.target.value, 'pointing')}
          >
            {
              ATCAConstants.POINTINGS.map((type) => (
                <MenuItem key={type} value={type}>{type}</MenuItem>
              ))
            }
          </Select>
        </FormControl>
      </Stack>

      <FormControl variant="standard">
        <InputLabel id="correlator-setting">Correlator Setting</InputLabel>
        <Select
          displayEmpty={true}
          labelId="cor-setting-label"
          id="cor-setting-select-value"
          label="Correlator Setting"
          value={scan['correlator_setting'] || ''}
          onChange={(e) => setScanValue(e.target.value, 'correlator_setting')}
        >
          {
            projectContext.correlatorSetting.map((type, index) => (
              <MenuItem key={type['name'] + '-' + index} value={type['name']}>
                {type['name']}
              </MenuItem>
            ))
          }
        </Select>
      </FormControl>

    </Stack>
  );

  const DateMenu = (
    <Menu
      PaperProps={{ sx: { width: '300px', height: '350px'} }}
      id="menu-appbar"
      anchorEl={dateMenuAnchorEl}
      anchorOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
      keepMounted
      transformOrigin={{
        vertical: -30,
        horizontal: 'right',
      }}
      open={Boolean(dateMenuAnchorEl)}
      onClose={e => setDateMenuAnchorEl(null)}
      sx={{alignContent: 'flex-end'}}
    >
      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale={'en-gb'}>
        <DateCalendar 
          value={dayjs(utcDate)}
          onChange={(e) => onChangesUTCDate(e)}
        />
      </LocalizationProvider>
    </Menu>
  )

  return (
    <React.Fragment>
      {
        (Boolean(scan)) && 
          <Paper sx={{ flexGrow: 4, marginLeft: '10px', padding: '10px' }}>
            <Tooltip title={ scanView === 'form' ? 'Graph View' : 'Form View'}>
              <IconButton color="primary" aria-label="toggle-view" 
                sx={{position: 'fixed', top: '385px', right: '20px'}}
                onClick={toggleTargetView}>
                <PreviewIcon />
              </IconButton>    
            </Tooltip>

            { scanView === 'graph' &&
              <Tooltip title={'Change graph UTC date'}>
                <IconButton color="primary" aria-label="change-date"
                  sx={{ position: 'fixed', top: '385px', right: '50px' }}
                  onClick={handleDateMenu}>
                  <CalendarMonthIcon />
                </IconButton>
              </Tooltip>
            }
            {DateMenu}
            {(scanView==='form' ? SourceConfig : GraphView)}
          </Paper>
      }
    </React.Fragment>
  )
}