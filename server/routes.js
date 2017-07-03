import examplesRouter from './api/controllers/examples/router'
import authRouter from './api/controllers/auth/router'
import userRouter from './api/controllers/users/router'
export default function routes(app) {
  app.use('/api/v1/auth',authRouter);  
  app.use('/api/v1/examples',examplesRouter);
  app.use('/api/v1/users',userRouter);
  
};