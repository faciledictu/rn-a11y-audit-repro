import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

// Where does VoiceOver escape go when the focused element and its ancestors do
// not handle it? One screen, no scrolling, and a log that keeps every handler
// call. X1 and X2 are kept views with a handler, F1 is a flattened view with a
// handler (lost), N has no handler at all.

const row = { padding: 12, borderWidth: 1, borderColor: '#888' } as const;

export default function EscapeTest() {
  const [log, setLog] = useState<string[]>([]);
  const add = (name: string) =>
    setLog(l => [
      ...l.slice(-7),
      `${new Date().toLocaleTimeString()} ${name} escape`,
    ]);

  return (
    <View style={{ flex: 1, paddingTop: 60, paddingHorizontal: 24, gap: 28 }}>
      <View style={{ minHeight: 170 }}>
        <Text style={{ fontWeight: '600' }}>Log ({log.length})</Text>
        {log.map((entry, i) => (
          <Text key={i}>{entry}</Text>
        ))}
      </View>
      <Pressable onPress={() => setLog([])} style={row}>
        <Text>Clear log</Text>
      </Pressable>

      <View onAccessibilityEscape={() => add('X1')} collapsable={false}>
        <Text style={row}>X1: kept handler (top)</Text>
      </View>
      <View onAccessibilityEscape={() => add('F1')}>
        <Text style={row}>F1: flattened handler</Text>
      </View>
      <Text style={row}>N: no handler</Text>
      <View onAccessibilityEscape={() => add('X2')} collapsable={false}>
        <Text style={row}>X2: kept handler (bottom)</Text>
      </View>
    </View>
  );
}
