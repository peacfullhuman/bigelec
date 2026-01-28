// const { text } = require("express");

const dropdownBtn = document.querySelector('.sub-menu-btn');
const dropdownContent = document.querySelector('.sub-menu-content');
const btnForm = document.getElementById('btn-form')
const closeGal = document.getElementsByClassName('close-gal')
const galers = document.getElementsByClassName('photos')



// Обработчик клика по кнопке
dropdownBtn.addEventListener('click', function(e) {
  e.stopPropagation(); // Препятствуем всплытию события
  dropdownContent.classList.toggle('show');
});

// Закрываем меню при клике вне его
window.addEventListener('click', function(e) {
  if (!dropdownContent.contains(e.target) && e.target !== dropdownBtn) {
    dropdownContent.classList.remove('show');
  }
});

// Дополнительно: закрываем меню по клавише Esc
window.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    dropdownContent.classList.remove('show');
  }
});


fetch('/files')
  .then(response => response.json())
  .then(files => {
    const container = document.getElementById('file-list');

    if (files.length === 0) {
      container.innerHTML = '<p>Нет картинок</p>';
      return;
    }

        // Группировка по папкам
    const grouped = {};
    files.forEach(file => {
      const folder = file.split('/').slice(2, -1).join('/') || 'корень';
      if (!grouped[folder]) grouped[folder] = [];
      grouped[folder].push(file);
    });


      // ДОБАВЛЯЕМ В ГАЛЕРЕЮ, 
    for (const [folder, imgs] of Object.entries(grouped)) { 
      imgs.forEach(img => {
        const mainName = img.split('/')[2] //БЕРЕТ ИМЯ ПАПКИ
        const filename = img.split('/').pop(); //БЕРЕТ ИМЯ ФАЙЛА

        ph = document.createElement('div')
        ph.id = `${filename}`
        ph.className = 'photo'
        ph.style.backgroundImage = `url(${img})`
        ph.style.backgroundPosition = 'center'
        document.getElementById(`${mainName}`).appendChild(ph) //ВСЕ ДОБОВЛЯЕТ ПО ГАЛЕРЕЯМ
      });
    }


  })
  .catch(err => {
  console.error('Ошибка:', err);
  container.innerHTML = '<p>❌ Не удалось загрузить файлы</p>';
});

btnForm.addEventListener('click', function(e) {
    btnForm.innerHTML = 'Отправлено'
})


// ОТКРЫВАЕМ ГАЛЕРЕЮ ПО НАЖАТИЮ


Array.from(galers).forEach(function(bt){
  bt.addEventListener('click', function(a){
    document.getElementById(`${bt.classList[1].split('-')[0]}-gal`).style.display = "flex"
    
    // ЗАКРЫВАЮ ГАЛЕРЕЮ ТУТ ЖЕ
    Array.from(closeGal).forEach(function(dt){
      dt.addEventListener('click', function(a){
        document.getElementById(`${bt.classList[1].split('-')[0]}-gal`).style.display = "none"
      })
})
  
  })
})
