import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Animated, Platform } from "react-native";
import React, { createContext, useState, useRef } from "react";
import { Tabs } from "expo-router";
import { useClientOnlyValue } from "@/components/useClientOnlyValue";
import { BlurView } from "expo-blur";

function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>["name"];
  color: string;
  focused: boolean;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: props.focused ? 1.2 : 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  }, [props.focused]);

  return (
    <Animated.View
      style={{
        transform: [{ scale: scaleAnim }],
        marginBottom: -3,
      }}
    >
      <FontAwesome
        size={24}
        {...props}
        style={{
          textShadowColor: props.focused ? props.color : "transparent",
          textShadowOffset: { width: 0, height: 0 },
          textShadowRadius: props.focused ? 8 : 0,
        }}
      />
    </Animated.View>
  );
}

// function MiddleTabBarIcon({
//   name,
//   color,
//   focused,
// }: {
//   name: React.ComponentProps<typeof FontAwesome>["name"];
//   color: string;
//   focused: boolean;
// }) {
//   const scaleAnim = useRef(new Animated.Value(1)).current;
//   const glowAnim = useRef(new Animated.Value(0)).current;

//   React.useEffect(() => {
//     Animated.parallel([
//       Animated.spring(scaleAnim, {
//         toValue: focused ? 1.1 : 1,
//         friction: 4,
//         tension: 50,
//         useNativeDriver: true,
//       }),
//       Animated.timing(glowAnim, {
//         toValue: focused ? 1 : 0,
//         duration: 300,
//         useNativeDriver: false,
//       }),
//     ]).start();
//   }, [focused]);

//   const shadowRadius = glowAnim.interpolate({
//     inputRange: [0, 1],
//     outputRange: [5, 20],
//   });

//   return (
//     <Animated.View
//       style={{
//         position: "absolute",
//         bottom: -10,
//         transform: [{ scale: scaleAnim }],
//       }}
//     >
//       <Animated.View
//         style={{
//           borderRadius: 50,
//           padding: 10,
//           paddingTop: 12,
//           paddingLeft: 14,
//           width: 55,
//           height: 55,
//           borderWidth: 3,
//           borderColor: "#eb3678",
//           backgroundColor: "#eb3678",
//           shadowColor: "#eb3678",
//           shadowOffset: { width: 0, height: 0 },
//           shadowOpacity: focused ? 0.8 : 0.3,
//           shadowRadius: focused ? 20 : 5,
//           elevation: focused ? 15 : 8,
//         }}
//       >
//         <FontAwesome size={30} name={name} color="white" />
//       </Animated.View>
//     </Animated.View>
//   );
// }

export const TabBarVisibilityContext = createContext<{
  visible: boolean;
  setVisible: React.Dispatch<React.SetStateAction<boolean>>;
}>({
  visible: true,
  setVisible: (() => { }) as React.Dispatch<React.SetStateAction<boolean>>,
});

export default function TabLayout() {
  const [tabBarVisible, setTabBarVisible] = useState(true);

  return (
    <TabBarVisibilityContext.Provider
      value={{ visible: tabBarVisible, setVisible: setTabBarVisible }}
    >
      <Tabs
        screenOptions={{
          headerShown: useClientOnlyValue(false, false),
          tabBarShowLabel: true,
          tabBarActiveTintColor: "#eb3678",
          tabBarInactiveTintColor: "#a0a0a0",
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: "600",
            marginBottom: 5,
            letterSpacing: 0.3,
          },
          animation: "shift",
          transitionSpec: {
            animation: "spring",
            config: {
              stiffness: 80,
              damping: 20,
              mass: 1,
            },
          },
          tabBarStyle: {
            display: tabBarVisible ? "flex" : "none",
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 70,
            backgroundColor: Platform.OS === "ios" ? "rgba(20, 20, 30, 0.85)" : "#14141e",
            borderTopWidth: 0,
            borderTopLeftRadius: 25,
            borderTopRightRadius: 25,
            paddingTop: 8,
            paddingBottom: 10,
            paddingHorizontal: 10,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.3,
            shadowRadius: 15,
            elevation: 20,
            overflow: "hidden",
          },
          tabBarBackground: () =>
            Platform.OS === "ios" ? (
              <BlurView
                intensity={80}
                tint="dark"
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  borderTopLeftRadius: 25,
                  borderTopRightRadius: 25,
                  overflow: "hidden",
                }}
              />
            ) : null,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon name="home" color={color} focused={focused} />
            ),
          }}
        />

        <Tabs.Screen
          name="add"
          options={{
            title: "Create",
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon name="plus-circle" color={color} focused={focused} />
            ),
          }}
        />

        <Tabs.Screen
          name="chats"
          options={{
            title: "Chats",
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon name="comments" color={color} focused={focused} />
            ),
          }}
        />

        <Tabs.Screen
          name="eventDetails"
          options={{
            href: null,
            title: "Event Details",
          }}
        />

        <Tabs.Screen
          name="groups"
          options={{
            href: null,
            title: "Groups",
          }}
        />

        <Tabs.Screen
          name="groupDetails"
          options={{
            href: null,
            title: "Group Details",
          }}
        />

        <Tabs.Screen
          name="account"
          options={{
            title: "Profile",
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon name="user" color={color} focused={focused} />
            ),
          }}
        />
      </Tabs>
    </TabBarVisibilityContext.Provider>
  );
}
