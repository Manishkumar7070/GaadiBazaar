# Deployment & Mobile Preview Guide

## 1. Live Mobile Preview
To preview this app on your phone right now:
1. Open the **Shared App URL** provided in the chat on your phone's browser (Safari/Chrome).
2. The app is fully responsive and optimized for mobile touch interactions.

## 2. Vercel Deployment (Frontend)
To deploy this app to Vercel without errors:
1. **Push to GitHub**: Upload your code to a GitHub repository.
2. **Connect to Vercel**: Import the repository into Vercel.
3. **Build Settings**:
   - Framework Preset: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. **Environment Variables**:
   - Vercel will automatically use the `vercel.json` I created to handle routing.
   - Ensure your Firebase configuration is accessible.

## 3. Expo (Mobile App) Preview
If you want to build a native mobile app using Expo, you can use the following `App.js` structure in a new Expo project. You will need to install `@react-native-firebase/app` and `@react-native-firebase/auth`.

```javascript
// Example Expo App.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { AuthProvider } from './context/AuthContext';
import LoginScreen from './screens/LoginScreen';
import HomeScreen from './screens/HomeScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Home" component={HomeScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </AuthProvider>
  );
}
```

## 4. Folder Structure
The project is organized as follows:
- `/src`: All frontend source code (React, Components, Hooks).
- `/src/pages`: Individual page views.
- `/src/components`: Reusable UI elements.
- `/src/lib`: Configuration and library initializations (Firebase).
- `/public`: Static assets.
