/**
 * @format
 */

import { AppRegistry } from 'react-native';
import App from './App';
import EscapeTest from './EscapeTest';
import { name as appName } from './app.json';

// App: the audit screen. EscapeTest: where VoiceOver escape goes (one screen,
// pinned log).
const screens = { App, EscapeTest };
AppRegistry.registerComponent(appName, () => screens.EscapeTest);
