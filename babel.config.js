module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // 1. Декораторы (ОБЯЗАТЕЛЕН для WatermelonDB)
      ['@babel/plugin-proposal-decorators', { 'legacy': true }],
      // 2. Делаем свойства классов мягкими (loose), чтобы убрать ошибку TypeScript
      ['@babel/plugin-transform-class-properties', { 'loose': true }],
      // 3. Плагин для Reanimated должен быть ВСЕГДА последним в списке
      'react-native-reanimated/plugin',
    ],
  };
};