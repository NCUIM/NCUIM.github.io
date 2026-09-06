import { getPlatforms } from "@ionic/react";

/**
 * True when Ionic renders headers in iOS (Cupertino) mode.
 *
 * Cupertino toolbars absolutely center the title across the full bar, so pages
 * with several actions split them: the primary action goes leading (flanking
 * the back chevron), secondary actions stay trailing — keeping the centered
 * title clear. Android (md/Material) keeps the title at the leading edge in
 * flow, so every action can live in the trailing group.
 */
export const isIosHeaderMode = (): boolean => getPlatforms().includes("ios");
