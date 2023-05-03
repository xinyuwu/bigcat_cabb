import { Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, Box, Snackbar, Alert, TextField, Switch, FormControlLabel } from "@mui/material";
import { Stack } from "@mui/system";
import * as React from "react";
import FileBrowser from "./FileBrowser";

export default function SaveScheduleDialog(
  props: {
    open: boolean,
    rootPath: string,
    handleSave: (fullfilename: string) => void,
    handleCancel: () => void,
  }
) {
  const [openSnack, setOpenSnack] = React.useState(false);
  const [newName, setNewName] = React.useState<string>('');
  const [files, setFiles] = React.useState<string[]>([]);
  const [replace, setReplace] = React.useState<boolean>(true);
  
  React.useEffect(() => {
    if (props.open) {
      setReplace(false);

      // get files from the backend
      fetch(`/api/list_files?project=${encodeURIComponent(props.rootPath)}`)
        .then(
          response => response.json()
        )
        .then((response) => {
          setFiles(response);
          setNewName('');
        })
        .catch((err: Error) => {
          setOpenSnack(true);
        });
    }
  }, [props.open, props.rootPath]);

  const handleCancel = () => {
    props.handleCancel();
  }

  const handleCreate = () => {
    if (newName) {
      props.handleSave(newName);
    }
  }

  const setSelectedItem = (selectedItem: any) => {
    setNewName(selectedItem['name']);
  }

  const doesFileExist = () => {
    const matchFiles = files.filter(
      (f: any) => {return newName === f['name']}
    );

    return (matchFiles.length > 0);
  }

  const isDisableSave = () => {
    if (!newName)
      return true;

    if (doesFileExist())
      return !replace;

    return false;
  }

  return (
    <Dialog open={props.open} PaperProps={{ sx: {height: '70%'} }}
      maxWidth="md" fullWidth>
      <DialogTitle id="file-browser-dialog-title">
        <Stack direction={'row'} justifyContent={'space-between'}
          alignItems={'center'}>
          <TextField sx={{width: '80%'}}
            id="new-project-name" variant="outlined" 
            label="Schedule File Name"
            value={newName || ''} onChange={e => setNewName(e.target.value)} />
          {
            doesFileExist() 
            &&
            <FormControlLabel
              control={
                <Switch
                  checked={replace}
                  onChange={e => setReplace(e.target.checked)}
                />
              }
              label="Replace"
            />
          }
        </Stack>
      </DialogTitle>
      <DialogContent>
        <Box sx={{height: '100%'}} >
          <FileBrowser
            paths={files}
            setSelectedItem={setSelectedItem}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button autoFocus
          disabled={isDisableSave()}
          onClick={handleCreate}>
          Save
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
