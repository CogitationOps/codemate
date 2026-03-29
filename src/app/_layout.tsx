import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RepoProvider } from '../lib/repo-context';
import { ChatProvider } from '../lib/chat-context';
import { CustomDrawer } from '../components/CustomDrawer';
import { Drawer } from 'expo-router/drawer';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <RepoProvider>
          <ChatProvider>
            <Drawer
              initialRouteName="index"
              drawerContent={(props) => <CustomDrawer {...props} />}
              screenOptions={{
                headerStyle: { backgroundColor: '#161B22' },
                headerTintColor: '#E6EDF3',
                headerTitleStyle: { fontWeight: '600', fontSize: 16 },
                headerShadowVisible: false,
                drawerStyle: { backgroundColor: '#161B22', width: 280 },
                overlayColor: 'rgba(0,0,0,0.6)',
                swipeEdgeWidth: 60,
                headerShown: false, // We use custom headers in screens
              }}
            >
              <Drawer.Screen name="index" options={{ title: 'CodeMate' }} />
              <Drawer.Screen name="projects" options={{ title: 'Projects' }} />
            </Drawer>
          </ChatProvider>
        </RepoProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
