import tseslint from "typescript-eslint";

/**
 * Layer boundaries are lint rules, not conventions (spec 15, guardrails 6).
 *
 * Flat config overwrites a rule name when a later block matches the same file,
 * so each layer's `no-restricted-imports` must include every restriction that
 * applies to it — including the branded-type mint.
 */

const BRAND_MINT = {
  group: ["**/domain/types/brand", "@/domain/types/brand"],
  importNames: ["unsafeBrand"],
  message:
    "Branded types are constructed only in domain/mappers/. Route this through a mapper (spec 15).",
};

const NETWORKING_AND_FRAMEWORK = [
  { group: ["react", "react-dom"], message: "domain/ is framework-free. Move this into ui/." },
  { group: ["react-native", "react-native/*"], message: "domain/ is framework-free. Move this into ui/." },
  { group: ["react-native-*"], message: "domain/ is framework-free. Move this into ui/." },
  { group: ["expo", "expo-*", "@expo/*", "@expo-google-fonts/*"], message: "domain/ is framework-free. Move this into ui/ or store/." },
  { group: ["@tanstack/*", "zustand", "zustand/*"], message: "domain/ holds no state and no query layer." },
  { group: ["@/api", "@/api/*"], message: "domain/ may not import the transport layer. Mappers receive already-validated input." },
  { group: ["@/ui", "@/ui/*"], message: "domain/ may not import ui/." },
  { group: ["@/store", "@/store/*"], message: "domain/ may not import store/." },
];

export default tseslint.config(
  {
    ignores: [
      "node_modules/**",
      ".expo/**",
      "dist/**",
      "dist-ios/**",
      "src/api/generated/**",
      ".tmp-boundary-check/**",
      "files/**",
      "onfkowv1/**",
    ],
  },

  ...tseslint.configs.recommended,

  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "no-restricted-syntax": [
        "error",
        {
          selector: "TSAsExpression > TSUnknownKeyword",
          message:
            "`as unknown as` launders a contract mismatch. Fix the type or validate at the api/ boundary.",
        },
      ],
    },
  },

  {
    files: ["src/ui/**/*.{ts,tsx}", "app/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/api", "@/api/*"],
              message:
                "ui/ renders domain models. Import from @/domain instead of the transport layer (spec 15).",
            },
            BRAND_MINT,
          ],
        },
      ],
    },
  },

  {
    files: ["src/domain/**/*.ts"],
    ignores: ["src/domain/mappers/**", "src/domain/types/brand.ts"],
    rules: {
      "no-restricted-imports": ["error", { patterns: [...NETWORKING_AND_FRAMEWORK, BRAND_MINT] }],
    },
  },

  {
    files: ["src/domain/mappers/**/*.ts"],
    rules: {
      "no-restricted-imports": ["error", { patterns: NETWORKING_AND_FRAMEWORK }],
    },
  },

  {
    files: ["src/api/**/*.ts"],
    ignores: ["src/api/generated/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/ui", "@/ui/*"],
              message:
                "api/ contains no presentation copy. Map machine-readable codes; ui/ owns the words (guardrails 6).",
            },
            BRAND_MINT,
          ],
        },
      ],
    },
  },

  {
    files: ["src/store/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": ["error", { patterns: [BRAND_MINT] }],
    },
  },

  {
    files: ["scripts/**/*.mjs", "*.config.{ts,mjs}"],
    rules: { "@typescript-eslint/no-require-imports": "off" },
  },
);
