import { Auth, API } from 'aws-amplify'

export default function call_API(
  apiName: string, 
  path: string, 
  handleReponse: (response: any) => void,
  handleError: (error: any) => void,
  ) {
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

      API.get('cabb', '/list', request)
      .then((response: any) => {
        handleReponse(response);
      })
      .catch((error: any) =>handleError(error))
    })
    .catch((err: any) => handleError(err));  
  
};


