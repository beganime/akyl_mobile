module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Плагин для декораторов (ОБЯЗАТЕЛЕН для WatermelonDB)
      ['@babel/plugin-proposal-decorators', { 'legacy': true }],
      // Плагин для Reanimated должен быть ВСЕГДА последним в списке
      'react-native-reanimated/plugin',
    ],
  };
};