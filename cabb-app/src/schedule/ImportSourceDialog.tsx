import { Dialog, DialogTitle, Stack, TextField, DialogContent, 
  Box, DialogActions, FormControl, InputLabel, MenuItem, Select } 
  from "@mui/material";
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Checkbox from '@mui/material/Checkbox';
import Button from '@mui/material/Button';
import * as React from "react";
import * as d3 from "d3";
import * as ATCAConstants from '../util/ATCAConstants'
import {ProjectContext} from "./ProjectContext";

const DEFAULT_IMPORT_SETTING = {
  duration: 300,
  scanType: 'Normal',
  pointing: 'Global',
  correlator_setting: ''
}

export default function ImportSourceDialog(
  props: {
    open: boolean,
    targets: string,
    handleImport: (targets: string[], defaultSetting: any) => void,
    handleCancel: () => void,
  }
) {
  const projectContext = React.useContext(ProjectContext);

  const [targets, setTargets] = React.useState<any[]>([]);
  const [selectedIndex, setSelectedIndex] = React.useState<number[]>([]);
  const [defaultImportSetting, setDefaultImportSetting] = React.useState<any>(DEFAULT_IMPORT_SETTING);

  React.useEffect(() => {
    if (props.open) {
      // convert string to targets
      // get rid of non-ascii characters
      let content = (props.targets as string).replace(/[^\x00-\x7F]/g, "");
      // get rid of coment line
      content = content.replace(/^[#@][^\r\n]+[\r\n]+/mg, '');

      let targets = d3.csvParseRows(content, function (d, i) {
        if (d && d.length > 1)
          return {
            name: d[0].trim(),
            ra: d[1].trim(),
            dec: d[2].trim(),
            epoch: d[3].trim(),
          };
      });
      setTargets(targets);
    }
  }, [props.open, props.targets]);

  const toggleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const selectAll = [...Array(targets.length)].map((_, i) => i);
      setSelectedIndex(selectAll);
    } else {
      setSelectedIndex([]);
    }
  };

  const toggleSelection = (index: number) => {
    let newSelections = [...selectedIndex];
    const i = selectedIndex.indexOf(index);
    if (i < 0) {
      newSelections.push(index);
    } else {
      newSelections.splice(i, 1);
    }

    setSelectedIndex(newSelections.sort((n1, n2) => n1 - n2));
  }

  const setDefaultValue = (fieldName: string, value: any) => {
    setDefaultImportSetting({
      ...defaultImportSetting,
      [fieldName]: value
    })
  }

  return (
    <Dialog open={props.open} PaperProps={{ sx: {height: '70%'} }}
      maxWidth="md" fullWidth>
      <DialogTitle id="file-browser-dialog-title">
        Import Sources from Catalogue
      </DialogTitle>
      <DialogContent>
        <Checkbox
          onChange={toggleSelectAll}
          checked={selectedIndex.length === targets.length && targets.length !== 0}
          indeterminate={
            selectedIndex.length !== targets.length && selectedIndex.length !== 0
          }
          disabled={targets.length === 0}
          inputProps={{
            'aria-label': 'all items selected',
          }}
          sx={{marginLeft: '10px'}}
        />
        <Stack direction={'row'} height={'calc(100% - 50px)'} spacing= {4}>
          <Box sx={{
            height: '100%',
            width: '50%', border: '1px solid #eeeeee',
          }}>
            <List sx={{
              padding: 0, height: '100%', overflowY: 'scroll'
            }}>
              {targets.map((target: any, index) => (
                <ListItem key={`target-${index}`}
                  role="listitem"
                  onClick={e => toggleSelection(index)}
                  sx={{
                    padding: '10px',
                    borderBottom: '1px solid #eeeeee',
                    bgcolor: (selectedIndex.indexOf(index) >= 0) ? '#e0f7fa' : '',
                    "&:hover": {
                      cursor: 'pointer',
                      bgcolor: '#f5f5f5',
                    }
                  }}>
                  <ListItemIcon>
                    <Checkbox
                      checked={selectedIndex.indexOf(index) >= 0}
                      disableRipple
                    />
                  </ListItemIcon>
                  <ListItemText primary={target['name']}
                    secondary={`${target['ra']} ${target['ra']} ${target['epoch']}`}
                  />
                </ListItem>
              ))}
            </List>
          </Box>

          <Stack spacing={4} flexGrow={4}>
            <TextField id="default-duration" label="Default Scan Duration (seconds)"
              value={defaultImportSetting['duration'] || 0}
              onChange={(e) => setDefaultValue('duration', Number(e.target.value))}
              variant="standard" />
            <FormControl fullWidth>
              <InputLabel id="default-scan-type-label">Default Scan Type</InputLabel>
              <Select
                labelId="default-scan-type-label"
                id="default-scan-type"
                label="Default Scan Type"
                displayEmpty={true}
                onChange={e => setDefaultValue('scanType', e.target.value as string)}
                value={defaultImportSetting['scanType'] || ''}
              >
                {
                  ATCAConstants.SCAN_TYPES.map((type) => (
                    <MenuItem key={type} value={type}>{type}</MenuItem>
                  ))
                }
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel id="default-pointing-label">Default Pointing</InputLabel>
              <Select
                labelId="default-pointing-label"
                id="default-pointing"
                label="Default Pointing"
                displayEmpty={true}
                onChange={e => setDefaultValue('pointing', e.target.value as string)}
                value={defaultImportSetting['pointing'] || ''}
              >
                {
                  ATCAConstants.POINTINGS.map((type) => (
                    <MenuItem key={type} value={type}>{type}</MenuItem>
                  ))
                }
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel id="default-corr-setting-label">Default Correlator Setting</InputLabel>
              <Select
                labelId="default-corr-setting-label"
                id="default-corr-setting"
                label="Default Correlator Setting"
                displayEmpty={true}
                onChange={e => setDefaultValue('correlator_setting', e.target.value as string)}
                value={defaultImportSetting['correlator_setting'] || ''}
              >
                {
                  projectContext.correlatorSetting.map((setting, index) => (
                    <MenuItem key={setting['name'] + '-' + index} value={setting['name']}>
                      {setting['name']}
                    </MenuItem>
                  ))
                }
              </Select>
            </FormControl>
          </Stack>

        </Stack>
      </DialogContent>
      <DialogActions>
        <Button autoFocus
          // disabled={isDisableSave()}
          onClick={e => props.handleImport(targets, defaultImportSetting)}
        >
          Import
        </Button>
        <Button onClick={props.handleCancel}>
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
};
