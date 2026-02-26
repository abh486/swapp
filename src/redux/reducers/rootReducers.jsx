import { combineReducers } from 'redux';
import workoutReducer from './workoutReducer';
import dietReducer from './dietReducer';
import chatReducer from './chatReducer';
import cartReducer from './cartReducer';
import multiGymReducer from './multiGymReducer';
import profileReducer from './profileReducer';
import gymsReducer from './gymsReducer';
import notificationReducer from './notificationReducer';
import trainerReducer from './trainerReducer';
import postReducer from './postReducer';
import subscriptionReducer from './subscriptionReducer';
import shopReducer from './shopReducer';

const rootReducer = combineReducers({
  workout: workoutReducer,
  diet: dietReducer,
  chat: chatReducer,
  cart: cartReducer,
  multiGym: multiGymReducer,
  profile: profileReducer,
  gyms: gymsReducer,
  notification: notificationReducer,
  trainer: trainerReducer,
  post: postReducer,
  subscription: subscriptionReducer,
  shop: shopReducer,
});

export default rootReducer;


