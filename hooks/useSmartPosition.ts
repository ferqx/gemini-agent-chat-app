
import { useState, useLayoutEffect, RefObject } from 'react';

export type Position = 'top' | 'bottom' | 'left' | 'right';

/**
 * Hook to automatically calculate the best position for a floating element (Tooltip, Dropdown)
 * based on available viewport space.
 * 
 * Uses useLayoutEffect to ensure the position is calculated and updated BEFORE the browser paints,
 * preventing the visual "flash" or "jump" from default to corrected position.
 * 
 * @param triggerRef Reference to the anchor element
 * @param isOpen Whether the element is currently visible (triggers recalculation)
 * @param defaultPosition The preferred position
 * @param spaceRequired Estimated pixels needed in the preferred direction
 */
export const useSmartPosition = (
  triggerRef: RefObject<HTMLElement | null>,
  isOpen: boolean,
  defaultPosition: Position = 'bottom',
  spaceRequired: number = 200 
): Position => {
  const [position, setPosition] = useState<Position>(defaultPosition);

  useLayoutEffect(() => {
    if (!isOpen) {
      // Reset to default when closed so next open animation starts from the expected direction
      setPosition(defaultPosition);
      return;
    }

    const checkPosition = () => {
      const trigger = triggerRef.current;
      if (!trigger) return;

      const rect = trigger.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;

      let newPos = defaultPosition;

      const spaceTop = rect.top;
      const spaceBottom = viewportHeight - rect.bottom;
      const spaceLeft = rect.left;
      const spaceRight = viewportWidth - rect.right;

      // Logic for vertical flipping
      if (defaultPosition === 'bottom') {
        // If not enough space below AND more space above, flip to top
        if (spaceBottom < spaceRequired && spaceTop > spaceBottom) {
          newPos = 'top';
        }
      } else if (defaultPosition === 'top') {
        // If not enough space above AND more space below, flip to bottom
        if (spaceTop < spaceRequired && spaceBottom > spaceTop) {
          newPos = 'bottom';
        }
      }

      // Logic for horizontal flipping
      if (defaultPosition === 'right') {
        if (spaceRight < spaceRequired && spaceLeft > spaceRight) {
          newPos = 'left';
        }
      } else if (defaultPosition === 'left') {
        if (spaceLeft < spaceRequired && spaceRight > spaceLeft) {
          newPos = 'right';
        }
      }

      setPosition(newPos);
    };

    // Calculate immediately
    checkPosition();
    
    // Listen to scroll/resize to update position in real-time while open
    // Use capture phase for scroll to catch scroll events from parent containers
    window.addEventListener('resize', checkPosition);
    window.addEventListener('scroll', checkPosition, true);

    return () => {
      window.removeEventListener('resize', checkPosition);
      window.removeEventListener('scroll', checkPosition, true);
    };
  }, [isOpen, defaultPosition, spaceRequired, triggerRef]);

  return position;
};
