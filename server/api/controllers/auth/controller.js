import AuthService from '../../services/auth.service';
export class Controller {
  getAccessToken(req, res) {
    console.log('hello auth');
    AuthService
    .getAccess(req.body)
    .then(r => res.json(r));
  }

  
}
export default new Controller();