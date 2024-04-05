import { useState, useEffect } from "react"
import { StyleSheet, Text, View } from "react-native"
import FullNotificationContent from "./FullNotificationContent"
import notifee from '@notifee/react-native';

export default function IncomingTripRequest() {
          const [notification, setNotification] = useState(null)
          useEffect(() => {
                  notifee.onForegroundEvent(async ({ type, detail }) => {
                    console.log("NOTIFICATION", { type, detail })
                  })
          }, [])
          useEffect(() => {
                    (async () => {
                              try {
                                        const notifications = await notifee.getDisplayedNotifications()
                                        const callNotification = notifications.find(n => n.id == "trip-request")
                                        const initialNotification = await notifee.getInitialNotification()
                                        const noti = callNotification ? callNotification : initialNotification
                                        if(noti) {
                                                  setNotification(noti.notification)
                                        }
                              } catch (error) {
                                        console.log(error)
                              }
                    })()
          }, [])
          return (
                    <FullNotificationContent notification={notification} />
          )
}

const styes = StyleSheet.create({
          title: {
                    fontSize: 30,
                    color: "red"
          },
          container: {
                    flex: 1,
                    backgroundColor: "blue",
                    justifyContent: 'center',
                    alignItems: 'center'
          }
})