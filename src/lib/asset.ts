/**
 * Is an image slot actually fillable?
 *
 * Exists because the components that render images are not the only things that
 * depend on whether an image is there. A heading and a paragraph introducing a
 * picture are worthless without the picture, and in launch mode the picture is the
 * part that disappears. Without this, a page ships copy pointing at nothing —
 * "below is the direction we gave them", below which there is nothing.
 *
 * Same rules as <ImageSlot /> and <Rendering />, in one place so they cannot drift:
 * the filename must resolve to a real file, and the file must be wide enough for
 * its slot. A 150px thumbnail stretched across a hero is a mistake, not an image.
 */
const assets = import.meta.glob<{ default: ImageMetadata }>('../assets/*.{jpg,jpeg,png,webp,avif}', {
  eager: true,
});

/** Narrowest an image may be and still fill a body-width slot. */
export const MIN_SLOT_WIDTH = 600;

/** `value` is a filename under src/assets/, or a Tbd, or anything else. */
export function assetUsable(value: unknown, minWidth = MIN_SLOT_WIDTH): boolean {
  if (typeof value !== 'string') return false;
  const img = assets[`../assets/${value}`]?.default;
  return !!img && img.width >= minWidth;
}
