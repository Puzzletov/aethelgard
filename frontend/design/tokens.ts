import type { CSSProperties } from "react";
import { visualTokens } from "../../src/design/visual-tokens.ts";

export { visualTokens } from "../../src/design/visual-tokens.ts";

type TokenVariable = `--${string}`;
type TokenStyle = CSSProperties & Record<TokenVariable, string>;

export const cssTokenVariables: TokenStyle = {
  "--color-paper": visualTokens.color.paper,
  "--color-paper-deep": visualTokens.color.paperDeep,
  "--color-charcoal": visualTokens.color.charcoal,
  "--color-charcoal-soft": visualTokens.color.charcoalSoft,
  "--color-terracotta": visualTokens.color.terracotta,
  "--color-terracotta-dark": visualTokens.color.terracottaDark,
  "--color-rule": visualTokens.color.rule,
  "--color-white": visualTokens.color.white,
  "--font-display": visualTokens.font.display,
  "--font-body": visualTokens.font.body,
  "--measure-page": visualTokens.measure.page,
  "--measure-reading": visualTokens.measure.reading,
  "--radius-small": visualTokens.radius.small,
  "--space-xs": visualTokens.space.xs,
  "--space-sm": visualTokens.space.sm,
  "--space-md": visualTokens.space.md,
  "--space-lg": visualTokens.space.lg,
  "--space-xl": visualTokens.space.xl,
  "--space-xxl": visualTokens.space.xxl,
  "--space-section": visualTokens.space.section,
};
