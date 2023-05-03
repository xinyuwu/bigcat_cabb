import * as React from 'react';
import { useDropzone } from 'react-dropzone';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import { useLocation } from 'react-router-dom';
import SaveIcon from '@mui/icons-material/Save';
import { FormControl, FormControlLabel, FormLabel, 
  IconButton, Radio, RadioGroup } from '@mui/material';
import { ProjectContext } from './ProjectContext';

import './TargetCatalogueView.css';

export default function TargetCatalogueView() {
  const queryParams = new URLSearchParams(useLocation().search);
  const projectContext = React.useContext(ProjectContext);
  // merge or replace
  const [addCatalogueAction, setAddCatalogueAction] = React.useState('merge');

  const { getRootProps, getInputProps } = useDropzone
  ({maxFiles: 1, 
    multiple: false,
    accept: { 'text/csv': ['.csv']},
    onDrop: acceptedFiles => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e && e.target) {
          const text = e.target.result as string;
          projectContext.setTargetFile(text);
        }
      }
      reader.readAsText(acceptedFiles[0]);
    }
  });

  return (
    <Stack spacing={2}
      sx={{ padding: 1, flexDirection: 'column' }}>

      <Stack direction={'row'} alignItems={'center'} 
        height={'40px'} justifyContent={'space-between'}>
        <Breadcrumbs separator="›" aria-label="breadcrumb">
          <Typography key="project" variant="subtitle1" color="primary">
            {queryParams.get('project')}
          </Typography>

          <Typography key="project" variant="h6" color="primary">
            {'Target Catalogue'}
          </Typography>
        </Breadcrumbs>

        <FormControl sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }} >
          <FormLabel id="atoa-consulted-label" sx={{ marginRight: '10px' }}>
            Add Catalogue 
          </FormLabel>
          <RadioGroup
            row
            name="additional-catalogue"
            value={addCatalogueAction}
            onChange={e => setAddCatalogueAction(e.target.value)}
          >
            <FormControlLabel value="replace" control={<Radio />} label="Replace" />
            <FormControlLabel value="merge" control={<Radio />} label="Merge" />
          </RadioGroup>
        </FormControl>

        <IconButton aria-label="delete" color='primary'>
          <SaveIcon />
        </IconButton>
      </Stack>

      <Stack className='load-file-content' width={'100%'} >
        <div {...getRootProps({ className: 'dropzone' })}>
          <input {...getInputProps()} />
          <Stack overflow={'scroll'} height={'calc(100vh - 200px)'} 
            style={{ padding: '10px', margin: 0}}>
            {
              projectContext.targetFile.split('\n').map((line, index) => (
                <Typography key={index} gutterBottom>
                  {line}
                </Typography>
              ))
            }
          </Stack>
          <Typography className='hide' sx={{position: 'fixed'}} width={'100%'} 
            textAlign='center'>
            Drag 'n' drop ONE csv file here, or click to select a file
          </Typography>

        </div>
      </Stack>

    </Stack>
  );
}
