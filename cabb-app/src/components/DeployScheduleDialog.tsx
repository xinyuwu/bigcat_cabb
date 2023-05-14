import * as React from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, Box, Snackbar, Alert, TextField, Typography } from "@mui/material";
import { Stack } from "@mui/system";
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';

export default function DeployScheduleDialog(
  props: {
    open: boolean,
    project: string,
    schedule_content: string,
    filename: string,
    handleDeploy: () => void,
    handleCancel: () => void,
  }
) {
  const [openSnack, setOpenSnack] = React.useState(false);
  
  const handleCancel = () => {
    props.handleCancel();
  }

  const handleDeploy = () => {
    props.handleDeploy();
  }

  const get_full_deploy_name = () => {
    let full_name = 'wu049-' + props.project + '-' + props.filename.replace('.sch', '')
    full_name = full_name.replace('/', '-')
    full_name += '.json'

    return full_name;
  }

  const handleDownload = () => {
    let filename = get_full_deploy_name();
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + props.schedule_content);
    element.setAttribute('download', filename);

    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <Dialog open={props.open} PaperProps={{ sx: {height: '80%'} }}
      maxWidth="md" fullWidth>
      <DialogTitle id="file-browser-dialog-title">
        {`Deploy ${props.filename} to ATCA`}
      </DialogTitle>
      <DialogContent sx={{height: '100%'}}>
        <Stack spacing={3} sx={{ height: '100%' }}>
          <Stack direction={'row'} alignItems={'flex-end'}
          justifyContent={'space-between'}>
            <TextField id="atca_filename" 
              label="File name deployed to ATCA" 
              variant="standard" 
              defaultValue={get_full_deploy_name()}
              sx={{width: '80%'}}
            />
            <Button variant="text"
              onClick={handleDownload}
              startIcon={<DownloadOutlinedIcon />}>
              Download
            </Button>            
          </Stack>
          <Box
            sx={{ 
              border: '1px solid #bdbdbd',
              borderRadius: '10px',
              padding: '10px',
              height: '100%',
              overflow: 'scroll'
            }}
          >
            <pre style={{width:'100%'}}>
              {props.schedule_content}
            </pre>
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button autoFocus
          onClick={handleDeploy}>
          Deploy
        </Button>
        <Button onClick={handleCancel}>
          Cancel
        </Button>
      </DialogActions>

      <Snackbar
        open={openSnack}
        autoHideDuration={6000}
        onClose={e => setOpenSnack(false)}
      >
        <Alert severity="error">
          Could not list files in project!
        </Alert>
      </Snackbar>
    </Dialog>
  );
};
