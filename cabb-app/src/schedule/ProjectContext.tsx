import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import React from 'react';
import { useLocation } from 'react-router-dom';

const SERVER_ROOT_URL = process.env.SERVER_ROOT_URL;

export const ProjectContext = React.createContext({
  project: {},
  bandConfiguration: [] as any[],
  setBandConfiguration: (config: any[]) => { },
  correlatorSetting: [] as any[],
  setCorrelatorSetting: (config: any[]) => {},
  scheduleFileList: [] as string[],
  targetFile: '',
  setTargetFile: (content: string) => { },
  autoSave: true as boolean,
  setAutoSave: (isAutoSave: boolean) => { },
  saveBandConfiguration: () => {},
  saveCorrelatorSetting: () => { },
  saveFile: (filename: string, content: any) => { },
});

export default function ProjectContextProvider(props: any) {
  const location = useLocation();

  const [snackMessage, setSnackMessage] = React.useState<any>(null);
  const [autoSave, setAutoSave] = React.useState(true);
  const [project, setProject] = React.useState<any>({});
  const [bandConfiguration, setBandConfiguration] = React.useState<any[]>([]);
  const [correlatorSetting, setCorrelatorSetting] = React.useState<any[]>([]);
  const [scheduleFileList, setScheduleFileList] = React.useState<string[]>([]);
  const [targetFile, setTargetFile] = React.useState<string>('');


  React.useEffect(() => {
    // no need to retrieve project if root
    if (location.pathname === '/')
      return;

    // retrieve project from the backend
    const queryParams = new URLSearchParams(location.search);
    const projectName = queryParams.get('project');
    if (!projectName) {
      setSnackMessage({
        severity: 'error',
        message: 'No project provided!'
      });
      return;
    }
    
    fetch(`${SERVER_ROOT_URL}/retrieve_project?project=${encodeURIComponent(projectName)}`)
      .then(
        response => response.json()
      )
      .then((response) => {
        if (response['status'] === 'success') {
          setProject(response['project']);
          setCorrelatorSetting(response['correlator_configuration_file']);
          setBandConfiguration(response['band_configuration_file']);
          setScheduleFileList(response['schedule_files']);
          setTargetFile(response['target_file']);
        } else {
          let message = response['message'];
          if (!message)
            setSnackMessage({
              severity: 'error',
              message: 'Could not retrieve project from server!'
            });
        }
      })
      .catch((err: Error) => {
        setSnackMessage({
          severity: 'error',
          message: 'Could not retrieve project from server!'
        });
      });
  }, [location]);

  const saveCorrelatorSetting = () => {
    const queryParams = new URLSearchParams(location.search);
    const projectName = queryParams.get('project');
    let filename = project['correlator_setting'];
    filename = projectName + '/' + (filename ? filename : 'correlator_configuration.json');
    saveFile(filename, correlatorSetting);
  }

  const saveBandConfiguration = () => {
    const queryParams = new URLSearchParams(location.search);
    const projectName = queryParams.get('project');
    let filename = project['band_configuration'];
    filename = projectName + '/' + (filename ? filename : 'band_configuration.json');
    saveFile(filename, bandConfiguration);
  }

  const handleSetTargetFile = (content: string) => {
    if (autoSave) {
      const queryParams = new URLSearchParams(location.search);
      const projectName = queryParams.get('project');
      const targetfilename = project['target_file'];
      const filename = projectName + '/' + (targetfilename ? targetfilename : 'targets.csv');
      saveFile(filename, content);
    }
  }

  const saveFile = (filename: string, content: any) => {
    const data = {
      filename: filename,
      content: content
    };
    fetch(`${SERVER_ROOT_URL}/save_file`, {
      method: 'POST', body: JSON.stringify(data)
    })
    .then(
      response => response.json()
    )
    .then((response) => {
      if (response['status'] === 'success') {
        setSnackMessage({
          severity: 'success',
          message: 'Changes saved!'
        });
      } else {
        const message = response['message'];
        if (message)
          setSnackMessage({
            severity: 'error',
            message: message
            });
      }
    })
    .catch((err: Error) => {
      setSnackMessage({
        severity: 'error',
        message: 'Could not save changes!'
      });
    });
  }

  return (<ProjectContext.Provider value={{
    project: project,
    bandConfiguration: bandConfiguration,
    setBandConfiguration: setBandConfiguration,
    correlatorSetting: correlatorSetting,
    setCorrelatorSetting: setCorrelatorSetting,
    scheduleFileList: scheduleFileList,
    targetFile: targetFile,
    setTargetFile: handleSetTargetFile,
    autoSave: autoSave,
    setAutoSave: setAutoSave,
    saveBandConfiguration: saveBandConfiguration,
    saveCorrelatorSetting: saveCorrelatorSetting,
    saveFile: saveFile
  }}>
    {props.children}

    <Snackbar
      open={Boolean(snackMessage)}
      autoHideDuration={6000}
      onClose={e => setSnackMessage(null)}
    >
      <Alert severity={snackMessage ? snackMessage.severity : 'error' }>
        {snackMessage ? snackMessage.message : ''}
      </Alert>
    </Snackbar>

  </ProjectContext.Provider>);
}
