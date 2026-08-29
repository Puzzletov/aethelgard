import type { CSSProperties } from "react";

export const visualTokens = {
  color: {
    paper: "#f3efe6",
    paperDeep: "#e8e0d2",
    charcoal: "#242522",
    charcoalSoft: "#55564f",
    terracotta: "#a84f35",
    terracottaDark: "#743522",
    rule: "#c9c0b1",
    white: "#fffdf8",
  },
  font: {
    display: '"Fraunces", Georgia, serif',
    body: '"Public Sans", Arial, sans-serif',
  },
  measure: {
    page: "90rem",
    reading: "42rem",
  },
  radius: {
    small: "0.25rem",
  },
  space: {
    xs: "0.5rem",
    sm: "0.75rem",
    md: "1rem",
    lg: "1.5rem",
    xl: "2.5rem",
    xxl: "4rem",
    section: "7rem",
  },
} as const;

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
