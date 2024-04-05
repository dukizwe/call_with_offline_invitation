import { Text, TouchableOpacity, View, NativeModules, BackHandler  } from "react-native";

export default function FullNotificationContent({ notification }) {
          const reloadApp = () => {
                    BackHandler.exitApp()
          }
          return <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                    <Text style={{ fontSize: 30, marginBottom: 20 }}>Fullscreen notification</Text>
                    <Text>Notification that cause the app to open here: </Text>
                    <Text>notification will be null because with ZegoUIKitPrebuiltCallService initialization</Text>
                    <Text>{ JSON.stringify({ notification })}</Text>
                    <TouchableOpacity onPress={reloadApp} style={{ marginTop: 20, backgroundColor: "green", padding: 20 }}>
                              <Text>Exit app</Text>
                    </TouchableOpacity>
          </View>
}