/** GitHub Pages 以仓库名作为路径前缀；其他端继续使用应用内静态资源路径。 */
export function journalAsset(name: string) {
  let base = '/'
  // #ifdef H5
  base = import.meta.env.BASE_URL
  // #endif
  return `${base}static/journal-icons/${name}.svg`
}
