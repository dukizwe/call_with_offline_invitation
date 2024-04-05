/**
 * @format
 */

import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';

import ZegoUIKitPrebuiltCallService from '@zegocloud/zego-uikit-prebuilt-call-rn';
import * as ZIM from 'zego-zim-react-native';
import * as ZPNs from 'zego-zpns-react-native';
import messaging from '@react-native-firebase/messaging'
import notifee from '@notifee/react-native';
import IncomingTripRequest from './IncomingTripRequest';


ZegoUIKitPrebuiltCallService.useSystemCallingUI([ZIM, ZPNs]);

async function onMessageReceived(message) {
  // Do something
  console.log('++++++++, onMessageReceived', message);
}

messaging().onMessage(onMessageReceived);
messaging().setBackgroundMessageHandler(onMessageReceived);

notifee.onBackgroundEvent(async ({ type, detail }) => {
          try {
                const { notification, pressAction } = detail;
          } catch (error) {
                    console.log(error)
          }
        })

AppRegistry.registerComponent(appName, () => App);
AppRegistry.registerComponent('MyReactNativeApp', () => IncomingTripRequest);
