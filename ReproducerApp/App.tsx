import { useState, type ReactNode } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';

// Reproducer for the October 2026 accessibility audit
// (research/2026-10-a11y-audit). Each section pairs the broken case with a
// control. No testID or nativeID anywhere: both keep a View in the native tree
// and would hide the flattening bug (F1).
//
// Inspect with Accessibility Inspector (iOS) or
// `adb shell uiautomator dump /sdcard/ui.xml && adb pull /sdcard/ui.xml`
// (Android). A1, A2, A3 and the spoken parts need VoiceOver or TalkBack.
//
// The boxes have a border, and a border keeps a View. The View under test in
// the flattening sections (F1 to F5) has no style at all.

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={{ fontWeight: '600' }}>{title}</Text>
      {children}
    </View>
  );
}

const box = { padding: 8, borderWidth: 1, borderColor: '#888' } as const;

// 1x1 PNG, so the Image case needs no asset.
const pixel = {
  uri: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
};

const archive = [{ name: 'archive', label: 'Archive' }];

export default function App() {
  const [last, setLast] = useState('none');
  const [checked, setChecked] = useState<boolean | 'mixed'>('mixed');
  const [tab, setTab] = useState(0);
  const [level, setLevel] = useState({ D1: 5, D2: 5 });
  const adjust = (key: 'D1' | 'D2', action: string) => {
    setLast(`${key} action ${action}`);
    const step = action === 'increment' ? 1 : action === 'decrement' ? -1 : 0;
    setLevel(l => ({ ...l, [key]: Math.min(10, Math.max(0, l[key] + step)) }));
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 48, gap: 24 }}>
      <Text>Last event: {last}</Text>

      <Section title="A1 (iOS): onMagicTap. VoiceOver on M1, two-finger double tap">
        <View
          accessible
          onMagicTap={() => setLast('M1 onMagicTap')}
          style={box}
        >
          <Text>Magic tap M1</Text>
        </View>
      </Section>

      <Section title="A2 (iOS): standard actions. VoiceOver double tap on X1, rotor Actions">
        <Pressable
          accessibilityActions={[
            { name: 'activate' },
            { name: 'archive', label: 'Archive' },
          ]}
          onAccessibilityAction={e =>
            setLast(`X1 action ${e.nativeEvent.actionName}`)
          }
          onPress={() => setLast('X1 onPress')}
          style={box}
        >
          <Text>Mail X1</Text>
        </Pressable>
        <View
          accessible
          accessibilityActions={[{ name: 'activate' }]}
          onAccessibilityAction={e =>
            setLast(`X2 action ${e.nativeEvent.actionName}`)
          }
          style={box}
        >
          <Text>Mail X2: activate only, no onPress</Text>
        </View>
      </Section>

      <Section title="C1 (iOS): accessibilityValue percentage, Value field">
        <View
          accessible
          accessibilityRole="adjustable"
          accessibilityValue={{ min: 0, max: 10, now: 5 }}
          style={box}
        >
          <Text>Volume V1: 0..10, now 5 (control, 50%)</Text>
        </View>
        <View
          accessible
          accessibilityRole="adjustable"
          accessibilityValue={{ min: 10, max: 20, now: 15 }}
          style={box}
        >
          <Text>Volume V2: 10..20, now 15 (expected 50%)</Text>
        </View>
        <View
          accessible
          accessibilityRole="adjustable"
          accessibilityValue={{ min: 5, max: 5, now: 5 }}
          style={box}
        >
          <Text>Volume V3: 5..5, now 5 (min equals max)</Text>
        </View>
      </Section>

      <Section title="C4 (iOS): role vs accessibilityRole, Traits field">
        <View
          accessible
          role="slider"
          accessibilityValue={{ min: 0, max: 10, now: 5 }}
          style={box}
        >
          <Text>Slider R1: role="slider"</Text>
        </View>
        <View
          accessible
          accessibilityRole="adjustable"
          accessibilityValue={{ min: 0, max: 10, now: 5 }}
          style={box}
        >
          <Text>Slider R2: accessibilityRole="adjustable" (control)</Text>
        </View>
        <View accessible role="searchbox" style={box}>
          <Text>Search R3: role="searchbox"</Text>
        </View>
        <View accessible accessibilityRole="search" style={box}>
          <Text>Search R4: accessibilityRole="search" (control)</Text>
        </View>
        <View role="tablist" collapsable={false} style={{ flexDirection: 'row' }}>
          <Pressable accessibilityRole="tab" style={box}>
            <Text>Tab R5: in role="tablist"</Text>
          </Pressable>
        </View>
      </Section>

      <Section title="C5 (Android): new value after adjusting. TalkBack, adjust D1 and D2">
        <View
          accessible
          role="slider"
          accessibilityValue={{ min: 0, max: 10, now: level.D1 }}
          accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
          onAccessibilityAction={e => adjust('D1', e.nativeEvent.actionName)}
          style={box}
        >
          <Text>Level D1: role="slider", now {level.D1}</Text>
        </View>
        <View
          accessible
          accessibilityRole="adjustable"
          accessibilityValue={{ min: 0, max: 10, now: level.D2 }}
          accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
          onAccessibilityAction={e => adjust('D2', e.nativeEvent.actionName)}
          style={box}
        >
          <Text>Level D2: accessibilityRole="adjustable" (control), now {level.D2}</Text>
        </View>
      </Section>

      <Section title="C2 (Android): busy replaces the name, content-desc">
        <View accessible aria-busy style={box}>
          <Text>Loading orders B1</Text>
        </View>
        <View accessible style={box}>
          <Text>Loading orders B2 (control, not busy)</Text>
        </View>
      </Section>

      <Section title="C3 (Android): stale state words. Dump, tap Toggle S1, dump again">
        <View
          accessible
          accessibilityRole="checkbox"
          accessibilityState={{ checked }}
          accessibilityLabel="Select all S1"
          style={box}
        >
          <Text>Select all S1: {String(checked)}</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={() => setChecked(c => (c === 'mixed' ? true : 'mixed'))}
          style={box}
        >
          <Text>Toggle S1</Text>
        </Pressable>
      </Section>

      <Section title="C6 (iOS): state on Text, Value field">
        <Text
          accessibilityRole="checkbox"
          accessibilityState={{ checked: true }}
          style={box}
        >
          Terms T1: Text, checked
        </Text>
        <View
          accessible
          accessibilityRole="checkbox"
          accessibilityState={{ checked: true }}
          style={box}
        >
          <Text>Terms T2: View, checked (control)</Text>
        </View>
      </Section>

      <Section title="C7 (iOS): stale Text element. Inspect T3, tap Toggle T3, inspect again">
        <Text
          accessibilityRole="tab"
          accessibilityState={{ selected: tab === 1 }}
          accessibilityLabel={tab === 1 ? 'Tab T3 on' : 'Tab T3 off'}
          style={box}
        >
          Tab T3 (text does not change)
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => setTab(t => (t === 1 ? 0 : 1))}
          style={box}
        >
          <Text>Toggle T3 (now {tab === 1 ? 'on' : 'off'})</Text>
        </Pressable>
      </Section>

      <Section title="F1 (Android): label on a plain View, content-desc">
        <View accessibilityLabel="Cart L1">
          <Text>3 items L1</Text>
        </View>
        <View accessibilityLabel="Cart L2" collapsable={false}>
          <Text>3 items L2 (control, not flattened)</Text>
        </View>
      </Section>

      <Section title="F2 (iOS): label of an inner plain View, Label of the button">
        <Pressable onPress={() => setLast('P1 onPress')} style={box}>
          <View accessibilityLabel="Close dialog P1">
            <Text>× P1</Text>
          </View>
        </Pressable>
        <Pressable onPress={() => setLast('P2 onPress')} style={box}>
          <View accessibilityLabel="Close dialog P2" collapsable={false}>
            <Text>× P2 (control, not flattened)</Text>
          </View>
        </Pressable>
      </Section>

      <Section title="F3 (iOS): tabbar container with layout styles only, tabs and Hierarchy">
        <View accessibilityRole="tabbar" style={{ flexDirection: 'row', gap: 8 }}>
          <Pressable accessibilityRole="tab" style={box}>
            <Text>Tab K1</Text>
          </Pressable>
          <Pressable accessibilityRole="tab" style={box}>
            <Text>Tab K2</Text>
          </Pressable>
        </View>
        <View
          accessibilityRole="tabbar"
          collapsable={false}
          style={{ flexDirection: 'row', gap: 8 }}
        >
          <Pressable accessibilityRole="tab" style={box}>
            <Text>Tab K3 (control)</Text>
          </Pressable>
          <Pressable accessibilityRole="tab" style={box}>
            <Text>Tab K4 (control)</Text>
          </Pressable>
        </View>
      </Section>

      <Section title="F4 (iOS): escape on a plain wrapper. VoiceOver on E1, two-finger Z">
        <View onAccessibilityEscape={() => setLast('E1 escape')}>
          <Text>Dialog text E1</Text>
        </View>
        <View
          onAccessibilityEscape={() => setLast('E2 escape')}
          collapsable={false}
        >
          <Text>Dialog text E2 (control, not flattened)</Text>
        </View>
      </Section>

      <Section title="F5 (iOS): Large Content Viewer. Largest text size, long press">
        <View
          accessibilityShowsLargeContentViewer
          accessibilityLargeContentTitle="Home H1"
        >
          <Text>Home H1</Text>
        </View>
        <View
          accessibilityShowsLargeContentViewer
          accessibilityLargeContentTitle="Home H2"
          collapsable={false}
        >
          <Text>Home H2 (control, not flattened)</Text>
        </View>
      </Section>

      <Section title="A3 (Android): actions on ScrollView. TalkBack actions menu">
        <ScrollView
          horizontal
          accessible
          accessibilityRole="adjustable"
          accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
          onAccessibilityAction={e =>
            setLast(`SV1 action ${e.nativeEvent.actionName}`)
          }
          style={box}
        >
          <Text>Carousel SV1: ScrollView</Text>
        </ScrollView>
        <View
          accessible
          accessibilityRole="adjustable"
          accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
          onAccessibilityAction={e =>
            setLast(`SV2 action ${e.nativeEvent.actionName}`)
          }
          style={box}
        >
          <Text>Carousel SV2: View (control)</Text>
        </View>
      </Section>

      <Section title="A4 (iOS): custom actions on components with an inner element, Actions">
        <Text
          accessibilityActions={archive}
          onAccessibilityAction={() => setLast('N1 Text archive')}
          style={box}
        >
          Note N1: Text
        </Text>
        <Image
          accessible
          accessibilityLabel="Photo N2: Image"
          accessibilityActions={archive}
          onAccessibilityAction={() => setLast('N2 Image archive')}
          source={pixel}
          style={{ width: 44, height: 44 }}
        />
        <Switch
          accessibilityLabel="Notify N3: Switch"
          accessibilityActions={archive}
          onAccessibilityAction={() => setLast('N3 Switch archive')}
        />
        <TextInput
          accessibilityLabel="Name N4: TextInput"
          accessibilityActions={archive}
          onAccessibilityAction={() => setLast('N4 TextInput archive')}
          style={box}
        />
        <View
          accessible
          accessibilityActions={archive}
          onAccessibilityAction={() => setLast('N5 View archive')}
          style={box}
        >
          <Text>Note N5: View (control)</Text>
        </View>
        <Image
          accessible
          accessibilityLabel="Rating N7: Image, adjustable"
          accessibilityRole="adjustable"
          accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
          onAccessibilityAction={e =>
            setLast(`N7 Image ${e.nativeEvent.actionName}`)
          }
          onAccessibilityTap={() => setLast('N7 Image tap')}
          source={pixel}
          style={{ width: 44, height: 44 }}
        />
        <Switch
          accessibilityLabel="Notify N8: Switch, onAccessibilityTap"
          onAccessibilityTap={() => setLast('N8 Switch tap')}
        />
        <View
          accessible
          accessibilityRole="adjustable"
          accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
          onAccessibilityAction={e =>
            setLast(`N9 View ${e.nativeEvent.actionName}`)
          }
          onAccessibilityTap={() => setLast('N9 View tap')}
          style={box}
        >
          <Text>Rating N9: View (control)</Text>
        </View>
      </Section>

      <Section title="Q (iOS): actions on a plain parent, Actions of the child">
        <View
          accessibilityActions={archive}
          onAccessibilityAction={() => setLast('Q1 parent archive')}
          collapsable={false}
        >
          <View accessible style={box}>
            <Text>Child Q1: parent kept</Text>
          </View>
        </View>
        <View
          accessibilityActions={archive}
          onAccessibilityAction={() => setLast('Q2 parent archive')}
        >
          <View accessible style={box}>
            <Text>Child Q2: parent flattened</Text>
          </View>
        </View>
      </Section>

      <Section title="G (iOS): Image vs View, Hint, Traits, Value">
        <Image
          accessible
          accessibilityLabel="Photo G1: Image"
          accessibilityHint="Hint G1"
          accessibilityRole="button"
          accessibilityState={{ checked: true }}
          accessibilityValue={{ text: 'Value G1' }}
          source={pixel}
          style={{ width: 44, height: 44 }}
        />
        <View
          accessible
          accessibilityLabel="Photo G2: View (control)"
          accessibilityHint="Hint G2"
          accessibilityRole="button"
          accessibilityState={{ checked: true }}
          accessibilityValue={{ text: 'Value G2' }}
          style={box}
        />
      </Section>
    </ScrollView>
  );
}
