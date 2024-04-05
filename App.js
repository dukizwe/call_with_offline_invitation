import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, TouchableWithoutFeedback, Image, TouchableOpacity, InteractionManager, PermissionsAndroid, } from 'react-native';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import KeyCenter from './KeyCenter';
import { getFirstInstallTime } from 'react-native-device-info'
import AsyncStorage from '@react-native-async-storage/async-storage';

import * as ZIM from 'zego-zim-react-native';
import * as ZPNs from 'zego-zpns-react-native';
import ZegoUIKitPrebuiltCallService, {
  ZegoCallInvitationDialog,
  ZegoUIKitPrebuiltCallWaitingScreen,
  ZegoUIKitPrebuiltCallInCallScreen,
  ZegoSendCallInvitationButton,
  ZegoMenuBarButtonName,
  ZegoUIKitPrebuiltCallFloatingMinimizedView,
  ZegoCountdownLabel,
} from '@zegocloud/zego-uikit-prebuilt-call-rn';
import notifee, { AndroidCategory, AndroidImportance, AndroidLaunchActivityFlag, AndroidStyle, AndroidVisibility, AuthorizationStatus } from '@notifee/react-native';
import messaging from '@react-native-firebase/messaging';
import BackgroundService from 'react-native-background-actions';
import { ScriptElementKindModifier } from 'typescript';

const Stack = createNativeStackNavigator();


const storeUserInfo = async (info) => {
  await AsyncStorage.setItem("userID", info.userID)
  await AsyncStorage.setItem("userName", info.userName)
}
const getUserInfo = async () => {
  try {
    const userID = await AsyncStorage.getItem("userID")
    const userName = await AsyncStorage.getItem("userName")
    if (userID == undefined) {
      return undefined
    } else {
      return { userID, userName }
    }
  } catch (e) {
    return undefined
  }
}

const onUserLogin = async (userID, userName, props) => {
  return ZegoUIKitPrebuiltCallService.init(
    KeyCenter.appID,
    KeyCenter.appSign,
    userID,
    userName,
    [ZIM, ZPNs],
    {
      ringtoneConfig: {
        incomingCallFileName: 'zego_incoming.mp3',
        outgoingCallFileName: 'zego_outgoing.mp3',
      },
      notifyWhenAppRunningInBackgroundOrQuit: true,
      isIOSSandboxEnvironment: true,
      androidNotificationConfig: {
        channelID: "ZegoUIKit",
        channelName: "ZegoUIKit",
      },
      avatarBuilder: ({userInfo}) => {
        return <View style={{width: '100%', height: '100%'}}>
         <Image 
          style={{ width: '100%', height: '100%' }}
          resizeMode="cover"
          source={{ uri: `https://robohash.org/${userInfo.userID}.png` }}
          />
        </View>
      },
      requireConfig: (data) => {
        return {
          onHangUp: (duration) => {
            console.log('########CallWithInvitation onHangUp', duration);
            props.navigation.navigate('HomeScreen');
          },
          foregroundBuilder: () => <ZegoCountdownLabel maxDuration={60} onCountdownFinished={() => { console.log("Countdown finished!!"); ZegoUIKitPrebuiltCallService.hangUp(); }} />,
          timingConfig: {
            isDurationVisible: false,
            onDurationUpdate: (duration) => {
              console.log('########CallWithInvitation onDurationUpdate', duration);
              if (duration === 10 * 60) {
                ZegoUIKitPrebuiltCallService.hangUp();
              }
            }
          },
          topMenuBarConfig: {
            buttons: [
              ZegoMenuBarButtonName.minimizingButton,
            ],
          },
          onWindowMinimized: () => {
            console.log('[Demo]CallInvitation onWindowMinimized');
            props.navigation.navigate('HomeScreen');
          },
          onWindowMaximized: () => {
            console.log('[Demo]CallInvitation onWindowMaximized');
            props.navigation.navigate('ZegoUIKitPrebuiltCallInCallScreen');
          },
        }
      }
    }
  );
}

// <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< Step 1: Config React Navigation
export default function App() {
  return (
    <NavigationContainer >

      <ZegoCallInvitationDialog />

      <Stack.Navigator initialRouteName="HomeScreen">
        <Stack.Screen
          name="LoginScreen"
          component={LoginScreen}
        />
        <Stack.Screen
          name="HomeScreen"
          component={HomeScreen}
        />

        <Stack.Screen
          options={{ headerShown: false }}
          // DO NOT change the name 
          name="ZegoUIKitPrebuiltCallWaitingScreen"
          component={ZegoUIKitPrebuiltCallWaitingScreen}
        />
        <Stack.Screen
          options={{ headerShown: false }}
          // DO NOT change the name
          name="ZegoUIKitPrebuiltCallInCallScreen"
          component={ZegoUIKitPrebuiltCallInCallScreen}
        />

      </Stack.Navigator>
      <ZegoUIKitPrebuiltCallFloatingMinimizedView />
    </NavigationContainer>);
}

// <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< Step 2: Call "ZegoUIKitPrebuiltCallService.init" method after the user login.
function LoginScreen(props) {
  const navigation = useNavigation();
  const [userID, setUserID] = useState('');
  const [userName, setUserName] = useState('');

  const loginHandler = () => {
    // Simulated login successful

    // Store user info to auto login
    storeUserInfo({ userID, userName })

    // Init the call service
    onUserLogin(userID, userName, props).then(() => {
      // Jump to HomeScreen to make new call
      navigation.navigate('HomeScreen', { userID });
    })
  }

  useEffect(() => {
    getFirstInstallTime().then(firstInstallTime => {
      const id = String(firstInstallTime).slice(-5);
      setUserID(id);
      const name = 'user_' + id
      setUserName(name);
    });
  }, [])

  return <View style={styles.container}>
    <View style={{ marginBottom: 30 }}>
      <Text>appID: {KeyCenter.appID}</Text>
      <Text>userID: {userID}</Text>
      <Text>userName: {userName}</Text>
    </View>
    <View style={{ width: 160 }}>
      <Button title='Login' onPress={loginHandler}></Button>
    </View>
  </View>;
}

// <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< Step 3: Configure the "ZegoSendCallInvitationButton" to enable making calls. 
const INITIAL_COUNTDOWN = 10


const displayNotification = async () => {
          const PATTERN = [5, 2000, 1500, 2000, 1500, 2000, 1500, 2000, 1500, 2000, 1500, 2000, 1500, 2000, 1500, 2000, 1500, 2000, 1500, 2000, 1500, 2000, 1500, 2000, 1500, 2000, 1500, 2000, 1500, 2000, 1500, 2000, 1500, 2000, 1500, 2000, 1500, 2000]
          await notifee.deleteChannel("trip-request")
          const channelId = await notifee.createChannel({
                    id: 'trip-request',
                    name: 'Trip request',
                    importance: AndroidImportance.HIGH,
                    visibility: AndroidVisibility.PUBLIC,
                    vibration: true,
                    vibrationPattern: PATTERN,
                    sound: 'notification'
          })
          await notifee.displayNotification({
                    title: "Fullscreen notification",
                    body: `with custom activity`,
                    id: 'fullscreen',
                    data: {
                              content: "This is a content from fullscreen notification"
                    },
                    android: {
                              // Recommended to set a category
                              category: AndroidCategory.CALL,
                              // Recommended to set importance to high
                              importance: AndroidImportance.HIGH,
                              visibility: AndroidVisibility.PUBLIC,
                              channelId,
                              vibration: true,
                              vibrationPattern: PATTERN,
                              ongoing: true,
                              autoCancel: false,
                              largeIcon: "https://www.opacourses.com/uploads/male.png",
                              actions: [{
                                        title: `<span style="color: red">Decline</>`,
                                        pressAction: {
                                                  id: "reject",
                                        },
                              }, {
                                        title: `<span style="color: blue">Accept</>`,
                                        pressAction: {
                                                  id: "accept",
                                        }
                              },],
                              pressAction: {
                                        id: "default",
                                        launchActivity: 'com.mediabox.wasilidriver.MyReactNativeAppActivity',
                                        launchActivityFlags: [AndroidLaunchActivityFlag.SINGLE_TOP],
                                        // mainComponent: "MyReactNativeApp"
                              },
                              fullScreenAction: {
                                        id: 'default',
                                        // mainComponent: "MyReactNativeApp"
                                        launchActivity: 'com.mediabox.wasilidriver.MyReactNativeAppActivity',
                                        launchActivityFlags: [AndroidLaunchActivityFlag.SINGLE_TOP],
                              },
                    },
          })
  }
const sleep = (time) => new Promise((resolve) => setTimeout(() => resolve(), time));
const veryIntensiveTask = async () => {
          await new Promise( async (resolve) => {
                    for (let i = 0; BackgroundService.isRunning(); i++) {
                              console.log(i);
                              if(i == INITIAL_COUNTDOWN) {
                                        // await BackgroundService.stop();
                                        displayNotification()
                              }
                              await sleep(1000);
                    }
                });

}
function HomeScreen(props) {
  const [userID, setUserID] = useState('')
  const [invitees, setInvitees] = useState([]);
  const viewRef = useRef(null);
  const [seconds, setSeconds] = useState(INITIAL_COUNTDOWN)
  const secondsCountDownInterval = useRef(null)
  const blankPressedHandle = () => {
    viewRef.current.blur();
  };
  const changeTextHandle = value => {
    setInvitees(value ? value.split(',') : []);
  };

  const cancelNotification  = async () => {
          clearInterval(secondsCountDownInterval.current)
          secondsCountDownInterval.current = null
          setSeconds(INITIAL_COUNTDOWN)
          await notifee.cancelAllNotifications()
          await BackgroundService.stop();
  }

  const scheduleNotification = async () => {
          await notifee.cancelAllNotifications()
          const status = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
          const authStatus = await messaging().requestPermission();
          const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;

          if (enabled) {
          clearInterval(secondsCountDownInterval.current)
          secondsCountDownInterval.current = setInterval(() => {
                    setSeconds(s => s - 1)
          }, 1000)
          await BackgroundService.start(veryIntensiveTask, {
                    taskName: 'example',
                    taskTitle: 'Notifee notification',
                    taskDesc: 'Scheduled notification',
                    taskIcon: {
                    name: 'ic_launcher',
                    type: 'mipmap',
                    },
                    color: '#ff00ff',
                    // linkingURI: 'yourSchemeHere://chat/jane', // See Deep Linking for more info
                    parameters: {
                              delay: 1000,
                    },
          });
                  }
  }

  useEffect(() => {
          if(seconds == 0) {
                    clearInterval(secondsCountDownInterval.current)
                    secondsCountDownInterval.current = null
          }
  }, [seconds])


  useEffect(() => {
    // Simulated auto login if there is login info cache
    getUserInfo().then((info) => {
      if (info) {
        setUserID(info.userID)
        onUserLogin(info.userID, info.userName, props)
      } else {
        //  Back to the login screen if not login before
        props.navigation.navigate('LoginScreen');
      }
    })
    return () => {
          clearInterval(secondsCountDownInterval.current)
    }
  }, [])

  return (
    <TouchableWithoutFeedback onPress={blankPressedHandle}>
      <View style={styles.container}>
        <Text>Your user id: {userID}</Text>
        <View style={styles.inputContainer}>
          <TextInput
            ref={viewRef}
            style={styles.input}
            onChangeText={changeTextHandle}
            placeholder="Invitees ID, Separate ids by ','"
          />
          <ZegoSendCallInvitationButton
            invitees={invitees.map((inviteeID) => {
              return { userID: inviteeID, userName: 'user_' + inviteeID };
            })}
            isVideoCall={false}
            resourceID={"zego_data"}
          />
          <ZegoSendCallInvitationButton
            invitees={invitees.map((inviteeID) => {
              return { userID: inviteeID, userName: 'user_' + inviteeID };
            })}
            isVideoCall={true}
            resourceID={"zegouikit_call"}
          />
        </View>
        <View style={{ width: 220, marginTop: 100 }}>
          <Button title='Back To Login Screen' onPress={() => { props.navigation.navigate('LoginScreen') }}></Button>
          {secondsCountDownInterval.current ?
          <>
          <TouchableOpacity onPress={cancelNotification} style={{ padding: 20, backgroundColor: 'red', borderRadius: 10, marginTop: 20 }}>
                    <Text>Cancel notification</Text>
          </TouchableOpacity>
          <Text style={{ fontSize: 20, textAlign: "center", marginTop: 20 }}>Put phone in lock screen to get fullscreen notification</Text>
          <Text style={{ fontSize: 20, textAlign: "center", marginTop: 20 }}>You will get notification in { seconds }</Text>
          </> :
          <TouchableOpacity onPress={scheduleNotification} style={{ padding: 20, backgroundColor: 'green', borderRadius: 10, marginTop: 20 }}>
                    <Text>Schedule notification</Text>
          </TouchableOpacity>}
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: "gray"
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: '#dddddd',
  },
});