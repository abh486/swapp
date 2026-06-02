import { combineReducers } from 'redux';
import workoutReducer from './workoutReducer';
import dietReducer from './dietReducer';
import chatReducer from './chatReducer';
import cartReducer from './cartReducer';
import multiProviderReducer from './multiProviderReducer';
import profileReducer from './profileReducer';
import providersReducer from './providersReducer';
import notificationReducer from './notificationReducer';
import trainerReducer from './trainerReducer';
import postReducer from './postReducer';
import subscriptionReducer from './subscriptionReducer';
import shopReducer from './shopReducer';
import homeReducer from './homeReducer';
import supportReducer from './supportReducer';

const rootReducer = combineReducers({
  workout: workoutReducer,
  diet: dietReducer,
  chat: chatReducer,
  cart: cartReducer,
  multiProvider: multiProviderReducer,
  profile: profileReducer,
  providers: providersReducer,
  notification: notificationReducer,
  trainer: trainerReducer,
  post: postReducer,
  subscription: subscriptionReducer,
  shop: shopReducer,
  home: homeReducer,
  support: supportReducer,
});

export default rootReducer;


