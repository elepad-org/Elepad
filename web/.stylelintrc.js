export default {
  extends: ['stylelint-config-standard'],
  customSyntax: 'postcss-syntax',
  rules: {
    'at-rule-no-unknown': null, // Allow @tailwind and other PostCSS at-rules
  },
};