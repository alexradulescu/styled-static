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
}
export declare function styledStatic(options?: StyledStaticOptions): Plugin;
export default styledStatic;
//# sourceMappingURL=vite.d.ts.map