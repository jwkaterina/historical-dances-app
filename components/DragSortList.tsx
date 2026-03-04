import { useCallback, useRef, useState } from 'react'
import { Dimensions, ScrollView, StyleSheet, View } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, { useAnimatedStyle, useSharedValue, runOnJS } from 'react-native-reanimated'
import { Icon, Text } from 'react-native-paper'
import { Colors } from '@/lib/colors'
import { Fonts } from '@/lib/fonts'

const SLOT_H = 52
const ROW_H = 48
const SCROLL_ZONE = 130
const SCROLL_SPEED = 10

// ── Per-handle gesture component ─────────────────────────────────────────────

type HandleProps = {
  onStart: () => void
  onMove: (y: number) => void
  onEnd: () => void
}

function DragHandle({ onStart, onMove, onEnd }: HandleProps) {
  // Refs so the gesture (created once on mount) always calls the latest props.
  const onStartRef = useRef(onStart)
  onStartRef.current = onStart
  const onMoveRef = useRef(onMove)
  onMoveRef.current = onMove
  const onEndRef = useRef(onEnd)
  onEndRef.current = onEnd

  // Stable wrappers — empty deps, delegate through refs on JS thread.
  const callStart = useCallback(() => onStartRef.current(), [])
  const callMove = useCallback((y: number) => onMoveRef.current(y), [])
  const callEnd = useCallback(() => onEndRef.current(), [])

  const gesture = useRef(
    Gesture.Pan()
      .minDistance(0)
      .onBegin(() => { runOnJS(callStart)() })
      .onUpdate((e) => { runOnJS(callMove)(e.absoluteY) })
      .onFinalize(() => { runOnJS(callEnd)() }),
  ).current

  return (
    <GestureDetector gesture={gesture}>
      <View style={styles.handle}>
        <Icon source="drag-vertical" size={22} color={Colors.mutedForeground} />
      </View>
    </GestureDetector>
  )
}

// ── Public types ──────────────────────────────────────────────────────────────

export type SortItem = {
  key: string
  label: string
  separator?: boolean
}

type Props = {
  items: SortItem[]
  onReorder: (items: SortItem[]) => void
  scrollRef?: React.RefObject<ScrollView>
  scrollOffsetRef?: React.MutableRefObject<number>
}

// ── Main component ────────────────────────────────────────────────────────────

export default function DragSortList({ items, onReorder, scrollRef, scrollOffsetRef }: Props) {
  const itemsRef = useRef(items)
  itemsRef.current = items
  const onReorderRef = useRef(onReorder)
  onReorderRef.current = onReorder

  const activeKeyRef = useRef<string | null>(null)
  const activeIdxRef = useRef<number | null>(null)
  const overRef = useRef<number | null>(null)
  const [activeKey, setActiveKey] = useState<string | null>(null)
  const [overIdx, setOverIdx] = useState<number | null>(null)

  // Ghost position driven by reanimated on the UI thread.
  const ghostY = useSharedValue(0)
  const ghostStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: ghostY.value }],
  }))

  // Anchor refs (JS thread).
  const startMoveYRef = useRef(-1)  // -1 sentinel: capture lazily on first onUpdate
  const startScrollYRef = useRef(0)
  const lastMoveYRef = useRef(-1)
  const hasMovedRef = useRef(false)
  const localScrollYRef = useRef(0)  // owned entirely by this component

  // Auto-scroll state.
  const scrollBoundsRef = useRef<{ top: number; bottom: number } | null>(null)
  const listContentTopRef = useRef<number | null>(null)
  const listViewRef = useRef<View>(null)
  const scrollDirRef = useRef<1 | -1 | 0>(0)
  const scrollTimerRef = useRef<number | null>(null)

  // Compute ghost Y and hovered index. Writes ghostY.value from JS thread.
  const computePanY = useCallback((moveY: number, scrollY: number) => {
    const activeIdx = activeIdxRef.current
    if (activeIdx === null || startMoveYRef.current < 0) return
    const its = itemsRef.current
    const minIdx = its[0]?.separator ? 1 : 0
    const maxIdx = its.length - 1
    const raw =
      activeIdx * SLOT_H
      + (moveY - startMoveYRef.current)
      + (scrollY - startScrollYRef.current)
    const clamped = Math.max(minIdx * SLOT_H, Math.min(maxIdx * SLOT_H, raw))
    // Absorb overshoot so the finger doesn't need to travel back the full distance.
    if (raw !== clamped) startMoveYRef.current += (raw - clamped)
    ghostY.value = clamped
    const newOver = Math.max(minIdx, Math.min(maxIdx, Math.round(clamped / SLOT_H)))
    if (newOver !== overRef.current) {
      overRef.current = newOver
      setOverIdx(newOver)
    }
  }, [ghostY])

  const setScrollDir = useCallback((dir: 1 | -1 | 0) => {
    if (dir === scrollDirRef.current) return
    scrollDirRef.current = dir
    if (scrollTimerRef.current !== null) {
      cancelAnimationFrame(scrollTimerRef.current)
      scrollTimerRef.current = null
    }
    if (dir !== 0 && scrollRef?.current) {
      const tick = () => {
        if (scrollDirRef.current === 0) return
        const its = itemsRef.current
        const minIdx = its[0]?.separator ? 1 : 0
        const maxIdx = its.length - 1
        const svHeight = scrollBoundsRef.current
          ? scrollBoundsRef.current.bottom - scrollBoundsRef.current.top
          : Dimensions.get('window').height
        let newScrollY = Math.max(0, localScrollYRef.current + scrollDirRef.current * SCROLL_SPEED)
        if (listContentTopRef.current !== null) {
          const lct = listContentTopRef.current
          if (scrollDirRef.current === -1) {
            // Floor: don't scroll up past where the first draggable row is in view.
            newScrollY = Math.max(lct + minIdx * SLOT_H - svHeight, newScrollY)
          } else {
            // Cap: don't scroll so far down that the last item goes above the viewport.
            newScrollY = Math.min(lct + maxIdx * SLOT_H, newScrollY)
          }
        }
        localScrollYRef.current = newScrollY
        computePanY(lastMoveYRef.current, newScrollY)
        scrollRef.current?.scrollTo({ y: localScrollYRef.current, animated: false })
        scrollTimerRef.current = requestAnimationFrame(tick)
      }
      scrollTimerRef.current = requestAnimationFrame(tick)
    }
  }, [scrollRef, computePanY])

  const handleStart = useCallback((key: string) => {
    const idx = itemsRef.current.findIndex(i => i.key === key)
    if (idx < 0) return
    activeKeyRef.current = key
    activeIdxRef.current = idx
    overRef.current = idx
    startMoveYRef.current = -1
    const initialScroll = scrollOffsetRef?.current ?? 0
    startScrollYRef.current = initialScroll
    localScrollYRef.current = initialScroll
    lastMoveYRef.current = -1
    hasMovedRef.current = false
    ghostY.value = idx * SLOT_H
    setActiveKey(key)
    setOverIdx(idx)
    scrollRef?.current?.measure((_x, _y, _w, h, _px, svPageY) => {
      scrollBoundsRef.current = { top: svPageY, bottom: svPageY + h }
      listViewRef.current?.measure((_lx, _ly, _lw, _lh, _lpx, listPageY) => {
        listContentTopRef.current = listPageY - svPageY + localScrollYRef.current
      })
    })
  }, [ghostY, scrollRef, scrollOffsetRef])

  const handleMove = useCallback((moveY: number) => {
    if (activeIdxRef.current === null) return
    // Lazily capture anchor on first move (absoluteY may be 0 in onBegin on Android).
    if (startMoveYRef.current < 0) {
      startMoveYRef.current = moveY
      startScrollYRef.current = localScrollYRef.current
    }
    lastMoveYRef.current = moveY
    computePanY(moveY, localScrollYRef.current)
    if (!hasMovedRef.current) {
      if (Math.abs(moveY - startMoveYRef.current) < 5) return
      hasMovedRef.current = true
    }
    const bounds = scrollBoundsRef.current ?? {
      top: 0,
      bottom: Dimensions.get('window').height,
    }
    const relY = moveY - bounds.top
    const viewH = bounds.bottom - bounds.top
    if (relY < SCROLL_ZONE) setScrollDir(-1)
    else if (relY > viewH - SCROLL_ZONE) setScrollDir(1)
    else setScrollDir(0)
  }, [computePanY, setScrollDir])

  const handleEnd = useCallback(() => {
    setScrollDir(0)
    const from = activeIdxRef.current
    const to = overRef.current
    if (from !== null && to !== null && from !== to) {
      const next = [...itemsRef.current]
      const [removed] = next.splice(from, 1)
      next.splice(to, 0, removed)
      onReorderRef.current(next)
    }
    activeKeyRef.current = null
    activeIdxRef.current = null
    overRef.current = null
    setActiveKey(null)
    setOverIdx(null)
  }, [setScrollDir])

  // Build display order: temporarily move active item to hovered position.
  const display = [...items]
  const activeIdx = activeKey ? items.findIndex(i => i.key === activeKey) : -1
  if (activeIdx >= 0 && overIdx !== null && activeIdx !== overIdx) {
    const [removed] = display.splice(activeIdx, 1)
    display.splice(overIdx, 0, removed)
  }

  const activeItem = activeKey ? items.find(i => i.key === activeKey) : null

  return (
    <View ref={listViewRef} style={{ height: items.length * SLOT_H, position: 'relative' }}>
      {display.map((item, ri) => {
        if (item.separator) {
          return (
            <View
              key={item.key}
              style={[styles.separator, { position: 'absolute', top: ri * SLOT_H, left: 0, right: 0 }]}
            >
              <Text style={styles.separatorLabel}>{item.label}</Text>
            </View>
          )
        }
        const isActive = item.key === activeKey
        return (
          <View
            key={item.key}
            style={[
              styles.row,
              { position: 'absolute', top: ri * SLOT_H, left: 0, right: 0 },
              isActive && styles.rowFaded,
            ]}
          >
            <Text style={styles.label} numberOfLines={1}>{item.label}</Text>
            <DragHandle
              onStart={() => handleStart(item.key)}
              onMove={handleMove}
              onEnd={handleEnd}
            />
          </View>
        )
      })}

      {/* Floating ghost row */}
      {activeItem && !activeItem.separator && (
        <Animated.View
          style={[
            styles.row,
            styles.floating,
            { position: 'absolute', left: 0, right: 0 },
            ghostStyle,
          ]}
          pointerEvents="none"
        >
          <Text style={styles.label} numberOfLines={1}>{activeItem.label}</Text>
          <View style={styles.handle}>
            <Icon source="drag-vertical" size={22} color={Colors.primary} />
          </View>
        </Animated.View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    height: ROW_H,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 6,
    paddingLeft: 12,
  },
  rowFaded: { opacity: 0.3 },
  floating: {
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  label: {
    flex: 1,
    fontSize: 14,
    fontFamily: Fonts.body,
    color: Colors.foreground,
  },
  handle: {
    width: 44,
    height: ROW_H,
    alignItems: 'center',
    justifyContent: 'center',
  },
  separator: {
    height: SLOT_H,
    justifyContent: 'center',
    paddingLeft: 4,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  separatorLabel: {
    fontSize: 11,
    fontFamily: Fonts.heading,
    color: Colors.mutedForeground,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
})
