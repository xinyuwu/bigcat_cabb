import { Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, Box, Snackbar, Alert } from "@mui/material";
import * as React from "react";
import FileBrowser from "./FileBrowser";
import call_API from '../util/CognitoAuthorizor';

const SERVER_ROOT_URL = process.env.REACT_APP_SERVER_ROOT_URL;

export default function OpenFileDialog(
  props: {
    open: boolean,
    handleOpen: (filename: string) => void,
    handleCancel: () => void,
    itemSelectionAllowed: (item: any) => boolean
  }
) {
  const [selectedItem, setSelectedItem] = React.useState<any>(null);
  const [paths, setPaths] = React.useState<any[]>([]);
  const [openSnack, setOpenSnack] = React.useState(false);

  
  React.useEffect(() => {
    if (props.open) {
      // get directories from the backend
      call_API('cabb', '/list', handleReponse, handleError);
    }
  }, [props.open]);

  const handleReponse = (response: any) => {
    setPaths(response as any[]);
  }

  const handleError = (error: any) => {
    setOpenSnack(true);
  }

  const handleCancel = () => {
    setSelectedItem(null);
    props.handleCancel();
  }

  const handleOpen = () => {
    const path = selectedItem['path'] ? selectedItem['path'] : [];
    let filename = path.length > 0 ? path.join('/') + '/' : '';
    filename += selectedItem ? selectedItem['name'] : '';

    if (filename)
      props.handleOpen(filename);
  }

  return (
    <Dialog open={props.open} PaperProps={{ sx: {height: '70%'} }}
    maxWidth="md" fullWidth>
      <DialogTitle id="file-browser-dialog-title">
        {'Open project'}
      </DialogTitle>
      <DialogContent>
        <Box sx={{height: '100%'}} >
          <FileBrowser
            paths={paths}
            setSelectedItem={setSelectedItem}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button autoFocus 
          disabled={!props.itemSelectionAllowed(selectedItem)}
          onClick={handleOpen}>
          Open
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
          Could not retrieve directory from server!
        </Alert>
      </Snackbar>
    </Dialog>
  );
};
