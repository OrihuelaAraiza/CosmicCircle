import { Redirect } from 'expo-router';

export default function RootIndex() {
  // manda a la primera tab
  return <Redirect href="/(tabs)" />;
}