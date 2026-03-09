const fs = require('fs');

const files = ['android/settings.gradle', 'android/app/build.gradle'];

files.forEach(file => {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');
  
  // 1. Убиваем баг WatermelonDB: заменяем глючный скрипт на прямой путь
  const regexWmelon = /\[\s*(['"])node\1\s*,\s*(['"])--print\2\s*,\s*(['"])require\.resolve\('@nozbe\/watermelondb\/package\.json'\)\3\s*\]\.execute\(null,\s*rootProject\.projectDir\)\.text\.trim\(\)/g;
  content = content.replace(regexWmelon, 'new File(rootProject.projectDir, "../node_modules/@nozbe/watermelondb").absolutePath');
  
  // 2. Исправляем пути для базовых скриптов Expo (добавляем cmd /c)
  content = content.replace(/commandLine\("node",/g, 'commandLine("cmd", "/c", "node",');
  
  fs.writeFileSync(file, content);
});

console.log('✅ Финальный патч для Windows успешно применен!');