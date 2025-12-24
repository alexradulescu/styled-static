import type { Plugin } from "vite";
/** Plugin configuration options */
export interface StyledStaticOptions {
    /**
     * Prefix for generated class names.
     * @default 'ss'
     */
    classPrefix?: string;
    /**
     * Enable debug logging. Set to true or use DEBUG_STYLED_STATIC=true env var.
     * SECURITY: Debug logs expose file paths and internal state; disable in production.
     * @default false
     */
    debug?: boolean;
    /**
     * How to output CSS:
     * - 'auto' (default): Uses 'file' for library builds (build.lib set), 'virtual' for apps
     * - 'virtual': CSS as virtual modules (Vite bundles into single file)
     * - 'file': CSS as separate files co-located with JS (enables tree-shaking for libraries)
     * @default 'auto'
     */
    cssOutput?: "auto" | "virtual" | "file";
}
export declare function styledStatic(options?: StyledStaticOptions): Plugin;
export default styledStatic;
//# sourceMappingURL=vite.d.ts.map