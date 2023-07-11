import { Auth, API } from 'aws-amplify'

export default function call_API(
  apiName: string, 
  path: string, 
  handleReponse: (response: any) => void,
  handleError: (error: any) => void,
  ) {
    console.log('call api');
  Auth.currentAuthenticatedUser()
    .then((user) => {
      const token = user['signInUserSession']['idToken']['jwtToken'];
      const request = {
        body: {
        },
        headers: {
          Authorization: token
        }
      };

      API.get(apiName, path, request)
      .then((response: any) => {
        handleReponse(response);
      })
      .catch((error: any) =>handleError(error))
    })
    .catch((err: any) => handleError(err));  
};

// export default function call_API(
//   apiName: string,
//   path: string,
//   handleReponse: (response: any) => void,
//   handleError: (error: any) => void,
// ) {
//   const SERVER_ROOT_URL = process.env.REACT_APP_SERVER_ROOT_URL;

//   fetch(`${SERVER_ROOT_URL}${path}`)
//     .then(
//       response => response.json()
//     )
//     .then((response) => {
//       handleReponse(response);
//     })
//     .catch((err: Error) => {
//       handleError(err);
//     });
// };

