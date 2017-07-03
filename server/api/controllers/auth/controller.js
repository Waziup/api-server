import AuthService from '../../services/auth.service';
export class Controller {
  getAccessToken(req, res) {
    console.log('hello auth');
    AuthService
    .getAccess()
    .then(r => res.json(r));
  }

  
}
export default new Controller();