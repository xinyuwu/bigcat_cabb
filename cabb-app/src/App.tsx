import { Box, Stack } from '@mui/system';
import React from 'react';
import { Route, Routes } from 'react-router-dom';
import CabbAppBar from './components/CabbAppBar';
import NavigationMenu from './components/NavigationMenu';
import Project from './project/Project';
import BandConfigurationView from './schedule/BandConfigurationView';
import CorrelatorConfigurationView from './schedule/CorrelatorConfigurationView';
import Schedule from './schedule/Schedule';
import ProjectContextProvider from './schedule/ProjectContext';
import { useLocation } from 'react-router-dom';
import TargetCatalogueView from './schedule/TargetCatalogueView';
import ScheduleContextProvider from './schedule/ScheduleContext';

function App() {
  const location = useLocation();

  return (
    <div className="App">
      <CabbAppBar />
      <ProjectContextProvider>
        <Stack direction={'row'}>
          {location.pathname !== '/' && <NavigationMenu />}
          <Box sx={{flexGrow: 4}}>
            <Routes>
              <Route path='/' element={
                <Project />
              } />
              <Route path='/target-catalogue' element={
                <TargetCatalogueView />
              } />
              <Route path='/schedule-editor' element={
                <ScheduleContextProvider>
                  <Schedule />
                </ScheduleContextProvider>
              } />
              <Route path='/band-config' element={
                <BandConfigurationView />
              } />
              <Route path='/correlator-setting' element={
                <CorrelatorConfigurationView />
              } />
            </Routes>
          </Box>
        </Stack>
      </ProjectContextProvider>
    </div>
  );
}

export default App;
