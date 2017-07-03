import UserService from '../../services/user.service';
export class Controller {
  all(req, res) {
    UserService
    //get access token from auth header and send it to service
    .all(req.get("Authorization").split(" ").pop())
    .then(r => res.json(r));
  }

}
export default new Controller();