const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const app = express();
const PORT = 3000;

// Парсинг данных формы
app.use(express.urlencoded({ extended: true }));
app.use(express.static('.'));

// Подключение к базе
const db = new sqlite3.Database('respons.db');

// Настройки против блокировок
db.exec("PRAGMA journal_mode = WAL;");
db.configure('busyTimeout', 5000);

// Создаём таблицу respons (если нет)
db.run(`CREATE TABLE IF NOT EXISTS respons (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  phone TEXT,
  email TEXT,
  list TEXT,
  messages TEXT
)`);

// Создаём таблицу images
db.run(`CREATE TABLE IF NOT EXISTS images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  class TEXT NOT NULL,
  url TEXT NOT NULL
)`);

// ПЕРЕХОЖУ НА СТРАНИЦЦУ ПО ИМЕНИ А НЕ ПО .HTML
app.get('/admin', (req, res) => {
  res.sendFile(__dirname + '/admin.html');
});

// Настройка multer для загрузки файлов
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Получаем класс из формы
    const imgClass = req.body.class;

    // Формируем путь: uploads/hero/, uploads/icon/ и т.д.
    const dir = `uploads/${imgClass}`;

    // Создаём папку, если её нет
    const fs = require('fs');
    fs.mkdirSync(dir, { recursive: true });

    cb(null, dir); // указываем папку для сохранения
  },
  filename: (req, file, cb) => {
    // Уникальное имя файла
    const uniqueName = `img_${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ storage: storage });

// Обработка загрузки
app.post('/upload-image', upload.single('image'), (req, res) => {
  const { class: imgClass } = req.body;
  const filename = req.file.filename;
  const url = `/uploads/${imgClass}/${filename}`; // ← путь с подпапкой

  // Сохраняем в базу
  const stmt = db.prepare("INSERT INTO images (class, url) VALUES (?, ?)");
  stmt.run(imgClass, url, function (err) {
    if (err) {
      return res.send(`❌ Ошибка: ${err.message}`);
    }
    
  });
  stmt.finalize();
});

// Получить картинку по классу
app.get('/image/:class', (req, res) => {
  const { class: imgClass } = req.params;
  db.get("SELECT url FROM images WHERE class = ? ORDER BY id DESC LIMIT 1", [imgClass], (err, row) => {
    if (err || !row) {
      return res.status(404).json({ error: 'Картинка не найдена' });
    }
    res.json(row); // { "url": "/uploads/hero_123.jpg" }
  });
});

// Раздаём файлы из папки uploads
app.use('/uploads', express.static('uploads'));

app.get('/data', (req, res) => {
  db.all("SELECT * FROM respons", (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows); // вернёт массив объектов
  });
});

// Обработка формы ОТПРАВКА С ФОРМЫ НА СЕРВЕР

app.post('/save', (req, res) => {
    const { name, phone, email, list, messages } = req.body;


    const stmt = db.prepare("INSERT INTO respons (name, phone, email, list, messages) VALUES (?, ?, ?, ?, ?)");
    stmt.run(name, phone, email, list, messages, function (err) {
        if (err) {
        return res.send(`❌ Ошибка: ${err.message}`);
        }
    });
    stmt.finalize(); // ← обязательно!
});

// Функция: рекурсивно читает все файлы из папки и подпапок
function readFilesRecursive(folderPath, root = folderPath) {
  let filesList = [];
  const items = fs.readdirSync(folderPath, { withFileTypes: true });

  items.forEach(item => {
    const itemPath = path.join(folderPath, item.name);

    if (item.isDirectory()) {
      // Рекурсия по подпапкам
      filesList = filesList.concat(readFilesRecursive(itemPath, root));
    } else {
      // Это файл — проверим, изображение ли
      const ext = path.extname(item.name).toLowerCase();
      const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
      if (allowed.includes(ext)) {
        // Относительный путь от корня uploads
        const relativePath = path.relative(root, itemPath).replace(/\\/g, '/');
        filesList.push(`/uploads/${relativePath}`);
      }
    }
  });
  return filesList;
}

app.get('/files', (req, res) => {
  try {
    const files = readFilesRecursive('uploads');
    res.json(files);
  } catch (err) {
    res.status(500).json({ error: 'Не удалось прочитать папку: ' + err.message });
  }
});


// ОТПРАВКА С ФОРМЫ НА СЕРВЕР
app.listen(PORT, () => {
  console.log(`✅ Сервер запущен: http://localhost:${PORT}`);
  console.log(`👉 Загрузка: http://localhost:${PORT}/upload`);
});

