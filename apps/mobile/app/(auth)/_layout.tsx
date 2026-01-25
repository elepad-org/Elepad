import { Stack } from "expo-router";

export default function AuthGroupLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="login/index"
        options={{
          animation: "fade",
        }}
      />
      <Stack.Screen
        name="signup/index"
        options={{
          animation: "slide_from_right",
        }}
      />
      <Stack.Screen
        name="forgot-password"
        options={{
          animation: "fade",
        }}
      />
    </Stack>
    
  );
}
