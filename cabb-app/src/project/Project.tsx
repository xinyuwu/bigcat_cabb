import * as React from 'react';
import Stack from '@mui/material/Stack';
import CreateNewFolderOutlinedIcon from '@mui/icons-material/CreateNewFolderOutlined';
import FolderOpenOutlinedIcon from '@mui/icons-material/FolderOpenOutlined';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import DriveFolderUploadOutlinedIcon from '@mui/icons-material/DriveFolderUploadOutlined';
import OpenFileDialog from '../components/OpenFileDialog';
import * as ATCAConstants from '../util/ATCAConstants'
import CreateFileDialog from '../components/CreateFileDialog';
import { useNavigate, createSearchParams } from 'react-router-dom';


export default function Project() {
  const navigate = useNavigate();

  const [openCreateProjectFileDialog, setOpenCreateProjectFileDialog] = React.useState(false);
  const [openProjectFileDialog, setOpenProjectFileDialog] = React.useState(false);

  const createProject = () => {
    setOpenCreateProjectFileDialog(true);
  }

  const openProject = () => {
    setOpenProjectFileDialog(true);
  }

  const handleCancelOpenProject = () => {
    setOpenProjectFileDialog(false);
  }

  const handleProject = (fullname: string) => {    
    if (fullname) {
      setOpenCreateProjectFileDialog(false);
      const param = createSearchParams({ project: fullname });
      navigate({pathname: '/target-catalogue', 
        search: `?${param}` });
    }
  }

  const handleCancelCreateProject = () => {
    setOpenCreateProjectFileDialog(false);
  }

  const itemCreateSelectionAllowed = (item: any) => {
    if (item) {
      if (item['is_directory']) {
        if (item['children']) {
          const projectFile = item['children'].filter(
            (file: any) => { return file['name'] === ATCAConstants.PROJECT_FILENAME }
          );
          return (projectFile.length === 0);
        }
      }
    }

    return false;
  }

  const itemSelectionAllowed = (item: any) => {
    if (item) {
      if (item['is_directory']) {
        if (item['children']) {
          const projectFile = item['children'].filter(
            (file: any) => { return file['name'] === ATCAConstants.PROJECT_FILENAME }
          );
          return (projectFile.length > 0);
        }
      }
    }

    return false;
  }

  return (
    <Stack direction={'row'} sx={{height: 'calc(100vh - 150px)'}}>
      <Stack sx={{
          padding: '10px',
          justifyContent: 'center'
        }}>
        <img
          src={'/bigcat-app/atca_image.jpg'}
          alt='atca_image'
        />
      </Stack>
      <Stack spacing={2} 
        sx={{padding: '10px', 
            width: '50%',
            justifyContent: 'center'}}>

        <Typography variant="h3" color='primary' textAlign={'center'} gutterBottom>
          Welcome
        </Typography>
        <Button variant="text" size='large'
          startIcon={<CreateNewFolderOutlinedIcon />}
          onClick={createProject}>
          Create Project
        </Button>

        <Button variant="text" size='large'
          startIcon={<FolderOpenOutlinedIcon />}
          onClick={openProject}>
          Open Project
        </Button>

        <Button variant="text" size='large'
          startIcon={<DriveFolderUploadOutlinedIcon />}
          onClick={openProject}>
          Import Project
        </Button>
      </Stack>

      <OpenFileDialog open={openProjectFileDialog}
        handleOpen={handleProject}
        handleCancel={handleCancelOpenProject}
        itemSelectionAllowed={itemSelectionAllowed}
      />

      <CreateFileDialog open={openCreateProjectFileDialog}
        handleCreate={handleProject}
        handleCancel={handleCancelCreateProject}
        itemSelectionAllowed={itemCreateSelectionAllowed}
      />      
    </Stack>
  )
}
