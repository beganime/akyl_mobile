const fs = require('fs');

const files = [
  'android/settings.gradle',
  'android/app/build.gradle'
];

files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Заменяем вызов "node" на жесткий "node.exe" для Windows
    content = content.replace(/"node",\s*"--print"/g, '"node.exe", "--print"');
    content = content.replace(/'node',\s*'--print'/g, "'node.exe', '--print'");
    
    fs.writeFileSync(file, content);
    console.log('✅ Успешно пропатчен файл для Windows: ' + file);
  } else {
    console.log('❌ Файл не найден: ' + file);
  }
});