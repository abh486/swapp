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
import hydrationReducer from './hydrationReducer';
import exerciseReducer from './exerciseReducer';
import weightReducer from './weightReducer';
import sleepReducer from './sleepReducer';

const appReducer = combineReducers({
  workout: workoutReducer,
  exercise: exerciseReducer,
  diet: dietReducer,
  hydration: hydrationReducer,
  weight: weightReducer,
  sleep: sleepReducer,
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

const rootReducer = (state, action) => {
  if (action.type === 'USER_LOGOUT') {
    state = undefined;
  }
  return appReducer(state, action);
};

export default rootReducer;


