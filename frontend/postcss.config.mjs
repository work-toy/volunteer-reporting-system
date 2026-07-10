/**
 * PostCSS 配置文件
 *
 * PostCSS 是一个用 JavaScript 插件转换 CSS 的工具。
 * 本文件配置了 Tailwind CSS v4 的 PostCSS 插件，
 * 使得项目可以使用 Tailwind CSS 的原子化样式类。
 */

export default {
  plugins: {
    /**
     * @tailwindcss/postcss — Tailwind CSS v4 的 PostCSS 插件
     *
     * Tailwind CSS 是一个原子化（utility-first）的 CSS 框架。
     * 该插件会扫描模板文件中的类名，生成对应的 CSS 样式，
     * 并支持 @theme 自定义主题变量、@apply 组合样式等特性。
     * v4 版本不再需要 tailwind.config.js，配置直接在 CSS 文件中通过 @theme 完成。
     */
    "@tailwindcss/postcss": {},
  },
};
