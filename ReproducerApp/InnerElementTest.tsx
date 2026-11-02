import { useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';

// Group 2 (research/2026-10-a11y-audit/group-2-inner-element.md): components
// whose accessibility element is not a plain component view. Each case has a
// View control that differs only in the component. Read with Accessibility
// Inspector (Label, Value, Traits, Identifier, Perform Activate); the log keeps
// every handler call. Run on React Native as published, then with #59381
// applied to node_modules (I4 and I5 change, the rest must not).
//
// Labels avoid the words listened for ("busy", "progress", "checked").

const row = { padding: 8, borderWidth: 1, borderColor: '#888' } as const;
const square = { width: 44, height: 44 } as const;

// 1x1 PNG, so the Image cases need no asset.
const pixel = {
  uri: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
};

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={{ fontWeight: '600' }}>{title}</Text>
      {children}
    </View>
  );
}

export default function InnerElementTest() {
  const [log, setLog] = useState<string[]>([]);
  const add = (entry: string) =>
    setLog(l => [
      ...l.slice(-4),
      `${new Date().toLocaleTimeString()} ${entry}`,
    ]);

  return (
    <View style={{ flex: 1, paddingTop: 60 }}>
      <View style={{ minHeight: 110, paddingHorizontal: 24 }}>
        <Text style={{ fontWeight: '600' }}>Log ({log.length})</Text>
        {log.map((entry, i) => (
          <Text key={i}>{entry}</Text>
        ))}
      </View>
      <ScrollView contentContainerStyle={{ padding: 24, gap: 24 }}>
        <Pressable onPress={() => setLog([])} style={row}>
          <Text>Clear log</Text>
        </Pressable>

        <Section title="I: ActivityIndicator with accessible (#59381 before / after)">
          <ActivityIndicator accessible accessibilityLabel="Spinner I3" />
          <ActivityIndicator
            accessible
            accessibilityLabel="Spinner I4"
            onAccessibilityTap={() => add('I4 tap')}
          />
          <View
            accessible
            accessibilityLabel="Spinner I4c: View (control)"
            onAccessibilityTap={() => add('I4c tap')}
            style={row}
          />
          <ActivityIndicator
            accessible
            accessibilityLabel="Spinner I5"
            accessibilityState={{ busy: true }}
          />
          <View
            accessible
            accessibilityLabel="Spinner I5c: View (control)"
            accessibilityState={{ busy: true }}
            style={row}
          />
        </Section>

        <Section title="S: Switch, the UISwitch is the element">
          <Switch
            accessibilityLabel="Notify S1"
            accessibilityState={{ busy: true }}
          />
          <View
            accessible
            accessibilityLabel="Notify S1c: View (control)"
            accessibilityState={{ busy: true }}
            style={row}
          />
          <Switch
            accessibilityLabel="Notify S3"
            accessibilityValue={{ text: 'Every day' }}
          />
          <Switch accessibilityLabel="Notify S3c: no value (control)" />
        </Section>

        <Section title="T: TextInput, the text field is the element">
          <TextInput
            accessibilityLabel="Name TI1"
            onAccessibilityTap={() => add('TI1 tap')}
            style={row}
          />
          <View
            accessible
            accessibilityLabel="Name TI1c: View (control)"
            onAccessibilityTap={() => add('TI1c tap')}
            style={row}
          />
        </Section>

        <Section title="G: Image, the props go to the inner UIImageView">
          <Image
            accessible
            accessibilityLabel="Photo G4"
            accessibilityElementsHidden
            source={pixel}
            style={square}
          />
          <View
            accessible
            accessibilityLabel="Photo G4c: View (control)"
            accessibilityElementsHidden
            style={row}
          />
          <Image
            accessible
            accessibilityLabel="Photo G5: aria-hidden (control)"
            aria-hidden
            source={pixel}
            style={square}
          />
          <Image
            accessible
            accessibilityLabel="Photo G6"
            testID="photo-g6"
            source={pixel}
            style={square}
          />
          <View
            accessible
            accessibilityLabel="Photo G6c: View (control)"
            testID="photo-g6c"
            style={row}
          />
          <Image
            accessible
            accessibilityLabel="Kuchen G3"
            accessibilityLanguage="de-DE"
            source={pixel}
            style={square}
          />
          <View
            accessible
            accessibilityLabel="Kuchen G3c"
            accessibilityLanguage="de-DE"
            style={row}
          />
        </Section>
      </ScrollView>
    </View>
  );
}
