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
import { Amplify, Auth } from 'aws-amplify'

import './App.css';
import { Alert, Snackbar } from '@mui/material';

const SERVER_ROOT_URL = process.env.REACT_APP_SERVER_ROOT_URL;

Amplify.configure({
  "API": {
    "endpoints": [
      {
        "name": "hello",
        "endpoint": "https://mzceiq8h3b.execute-api.us-east-1.amazonaws.com/api"
      },
      {
        "name": "cabb",
        "endpoint": SERVER_ROOT_URL
      }
    ]
  },
  Auth: {
    // REQUIRED only for Federated Authentication - Amazon Cognito Identity Pool ID
    // identityPoolId: 'XX-XXXX-X:XXXXXXXX-XXXX-1234-abcd-1234567890ab',

    // REQUIRED - Amazon Cognito Region
    region: 'us-east-1',

    // OPTIONAL - Amazon Cognito Federated Identity Pool Region
    // Required only if it's different from Amazon Cognito Region
    // identityPoolRegion: 'XX-XXXX-X',

    // OPTIONAL - Amazon Cognito User Pool ID
    userPoolId: 'us-east-1_oSMtMT3nD',

    // OPTIONAL - Amazon Cognito Web Client ID (26-char alphanumeric string)
    userPoolWebClientId: '44pap5hu4e804d1rlkhq4r77a6',

    // OPTIONAL - Enforce user authentication prior to accessing AWS resources or not
    mandatorySignIn: true,

    // OPTIONAL - This is used when autoSignIn is enabled for Auth.signUp
    // 'code' is used for Auth.confirmSignUp, 'link' is used for email link verification
    // signUpVerificationMethod: 'code', // 'code' | 'link'

    // OPTIONAL - Configuration for cookie storage
    // Note: if the secure flag is set to true, then the cookie transmission requires a secure protocol
    cookieStorage: {
      // REQUIRED - Cookie domain (only required if cookieStorage is provided)
      domain: 'scheduler-dev.bigcat-test.org',
      // OPTIONAL - Cookie path
      path: '/',
      // OPTIONAL - Cookie expiration in days
      expires: 365,
      // OPTIONAL - See: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie/SameSite
      // 'strict' | 'lax'
      sameSite: 'strict',
      // OPTIONAL - Cookie secure flag
      // Either true or false, indicating if the cookie transmission requires a secure protocol (https).
      secure: true,
    },

    // OPTIONAL - customized storage object
    // storage: MyStorage,

    // OPTIONAL - Manually set the authentication flow type. Default is 'USER_SRP_AUTH'
    // authenticationFlowType: 'USER_PASSWORD_AUTH',

    // OPTIONAL - Manually set key value pairs that can be passed to Cognito Lambda Triggers
    // clientMetadata: { myCustomKey: 'myCustomValue' },

    // OPTIONAL - Hosted UI configuration
    oauth: {
      domain: 'bigcat.auth.us-east-1.amazoncognito.com',
      scope: [
        'phone',
        'email',
        'openid',
      ],
      redirectSignIn: 'https://scheduler-dev.bigcat-test.org/bigcat-app/',
      redirectSignOut: 'https://scheduler-dev.bigcat-test.org/bigcat-app/',
      responseType: 'code', // or 'token', note that REFRESH token will only be generated when the responseType is code
    },
  },
});

function App() {
  const location = useLocation();
  const [authorised, setAuthorised] = React.useState(false);

  // Hub.listen('auth', ({ payload: { event, data } }) => {
  //   switch (event) {
  //     case 'signIn':
  //       console.log('sign in', event, data)
  //       // this.setState({ user: data})
  //       break
  //     case 'signOut':
  //       console.log('sign out')
  //       // this.setState({ user: null })
  //       break
  //   }
  // });

  // check if a user is loggin, redirect to login page if not
  Auth.currentSession()
    .then((data: any) => {
      console.log('user logged in: ' + data['idToken']['payload']['email']);
      // make sure user is in the right group
      const groups = data['idToken']['payload']['cognito:groups'];
      console.log('user logged in: ' + groups);
      if (groups && groups.includes('bigcat')) {
        console.log('user logged in and in right ');
        setAuthorised(true);
      }
    })
    .catch((err) => {
        console.log('not logged in: ' + err);
        Auth.federatedSignIn()
    });

  return (
    <div className="App">
      <CabbAppBar />
      {authorised ? (
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
        )
        :
        (
          <Alert severity="error">
            You are not authorised to access this application. Please contact 'email' for help.
          </Alert>
        )
      }
    </div>
  );
}

export default App;
