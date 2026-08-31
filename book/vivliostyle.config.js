const { getBookEntries } = require('../scripts/getArticleEntries.cts')

module.exports = {
  title: 'Windows + Radeon で育てるローカル LLM 環境',
  author: '江本光晴',
  language: 'ja',
  size: 'A5',
  theme: [
    'vivliostyle-theme-macneko-techbook@0.5.0',
    '@mitsuharu/vivliostyle-theme-noto-sans-jp@0.1.4',
    'theme/theme-custom',
  ],
  entry: getBookEntries(),
  entryContext: './manuscripts',
  output: ['output/ebook.pdf'],
  workspaceDir: '.vivliostyle',
  toc: false,
  cover: undefined,
}
