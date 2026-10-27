package com.reproducerapp

import android.accessibilityservice.AccessibilityServiceInfo
import android.app.Activity
import android.app.Instrumentation
import android.app.UiAutomation
import android.os.Bundle
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo

// Reads the accessibility nodes of the reproducer and performs actions on them,
// the way a screen reader would, without gestures. Run with the app open:
//   adb shell am instrument -w -e targets "Level D1,Level D2" \
//     com.reproducerapp.test/com.reproducerapp.A11yProbe
// Optional: -e action scroll_forward|scroll_backward|click (default: none).
class A11yProbe : Instrumentation() {
  private lateinit var args: Bundle

  override fun onCreate(arguments: Bundle?) {
    super.onCreate(arguments)
    args = arguments ?: Bundle()
    start()
  }

  private fun report(text: String) {
    sendStatus(0, Bundle().apply { putString(REPORT_KEY_STREAMRESULT, text + "\n") })
  }

  override fun onStart() {
    super.onStart()
    val automation = getUiAutomation(UiAutomation.FLAG_DONT_SUPPRESS_ACCESSIBILITY_SERVICES)
    automation.serviceInfo =
        automation.serviceInfo.apply {
          flags =
              flags or
                  AccessibilityServiceInfo.FLAG_INCLUDE_NOT_IMPORTANT_VIEWS or
                  AccessibilityServiceInfo.FLAG_RETRIEVE_INTERACTIVE_WINDOWS
        }
    // `am instrument` restarts the app process without an activity: open it and let React Native
    // load the bundle from Metro and render.
    startActivitySync(
        android.content.Intent(targetContext, MainActivity::class.java)
            .addFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK))
    Thread.sleep((args.getString("wait") ?: "8000").toLong())
    val targets = (args.getString("targets") ?: "").split(",").filter { it.isNotBlank() }
    val action =
        when (args.getString("action")) {
          "scroll_forward" -> AccessibilityNodeInfo.ACTION_SCROLL_FORWARD
          "scroll_backward" -> AccessibilityNodeInfo.ACTION_SCROLL_BACKWARD
          "click" -> AccessibilityNodeInfo.ACTION_CLICK
          else -> null
        }

    for (target in targets) {
      val node = find(appRoot(automation), target)
      if (node == null) {
        report("== $target: not found")
        continue
      }
      report("== $target\n" + describe(node))
      if (action == null) continue

      val events = mutableListOf<String>()
      automation.setOnAccessibilityEventListener { e -> synchronized(events) { events.add(event(e)) } }
      val handled = node.performAction(action)
      Thread.sleep(1500)
      automation.setOnAccessibilityEventListener(null)
      report("performAction(${args.getString("action")}) returned $handled; events within 1.5 s:")
      synchronized(events) { events.forEach { report("  $it") } }
      node.refresh()
      report("after:\n" + describe(node))
    }
    report("== Last event: " + (findText(appRoot(automation), "Last event")?.text ?: "?"))
    finish(Activity.RESULT_OK, Bundle())
  }

  // The root of the reproducer's window; the active window may belong to TalkBack.
  private fun appRoot(automation: UiAutomation): AccessibilityNodeInfo? {
    repeat(10) {
      automation.windows
          .mapNotNull { it.root }
          .firstOrNull { it.packageName == "com.reproducerapp" }
          ?.let { return it }
      Thread.sleep(300)
    }
    report("windows: " + automation.windows.joinToString { "${it.title}/${it.root?.packageName}" })
    return null
  }

  // The first node whose text or content description starts with the prefix. When that node is
  // the text inside a slider or a scroll view (a ScrollView's label comes from its children),
  // the slider or scroll view up to three levels above is returned instead.
  private fun find(root: AccessibilityNodeInfo?, prefix: String): AccessibilityNodeInfo? {
    val hit = findText(root, prefix) ?: return null
    var node: AccessibilityNodeInfo? = hit
    repeat(4) {
      val cls = node?.className?.toString() ?: return hit
      if (cls.endsWith("SeekBar") || cls.endsWith("ScrollView")) return node
      node = node?.parent
    }
    return hit
  }

  private fun findText(root: AccessibilityNodeInfo?, prefix: String): AccessibilityNodeInfo? {
    if (root == null) return null
    val label = root.contentDescription?.toString() ?: root.text?.toString() ?: ""
    if (label.startsWith(prefix)) return root
    for (i in 0 until root.childCount) {
      findText(root.getChild(i), prefix)?.let { return it }
    }
    return null
  }

  private fun describe(n: AccessibilityNodeInfo): String {
    val range = n.rangeInfo?.let { "type=${it.type} min=${it.min} max=${it.max} current=${it.current}" }
    val actions = n.actionList.joinToString { a -> "${actionName(a.id)}${a.label?.let { "(\"$it\")" } ?: ""}" }
    return listOf(
            "  class=${n.className} text=${n.text} desc=${n.contentDescription}",
            "  stateDescription=${n.stateDescription} roleDescription=${n.extras.getCharSequence("AccessibilityNodeInfo.roleDescription")}",
            "  importantForAccessibility=${n.isImportantForAccessibility} focusable=${n.isFocusable} " +
                "screenReaderFocusable=${n.isScreenReaderFocusable} scrollable=${n.isScrollable} visible=${n.isVisibleToUser}",
            "  rangeInfo=${range ?: "none"}",
            "  actions=[$actions]",
        )
        .joinToString("\n")
  }

  private fun actionName(id: Int): String =
      when (id) {
        AccessibilityNodeInfo.ACTION_CLICK -> "CLICK"
        AccessibilityNodeInfo.ACTION_LONG_CLICK -> "LONG_CLICK"
        AccessibilityNodeInfo.ACTION_SCROLL_FORWARD -> "SCROLL_FORWARD"
        AccessibilityNodeInfo.ACTION_SCROLL_BACKWARD -> "SCROLL_BACKWARD"
        AccessibilityNodeInfo.ACTION_ACCESSIBILITY_FOCUS -> "A11Y_FOCUS"
        AccessibilityNodeInfo.ACTION_CLEAR_ACCESSIBILITY_FOCUS -> "CLEAR_A11Y_FOCUS"
        AccessibilityNodeInfo.ACTION_FOCUS -> "FOCUS"
        AccessibilityNodeInfo.ACTION_SELECT -> "SELECT"
        AccessibilityNodeInfo.ACTION_CLEAR_SELECTION -> "CLEAR_SELECTION"
        android.R.id.accessibilityActionSetProgress -> "SET_PROGRESS"
        android.R.id.accessibilityActionShowOnScreen -> "SHOW_ON_SCREEN"
        android.R.id.accessibilityActionScrollUp -> "SCROLL_UP"
        android.R.id.accessibilityActionScrollDown -> "SCROLL_DOWN"
        android.R.id.accessibilityActionScrollLeft -> "SCROLL_LEFT"
        android.R.id.accessibilityActionScrollRight -> "SCROLL_RIGHT"
        else -> "0x" + Integer.toHexString(id)
      }

  private fun event(e: AccessibilityEvent): String =
      "${AccessibilityEvent.eventTypeToString(e.eventType)} class=${e.className} text=${e.text} " +
          "desc=${e.contentDescription} item=${e.currentItemIndex}/${e.itemCount} " +
          "from=${e.fromIndex} to=${e.toIndex}"
}
