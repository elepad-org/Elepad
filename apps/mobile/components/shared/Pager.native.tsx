import React, { forwardRef, useImperativeHandle, useRef } from "react";
import PagerView, {
  type PagerViewOnPageSelectedEvent,
} from "react-native-pager-view";

import type { PagerProps, PagerRef } from "./Pager.types";

const Pager = forwardRef<PagerRef, PagerProps>(
  ({ children, style, initialPage = 0, onPageSelected }, ref) => {
    const nativeRef = useRef<PagerView>(null);

    useImperativeHandle(ref, () => ({
      setPage: (index: number) => {
        nativeRef.current?.setPage(index);
      },
    }));

    return (
      <PagerView
        ref={nativeRef}
        style={style}
        initialPage={initialPage}
        onPageSelected={(event: PagerViewOnPageSelectedEvent) => {
          onPageSelected?.({ nativeEvent: { position: event.nativeEvent.position } });
        }}
      >
        {children}
      </PagerView>
    );
  }
);

Pager.displayName = "Pager";

export default Pager;
export type { PagerProps, PagerRef };
export type { PagerOnPageSelectedEvent } from "./Pager.types";
