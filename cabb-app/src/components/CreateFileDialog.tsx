import { Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, Box, Snackbar, Alert, TextField } from "@mui/material";
import * as React from "react";
import FileBrowser from "./FileBrowser";

export default function CreateFileDialog(
  props: {
    open: boolean,
    handleCreate: (fullfilename: string) => void,
    handleCancel: () => void,
    itemSelectionAllowed: (item: any) => boolean
  }
) {
  const [selectedItem, setSelectedItem] = React.useState<any>(null);
  const [paths, setPaths] = React.useState<any[]>([]);
  const [openSnack, setOpenSnack] = React.useState(false);
  const [newName, setNewName] = React.useState<string>('');

  
  React.useEffect(() => {
    setPaths([]);
    setSelectedItem(null);
    if (props.open) {
      // get directories from the backend
      fetch('/api/list')
        .then(
          response => response.json()
        )
        .then((response) => {
          setPaths(response);
        })
        .catch((err: Error) => {
          setOpenSnack(true);
        });
    }
  }, [props.open]);

  const handleCancel = () => {
    setSelectedItem(null);
    props.handleCancel();
  }

  const handleCreate = () => {
    const directory = selectedItem['path'] ? selectedItem['path'] : [];
    let filename = directory.length > 0 ? directory.join('/') + '/' : '';

    filename += selectedItem ? selectedItem['name'] : '';

    filename += '/' + newName;

    if (filename) {
      const encodedValue = encodeURIComponent(filename);
      // get directories from the backend
      fetch(`/api/create_project?project=${encodedValue}`)
        .then(
          response => response.json()
        )
        .then((response) => {
          if (response['status'] === 'fail') {
            setOpenSnack(true);
            props.handleCreate('');
          }
          props.handleCreate(filename);

        })
        .catch((err: Error) => {
          setOpenSnack(true);
          props.handleCreate('');
        });
    }
  }

  return (
    <Dialog open={props.open} PaperProps={{ sx: {height: '70%'} }}
    maxWidth="md" fullWidth>
      <DialogTitle id="file-browser-dialog-title">
        <TextField fullWidth id="new-project-name" variant="outlined" 
          label="Name of porject to create" 
          value={newName || ''} onChange={e => setNewName(e.target.value)} />
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
          disabled={
            !props.itemSelectionAllowed(selectedItem) || !newName
          }
          onClick={handleCreate}>
          Create
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
          Could not create project!
        </Alert>
      </Snackbar>
    </Dialog>
  );
};
