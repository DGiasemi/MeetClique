import * as SecureStore from 'expo-secure-store';

import { Box } from "@/components/ui/box";
import { Link } from "expo-router";
import React from "react";
import { ScrollView } from "react-native";
import { Text } from "@/components/ui/text";

export default function Developer() {
  const [url, setUrl] = React.useState<string>("/login");
  React.useEffect(() => {
      SecureStore.getItemAsync('userToken').then(token => {
        if (token) {
          setUrl("/tabs");
        }
      });
    }, []);

  return (
    <Box className="h-full" style={{ backgroundColor: "#180161" }}>
      <ScrollView className="content-between flex flex-1"
        style={{ height: "100%" }}
        contentContainerStyle={{ flexGrow: 1, justifyContent: "space-between" }}
      >
        <Box className="flex items-center h-[70vh]">
          <Box className="flex justify-center items-center m-8">
              <Text className="text-typography-white font-normal">
                Early Development build
              </Text>
              <Text className="text-red-500 font-medium font-bold">
                Developer Only Access
              </Text>
          </Box>
          <Box className="flex flex-1 justify-center items-center">
            <Link href={url as any} className="bg-white rounded-full p-3 mt-5">
              <Text className="text-blue-500 font-medium text-xl">
                Open Application
              </Text>
            </Link>
          </Box>
        </Box>
        <Box className="items-end p-5">
          <Text className="text-typography-white text-xs font-normal">
            Version 0.0.1 development
          </Text>
        </Box>
      </ScrollView>
    </Box>
  );
}
