import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ScrollView,
  View,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";

import type { PagerOnPageSelectedEvent, PagerProps, PagerRef } from "./Pager.types";

const Pager = forwardRef<PagerRef, PagerProps>(
  ({ children, style, initialPage = 0, onPageSelected }, ref) => {
    const scrollRef = useRef<ScrollView>(null);
    const [width, setWidth] = useState(0);

    const pages = useMemo(() => React.Children.toArray(children), [children]);

    const emitSelected = (position: number) => {
      const event: PagerOnPageSelectedEvent = { nativeEvent: { position } };
      onPageSelected?.(event);
    };

    const setPage = (index: number, animated: boolean) => {
      if (!width) return;
      scrollRef.current?.scrollTo({ x: index * width, y: 0, animated });
      emitSelected(index);
    };

    useImperativeHandle(ref, () => ({
      setPage: (index: number) => setPage(index, true),
    }));

    useEffect(() => {
      if (!width) return;
      if (initialPage > 0) setPage(initialPage, false);
    }, [width, initialPage]);

    const onLayout = (event: LayoutChangeEvent) => {
      setWidth(event.nativeEvent.layout.width);
    };

    const handleScrollEnd = (
      event: NativeSyntheticEvent<NativeScrollEvent>
    ) => {
      if (!width) return;
      const x = event.nativeEvent.contentOffset.x;
      const position = Math.round(x / width);
      emitSelected(position);
    };

    return (
      <View style={style} onLayout={onLayout}>
        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleScrollEnd}
          onScrollEndDrag={handleScrollEnd}
          // scrollEnabled por defecto true
        >
          {pages.map((page, index) => (
            <View key={index} style={{ width: width || undefined }}>
              {page}
            </View>
          ))}
        </ScrollView>
      </View>
    );
  }
);

Pager.displayName = "Pager";

export default Pager;
export type { PagerProps, PagerRef };
export type { PagerOnPageSelectedEvent } from "./Pager.types";
