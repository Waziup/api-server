import UserService from '../../services/user.service';
export class Controller {
    all(req, res) {
        UserService
        //get access token from auth header and send it to service
            .all(req.get("Authorization").split(" ").pop())
            .then(r => res.json(r));
    }

    byId(req, res) {
        UserService
            .byId(req.params.id, req.get("Authorization").split(" ").pop())
            .then(r => {
                if (r) res.json(r)
                else res.status(404).end();
            });
    }
    update(req, res) {
        UserService
            .update(req.params.id, req.get("Authorization").split(" ").pop(), req.body)
            .then(r => {
                if (r) res.json(r)
                else res.status(404).end();
            });
    }
}
export default new Controller();