import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import React from 'react';
import { useLocation } from 'react-router-dom';

const SERVER_ROOT_URL = process.env.REACT_APP_SERVER_ROOT_URL;

export const INIT_SCHEDULE_FILE = {
  document: 'ATCA BIGCAT scheduler file',
  version: '1.0',
  schedule_info: {
    owner: '',
    observer: '',
    proposal_code: '',
    schedule_type: 'relative',
    utc_start_time: '',
    utc_start_date: '',
    lst_start_time: ''
  },
  scans: [],
};

export const ScheduleContext = React.createContext({
  filename: '' as string,
  projectName: '' as string,
  getScheduleInfo: (): any => { return {} },
  getScans: () : any[] => { return []},
  updateScheduleInfo: (scheduleInfo: any) => {},
  updateScans: (scans: any[]) => { },

  saveSchedule: () => {},
  saveAsSchedule: (fname: string) => { },
  isDirty: false, 
  setIsDirty: (d: boolean) => { },
});

export default function ScheduleContextProvider(props: any) {
  const location = useLocation();
  const [snackMessage, setSnackMessage] = React.useState<any>(null);

  const [schedule, setSchedule] = React.useState<any>(INIT_SCHEDULE_FILE);
  const [projectName, setProjectName] = React.useState<string>('');
  const [filename, setFilename] = React.useState<string>('');

  const [isDirty, setIsDirty] = React.useState<boolean>(false);


  React.useEffect(() => {
    console.log('schedule - load schedule file')
    const queryParams = new URLSearchParams(location.search);
    let projectName: string = queryParams.get('project')!;
    const fname: string = queryParams.get('file')!;

    setProjectName(projectName ? projectName : '');
    setFilename(fname ? fname : '');

    if (!projectName) {
      setSnackMessage({
        severity: 'error',
        message: 'No project provided!'
      });
      return;
    }

    if (!fname) {
      // new schedule, deep copy schedule 
      const newSchedule = JSON.parse(JSON.stringify(INIT_SCHEDULE_FILE));
      setSchedule(newSchedule);

      return;
    }

    const fullfilename = projectName + '/' + fname;
    fetch(`${SERVER_ROOT_URL }/get_file_content?filename=${encodeURIComponent(fullfilename)}`)
      .then(
        response => response.json()
      )
      .then((response) => {
        if (response['status'] === 'success') {
          const fileContent = response['file_content'];
          setSchedule(fileContent);
        } else {
          let message = response['message'];
          if (!message)
            setSnackMessage({
              severity: 'error',
              message: 'Could not retrieve schedule file from server!'
            });
        }
      })
      .catch((err: Error) => {
        setSnackMessage({
          severity: 'error',
          message: 'Could not retrieve schedule file from server!'
        });
      });
  }, [location]);

  const getScheduleInfo = () => {
    return schedule['schedule_info'];
  }

  const getScans = (): any[] => {
    return schedule['scans'];
  }

  const updateScheduleInfo = (scheduleInfo: any) => { 
    setSchedule({
      ...schedule,
      'schedule_info': scheduleInfo
    });
    setIsDirty(true);
  }

  const updateScans = (scans: any[]) => { 
    setSchedule({
      ...schedule,
      'scans': scans
    })
    setIsDirty(true);
  }

  const saveSchedule = () => {
    if (filename) {
      saveAsSchedule(filename);
    }
  }

  const saveAsSchedule = (fname: string) => {
    if (fname) {
      const fullfilename = projectName + '/' + fname;
      const data = {
        filename: fullfilename,
        content: schedule
      };
      fetch(`${SERVER_ROOT_URL}/save_file`, {
        method: 'POST', body: JSON.stringify(data)
      })
      .then(
        response => response.json()
      )
      .then((response) => {
        if (response['status'] === 'success') {
          setIsDirty(false);
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
  }

  return (<ScheduleContext.Provider value={{
    getScheduleInfo: getScheduleInfo,
    getScans: getScans,
    updateScheduleInfo: updateScheduleInfo,
    updateScans: updateScans,
    filename: filename,
    projectName: projectName,
    saveSchedule: saveSchedule,
    saveAsSchedule: saveAsSchedule,
    isDirty: isDirty, 
    setIsDirty: setIsDirty
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

  </ScheduleContext.Provider>);
}
