/**
 * @format
 */

import { AppRegistry } from 'react-native';
import App from './App';
import EscapeTest from './EscapeTest';
import InnerElementTest from './InnerElementTest';
import { name as appName } from './app.json';

// App: the audit screen. EscapeTest: where VoiceOver escape goes (one screen,
// pinned log). InnerElementTest: group 2, components whose accessibility
// element is not the component view.
const screens = { App, EscapeTest, InnerElementTest };
AppRegistry.registerComponent(appName, () => screens.InnerElementTest);
