import * as React from 'react';
import Button from '@mui/material/Button';
import DialogTitle from '@mui/material/DialogTitle';
import Dialog from '@mui/material/Dialog';
import { DialogActions, DialogContent, DialogContentText } from '@mui/material';

export default function ConfirmationDialog(props: {
  title: string,
  message: string,
  open: boolean,
  handleYes: () => void,
  handleNo: () => void,
}) {
  return (
    <Dialog open={props.open} maxWidth="sm" fullWidth>
      <DialogTitle id="confirmation-dialog-title">
        {props.title}
      </DialogTitle>
      <DialogContent>
        <DialogContentText>
          {props.message}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button autoFocus onClick={props.handleYes}>
          Yes
        </Button>
        <Button onClick={props.handleNo}>
          No
        </Button>
      </DialogActions>
    </Dialog>
  );
};
