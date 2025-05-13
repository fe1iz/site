// Функция для переключения вкладок и вызова генерации статистики при необходимости
function openTab(tab_name) {
    // Скрыть все секции
    var i, tabcontent;
    tabcontent = document.getElementsByClassName("content-section");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }

    // Показать нужную секцию
    document.getElementById(tab_name).style.display = "block";

    // Проверяем, необходимо ли генерировать статистику
    if (tab_name === 'table-stats') {
        generateStatistics();
    }
    if (tab_name === 'graph-stats' ) {
        generateStatistics(); 
    }
}

// Устанавливаем событие onClick для каждой вкладки в навигации
document.querySelectorAll('nav ul li a').forEach(link => {
    link.addEventListener('click', function(e) {
        e.preventDefault(); // Отменить стандартное поведение ссылок
        var tabName = this.getAttribute('href').substring(1);
        openTab(tabName); // Изменено на вызов openTab с текущим tabName
    });
});

// Показать первую вкладку при загрузке страницы
openTab('upload');

window.addEventListener('DOMContentLoaded', () => {
    const file = document.getElementById('file-input');
    const upload_btn = document.getElementById('upload-button');
    const data_preview = document.getElementById('data-preview');

    upload_btn.addEventListener('click', () => { file.click(); });

    file.addEventListener('change', () => {
        const selected_file = file.files[0];
        if (selected_file) {
            const file_reader = new FileReader();
            file_reader.onload = (e) => renderCSVToTable(e.target.result);
            file_reader.readAsText(selected_file);
        }
    });

    function renderCSVToTable(csvData) {
        const rows = csvData.split('\n');
        let html = '<table id="students-table">';
        rows.forEach((row, index) => {
            const columns = row.split(';');
            if(index === 0) {
                html += '<thead><tr>';
            } else if(index === 1) {
                html += '<tbody><tr>';
            } else {
                html += '<tr>';
            }
            columns.forEach(column => {
                if(index === 0) {
                    html += `<th>${column}</th>`;
                } else {
                    html += `<td>${column}</td>`;
                }
            });
            if(index > 0) {
                html += `<td><button class="delete-btn" data-row-index="${index}">Удалить</button></td>`;
            }
            if(index === 0) {
                html += '<th>Действия</th></tr></thead>';
            } else {
                html += '</tr>';
            }
        });
        if(rows.length > 1) {
            html += '</tbody>';
        }
        html += '</table>';
        data_preview.innerHTML = html;
        setupDeleteButtons();
    }
});

function setupDeleteButtons() {
    document.querySelectorAll('.delete-btn').forEach(button => {
        button.addEventListener('click', function() {
            this.closest('tr').remove(); 
            generateStatistics();
        });
    });
}

// Функция для удаления строки
function deleteRow(btn) {
    const row = btn.parentNode.parentNode;
    row.parentNode.removeChild(row);
    generateStatistics(); // обновляем статистику
}

function addOrUpdateStudent() {
    // Получение данных из формы
    const name = document.getElementById('student-name').value.trim();
    const studentClass = document.getElementById('student-class').value.trim();
    const gradeInformatics = document.getElementById('grade-informatics').value;
    const gradePhysics = document.getElementById('grade-physics').value;
    const gradeMath = document.getElementById('grade-math').value;
    const gradeLiterature = document.getElementById('grade-literature').value;
    const gradeMusic = document.getElementById('grade-music').value;

    // Проверка заполнения ФИО и класса
    if (!name || !studentClass) {
        alert('Пожалуйста, заполните ФИО и класс ученика.');
        return;
    }

    // Поиск существующей строки ученика по ФИО
    const table = document.getElementById('students-table'); // предполагаем, что у вас есть таблица с id 'students-table'
    const existingRow = [...table.rows].find(row => row.cells[0].textContent === name);

    if (existingRow) {
        // Обновление существующей строки
        existingRow.cells[1].textContent = studentClass;
        existingRow.cells[2].textContent = gradeInformatics;
        existingRow.cells[3].textContent = gradePhysics;
        existingRow.cells[4].textContent = gradeMath;
        existingRow.cells[5].textContent = gradeLiterature;
        existingRow.cells[6].textContent = gradeMusic;
    } else {
        // Добавление новой строки
        const newRow = table.insertRow(-1); // Вставка строки в конец таблицы
        newRow.insertCell(0).textContent = name;
        newRow.insertCell(1).textContent = studentClass;
        newRow.insertCell(2).textContent = gradeInformatics;
        newRow.insertCell(3).textContent = gradePhysics;
        newRow.insertCell(4).textContent = gradeMath;
        newRow.insertCell(5).textContent = gradeLiterature;
        newRow.insertCell(6).textContent = gradeMusic;
        const deleteCell = newRow.insertCell(7);
        deleteCell.innerHTML = `<button class="delete-btn" onclick="deleteRow(this)">Удалить</button>`;
    }

    // Очистка формы после добавления/обновления
    document.getElementById('student-form').reset();
    
    generateStatistics();
}

// Функция для вычисления среднего значения
function calculateAverage(grades) {
    const sum = grades.reduce((a, b) => a + b, 0);
    return (sum / grades.length) || 0;
}

// Функция для вычисления медианы
function calculateMedian(grades) {
    const sortedGrades = [...grades].sort((a, b) => a - b);
    const mid = Math.floor(sortedGrades.length / 2);
    return sortedGrades.length % 2 !== 0
        ? sortedGrades[mid]
        : (sortedGrades[mid - 1] + sortedGrades[mid]) / 2;
}

// Функция для подсчета учеников, получивших каждую оценку
function countGrades(grades) {
    const counts = { '2': 0, '3': 0, '4': 0, '5': 0 };
    grades.forEach(grade => {
        counts[grade]++;
    });
    return counts;
}

window.classChart = null;
window.studentChart = null;
// Функция для очистки графиков перед их пересозданием
function clearCharts() {
    // Удаляем старые экземпляры графиков, если они существуют
    if (window.classChart) {
        window.classChart.destroy();
    }
    if (window.studentChart) {
        window.studentChart.destroy();
    }
}

function generateStatistics() {
    // Предполагаем, что таблица со студентами имеет id 'students-table'
    const studentsTable = document.getElementById('students-table');
    if (!studentsTable) {
        console.error('Таблица студентов не найдена!');
        return;
    }
    const statistics = {}; // Объект для хранения статистики

    // Собираем данные из таблицы
    for (let row of studentsTable.rows) {
        if (row.rowIndex === 0) continue; // Пропускаем заголовок таблицы
        if (row.cells.length < 7) {
            console.error(`Найдена строка с недостаточным количеством ячеек: ${row.innerHTML}`);
            continue; // Пропускаем эту строку
        }

        const classInfo = row.cells[1].textContent;
        const grades = Array.from(row.cells).slice(2, -1).map(cell => parseInt(cell.textContent, 10));

        // Инициализация статистики для класса, если ещё не существует
        if (!statistics[classInfo]) {
            statistics[classInfo] = grades.map(() => ({
                total: [],
                average: 0,
                median: 0,
                counts: {'2': 0, '3': 0, '4': 0, '5': 0 },
                percentages: { '2': 0, '3': 0, '4': 0, '5': 0 }
            }));
        }
        // Сохраняем оценки по каждому предмету
        grades.forEach((grade, i) => {
            if (grade) {
                statistics[classInfo][i].total.push(grade);
            }
        });
    }

    // Вычисляем статистику для каждого класса и предмета
    for (let classInfo of Object.keys(statistics)) {
        statistics[classInfo].forEach((subjectStats, index) => {
            subjectStats.average = calculateAverage(subjectStats.total);
            subjectStats.median = calculateMedian(subjectStats.total);
            const gradeCounts = countGrades(subjectStats.total);
            for (let grade of Object.keys(gradeCounts)) {
                subjectStats.counts[grade] = gradeCounts[grade];
                subjectStats.percentages[grade] = (gradeCounts[grade] / subjectStats.total.length) * 100;
            }
        });
    }

    const studentStatistics = {}; // Объект для хранения статистики каждого ученика

    // Собираем данные для статистики каждого ученика
    for (let row of studentsTable.rows) {
        if (row.rowIndex === 0 || row.cells.length < 7) continue; // Пропускаем заголовок и неполные строки

        const studentName = row.cells[0].textContent;
        const grades = Array.from(row.cells).slice(2, -1).map(cell => parseInt(cell.textContent, 10));

        // Инициализация статистики для ученика, если ещё не существует
        if (!studentStatistics[studentName]) {
            studentStatistics[studentName] = grades.map(() => ({
                total: [],
                average: 0,
                median: 0,
                counts: {'2': 0, '3': 0, '4': 0, '5': 0 },
                percentages: { '2': 0, '3': 0, '4': 0, '5': 0 }
            }));
        }

        // Сохраняем оценки ученика по каждому предмету
        grades.forEach((grade, i) => {
            if (grade) {
                studentStatistics[studentName][i].total.push(grade);
            }
        });
    }

    // Вычисляем статистику для каждого ученика
    for (let studentName of Object.keys(studentStatistics)) {
        studentStatistics[studentName].forEach((subjectStats, index) => {
            subjectStats.average = calculateAverage(subjectStats.total);
            subjectStats.median = calculateMedian(subjectStats.total);
            const gradeCounts = countGrades(subjectStats.total);
            for (let grade of Object.keys(gradeCounts)) {
                subjectStats.counts[grade] = gradeCounts[grade];
                subjectStats.percentages[grade] = (gradeCounts[grade] / subjectStats.total.length) * 100;
            }
        });
    }

    // Очистите старые графики перед созданием новых
    clearCharts();

    // Вызываем функцию отображения статистики с двумя объектами: для классов и учеников
    displayStatistics(statistics, studentStatistics);
    // Создайте новые графики с обновленной статистикой
    createClassChart(statistics);
    createStudentChart(studentStatistics);
}

// Функция для создания графика классов
function createClassChart(statistics) {
    const classData = {
        labels: Object.keys(statistics),
        datasets: []
    };

    // Добавляем данные для каждого предмета
    const subjects = ['Информатика', 'Физика', 'Математика', 'Литература', 'Музыка'];
    subjects.forEach((subject, index) => {
        const dataset = {
            label: subject,
            data: [],
            backgroundColor: getRandomColor(), // Функция для получения случайного цвета
            borderWidth: 1
        };

        Object.values(statistics).forEach(classStats => {
            dataset.data.push(classStats[index].average);
        });

        classData.datasets.push(dataset);
    });

    // Получаем элемент canvas
    const ctx = document.getElementById('class-chart').getContext('2d');

    // Создаем график
    window.classChart = new Chart(ctx, {
        type: 'bar',
        data: classData,
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// Функция для создания графика студентов
function createStudentChart(studentStatistics) {
    const studentData = {
        labels: Object.keys(studentStatistics),
        datasets: []
    };

    // Добавляем данные для каждого предмета
    const subjects = ['Информатика', 'Физика', 'Математика', 'Литература', 'Музыка'];
    subjects.forEach((subject, index) => {
        const dataset = {
            label: subject,
            data: [],
            backgroundColor: getRandomColor(), // Функция для получения случайного цвета
            borderWidth: 1
        };

        Object.values(studentStatistics).forEach(studentStats => {
            dataset.data.push(studentStats[index].average);
        });

        studentData.datasets.push(dataset);
    });

    // Получаем элемент canvas
    const ctx = document.getElementById('student-chart').getContext('2d');

    // Создаем график
    window.studentChart = new Chart(ctx, {
        type: 'bar',
        data: studentData,
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function displayStatistics(statistics, studentStatistics) {
    const statsSection = document.getElementById('table-stats');
    let html = '<table class="table-stat">';
    html += '<thead>';
    html += '<tr><th>Класс</th><th>Предмет</th><th>Средняя оценка</th><th>Медиана</th>';
    
    // Заголовки для количества оценок
    for (let i = 5; i > 1; i--) {
        html += `<th>Количество ${i}</th>`;
    }
    // Заголовки для процентного соотношения оценок
    for (let i = 5; i > 1; i--) {
        html += `<th>Процент ${i}</th>`;
    }
    
    html += '</tr></thead><tbody>';

    // Названия предметов
    const subjects = ['Информатика', 'Физика', 'Математика', 'Литература', 'Музыка'];

    // Заполнение таблицы данными
    for (let classInfo of Object.keys(statistics)) {
        statistics[classInfo].forEach((subjectStats, index) => {
            html += `<tr>`;
            html += `<td>${classInfo}</td>`;
            html += `<td>${subjects[index]}</td>`;
            html += `<td>${subjectStats.average.toFixed(2)}</td>`;
            html += `<td>${subjectStats.median.toFixed(2)}</td>`;
            
            // Данные по количеству оценок
            for (let i = 5; i > 1; i--) {
                html += `<td>${subjectStats.counts[i] || 0}</td>`;
            }
            // Данные по процентному соотношению оценок
            for (let i = 5; i > 1; i--) {
                html += `<td>${(subjectStats.percentages[i] || 0).toFixed(2)}%</td>`;
            }
            html += `</tr>`;
        });
    }
    html += '</tbody></table>';

    // Добавляем таблицу статистики для каждого ученика ниже
    let studentStatsHtml = '<h3>Статистика по ученикам</h3><table>';

    // Создаем заголовки таблицы для статистики учеников
    studentStatsHtml += '<thead>';
    studentStatsHtml += '<tr><th>Имя ученика</th><th>Предмет</th><th>Средняя оценка</th><th>Медиана</th>';
    for (let i = 5; i > 1; i--) {
        studentStatsHtml += `<th>Количество ${i}</th>`;
    }
    for (let i = 5; i > 1; i--) {
        studentStatsHtml += `<th>Процент ${i}</th>`;
    }
    studentStatsHtml += '</tr></thead><tbody>';

    // Заполняем таблицу данными статистики для каждого ученика
    for (let studentName of Object.keys(studentStatistics)) {
        studentStatistics[studentName].forEach((subjectStats, index) => {
            studentStatsHtml += `<tr>`;
            studentStatsHtml += `<td>${studentName}</td>`;
            studentStatsHtml += `<td>${subjects[index]}</td>`;
            studentStatsHtml += `<td>${subjectStats.average.toFixed(2)}</td>`;
            studentStatsHtml += `<td>${subjectStats.median.toFixed(2)}</td>`;
            for (let i = 5; i > 1; i--) {
                studentStatsHtml += `<td>${subjectStats.counts[i] || 0}</td>`;
            }
            for (let i = 5; i > 1; i--) {
                studentStatsHtml += `<td>${(subjectStats.percentages[i] || 0).toFixed(2)}%</td>`;
            }
            studentStatsHtml += `</tr>`;
        });
    }
    studentStatsHtml += '</tbody></table>';

    // Добавляем обе таблицы статистики в секцию статистики
    statsSection.innerHTML = html + studentStatsHtml; // Объединяем HTML для классов и учеников
}

// Функция для получения случайного цвета (можно заменить на свой набор цветов)
function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

// Функция для преобразования данных таблицы в строку для файла, исключая колонку с кнопками "Удалить"
function tableToDataString(table, separator = ',', lineEnding = '\n', excludeLastColumn = true) {
    let dataString = '';
    for (const row of table.rows) {
        if (!row.textContent.trim()) continue;
        let rowData = [];
        const cellsLength = excludeLastColumn ? row.cells.length - 1 : row.cells.length;
        for (let i = 0; i < cellsLength; i++) {
            let cellText = row.cells[i].textContent;
            // Удаление переводов строки и замена кавычек для корректного CSV формата
            cellText = cellText.replace(/(\r\n|\n|\r)/gm, " ").replace(/"/g, '""');
            rowData.push(`${cellText}`);
        }
        if (rowData.length > 0) {
            dataString += rowData.join(separator) + lineEnding;
        }
    }
    return dataString.trimEnd();
}

// Функция для преобразования данных таблицы в строку CSV
function tableToCSVString(table, lineEnding = '\r\n') {
    let csvString = '';
    // Пропускаем последний столбец с кнопками "Удалить"
    const columnsCount = table.rows[0].cells.length - 1; 
    for (const row of table.rows) {
        let rowData = [];
        for (let i = 0; i < columnsCount; i++) {
            let cellText = row.cells[i].textContent;
            cellText = cellText.replace(/"/g, '""'); // Экранируем кавычки
            rowData.push(`"${cellText}"`); // Добавляем кавычки вокруг каждого значения
        }
        csvString += rowData.join(';') + lineEnding;
    }
    return csvString;
}

// Функция для скачивания файлов с UTF-8 BOM
function downloadFile(filename, content, mimeType) {
    const BOM = "\uFEFF"; // UTF-8 Byte Order Mark
    const blob = new Blob([BOM + content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const downloadLink = document.createElement("a");
    downloadLink.href = url;
    downloadLink.download = filename;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(url);
}

// Функция для скачивания таблицы в различных форматах
function downloadTableData() {
    const table = document.getElementById('students-table');
    if (table) {
        // Строка таблицы для TXT
        const txtData = tableToDataString(table, ';', '\r\n'); 
        downloadFile('data.txt', txtData, 'text/plain;charset=utf-8');

        // Строка таблицы для CSV
        const csvData = tableToDataString(table, ';', '\r\n');
        downloadFile('data.csv', csvData, 'text/csv;charset=utf-8');

        // Строка таблицы для Excel (простой формат, который Excel может открыть)
        const xlsData = tableToDataString(table, ';', '\r\n'); 
        downloadFile('data.xls', xlsData, 'application/octet-stream');
    }
}

document.getElementById('download-data-button').addEventListener('click', downloadTableData);
