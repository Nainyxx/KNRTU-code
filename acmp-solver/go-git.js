const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const task_url = 'https://acmp.ru/index.asp?main=task&id_task=';
const url = 'https://acmp.ru/';
const login = 'watsonnlie';
const password = 'Qwerazsx7';

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Функция для чтения Go файлов из папки
function readGoFiles(folderPath) {
    const files = {};
    
    try {
        console.log(`[INFO] Reading directory: ${folderPath}`);
        const items = fs.readdirSync(folderPath);
        
        items.forEach(item => {
            if (item.endsWith('.go')) {
                const taskNumber = item.replace('.go', '');
                const filePath = path.join(folderPath, item);
                const content = fs.readFileSync(filePath, 'utf8');
                files[taskNumber] = content;
                console.log(`[OK] Loaded task ${taskNumber}.go`);
            }
        });
        
        return files;
    } catch (error) {
        console.error('[ERROR] Failed to read Go files:', error.message);
        return {};
    }
}

// Функция для чтения выполненных задач
function readMakedTasks() {
    try {
        const data = fs.readFileSync('maked_tasks.txt', 'utf8');
        const maked_tasks = data.trim().split(' ').map(Number);
        console.log('Массив выполненных задач:', maked_tasks);
        return maked_tasks;
    } catch (err) {
        console.error('Ошибка чтения файла maked_tasks.txt:', err);
        return [];
    }
}

async function launchBrowser() {
    console.log('[NOTE] Launching browser...');
    
    const browser = await puppeteer.launch({
        headless: false,
        executablePath: '/usr/bin/chromium',
        defaultViewport: null,
        args: [
            '--start-maximized',
            '--no-sandbox',
            '--disable-setuid-sandbox'
        ]
    });

    console.log('[OK] Browser started');
    return browser;
}

async function loginToACMP(page) {
    try {
        console.log('[INFO] Going to ACMP...');
        await page.goto(url, {
            waitUntil: 'domcontentloaded',
            timeout: 60000
        });
        
        console.log('[OK] ACMP loaded');
        await sleep(3000);

        await page.waitForSelector('input[name="lgn"]', { timeout: 10000 });
        await page.waitForSelector('input[name="password"]', { timeout: 10000 });
        console.log('[OK] Login form loaded');

        await page.type('input[name="lgn"]', login, { delay: 50 });
        await page.type('input[name="password"]', password, { delay: 50 });
        console.log('[OK] Credentials entered');

        await page.click('input[type="submit"]');
        console.log('[OK] Logged in');
        await sleep(3000);

        // Проверяем что залогинились
        const content = await page.content();
        if (content.includes('Выход') || content.includes(login)) {
            console.log('[OK] Login confirmed');
            return true;
        } else {
            console.log('[ERROR] Login failed - not on correct page');
            return false;
        }

    } catch (error) {
        console.log('[ERROR] Login failed:', error.message);
        return false;
    }
}

// ФУНКЦИЯ ДЛЯ ВЫБОРА ЯЗЫКА GO
async function selectGoLanguage(page) {
    try {
        // Выбираем GO из выпадающего списка
        await page.select('select[name="lang"]', 'GO');
        console.log('[OK] Selected Go language (GO)');
        return true;
    } catch (error) {
        console.log('[ERROR] Failed to select Go language:', error.message);
        return false;
    }
}

async function submitSolutionGo(page, code, taskNumber) {
    try {
        console.log(`[INFO] Going to task ${taskNumber} submit page...`);
        
        // ПРАВИЛЬНЫЙ URL ДЛЯ ОТПРАВКИ РЕШЕНИЯ
        const submitUrl = `https://acmp.ru/index.asp?main=task&id_task=${taskNumber}`;
        console.log(`[INFO] URL: ${submitUrl}`);
        
        await page.goto(submitUrl, {
            waitUntil: 'domcontentloaded',
            timeout: 60000
        });
        
        console.log('[OK] Submit page loaded');
        await sleep(3000);

        // Проверяем что мы на странице отправки
        const currentUrl = page.url();
        console.log(`[INFO] Current URL: ${currentUrl}`);

        // Проверяем наличие редактора кода
        try {
            await page.waitForSelector('.CodeMirror', { timeout: 10000 });
            console.log('[OK] Code editor found');
        } catch (error) {
            console.log('[ERROR] Code editor not found on page');
            return false;
        }

        // Вставляем код в редактор
        await page.evaluate((code) => {
            const editor = document.querySelector('.CodeMirror').CodeMirror;
            if (editor) {
                editor.setValue(code);
            }
        }, code);
        
        console.log('[OK] Code inserted');

        // ВЫБИРАЕМ ЯЗЫК GO
        await selectGoLanguage(page);
        await sleep(1000);

        // НАЖИМАЕМ КНОПКУ "ОТПРАВИТЬ" (правильный селектор)
        await page.evaluate(() => {
            const submitButton = document.querySelector('input[type="button"][value="Отправить"]');
            if (submitButton) {
                submitButton.click();
            }
        });

        console.log('[OK] Solution submitted');
        await sleep(5000);

        return true;
    } catch (error) {
        console.log('[ERROR] Submission failed:', error.message);
        return false;
    }
}

async function getSolutionResult(page, taskNumber) {
    try {
        await page.goto('https://acmp.ru/index.asp?main=status', {
            waitUntil: 'domcontentloaded',
            timeout: 30000
        });
        await sleep(3000);
        
        const result = await page.evaluate((taskNum) => {
            const rows = document.querySelectorAll('tr');
            for (let i = 0; i < rows.length; i++) {
                const cells = rows[i].querySelectorAll('td');
                if (cells.length >= 7) {
                    const taskCell = cells[3];
                    if (taskCell) {
                        const taskLink = taskCell.querySelector('a');
                        if (taskLink && taskLink.textContent.includes(taskNum)) {
                            const resultCell = cells[5];
                            const testCell = cells[6];
                            return {
                                status: resultCell ? resultCell.textContent.trim() : 'Unknown',
                                test: testCell ? testCell.textContent.trim() : 'Unknown',
                                fullText: `${resultCell ? resultCell.textContent.trim() : 'Unknown'} (test ${testCell ? testCell.textContent.trim() : 'Unknown'})`
                            };
                        }
                    }
                }
            }
            return null;
        }, taskNumber.toString());

        if (result) {
            console.log(`[RESULT] Task ${taskNumber}: ${result.fullText}`);
            return result.status;
        }
        
        return 'Result not found';
    } catch (error) {
        console.log('[ERROR] Check failed:', error.message);
        return 'Check error';
    }
}

// Основная функция
async function submitGoSolutions(startTask, endTask) {
    const folderPath = './go-acmp.ru';

    // Читаем Go файлы
    const goFiles = readGoFiles(folderPath);
    
    if (Object.keys(goFiles).length === 0) {
        console.log('[ERROR] No Go files found');
        return;
    }

    console.log(`[OK] Found ${Object.keys(goFiles).length} Go files`);

    // Читаем выполненные задачи
    const maked_tasks = readMakedTasks();
    console.log(`[INFO] Loaded ${maked_tasks.length} completed tasks`);

    const browser = await launchBrowser();
    const page = await browser.newPage();

    try {
        // Увеличиваем таймауты
        page.setDefaultTimeout(60000);
        page.setDefaultNavigationTimeout(60000);

        // Логинимся
        const loggedIn = await loginToACMP(page);
        if (!loggedIn) {
            console.log('[ERROR] Cannot continue without login');
            return;
        }

        // Фильтруем задачи по диапазону
        const tasksToSubmit = Object.keys(goFiles)
            .filter(taskNum => {
                const num = parseInt(taskNum);
                return num >= startTask && num <= endTask;
            })
            .sort((a, b) => parseInt(a) - parseInt(b));

        console.log(`[OK] Will submit ${tasksToSubmit.length} tasks: ${tasksToSubmit.join(', ')}`);

        for (const taskNumber of tasksToSubmit) {
            // Проверяем, выполнена ли уже задача
            const taskNumInt = parseInt(taskNumber);
            if (maked_tasks.includes(taskNumInt)) {
                console.log(`[SKIP] Task ${taskNumber} already completed`);
                continue;
            }
            
            try {
                console.log(`\n=== Processing task ${taskNumber} ===`);
                
                const code = goFiles[taskNumber];
                
                // Отправляем решение
                const submitted = await submitSolutionGo(page, code, taskNumber);
                
                if (!submitted) {
                    console.log(`[SKIP] Submission failed for task ${taskNumber}`);
                    continue;
                }

                // Проверяем результат
                await sleep(9000);
                
                let resultChecked = false;
                for (let attempt = 0; attempt < 3; attempt++) {
                    const result = await getSolutionResult(page, taskNumber);
                    
                    if (result === 'Accepted') {
                        console.log("\n🎉 SUCCESS! Task accepted!\n");
                        resultChecked = true;
                        break;
                    } else if (result === 'Result not found') {
                        console.log(`[WAIT] Result not found, waiting... (attempt ${attempt + 1}/3)`);
                        await sleep(3000);
                    } else {
                        console.log(`[RESULT] ${result}`);
                        resultChecked = true;
                        break;
                    }
                }

                if (!resultChecked) {
                    console.log(`[NOTE] Could not verify result for task ${taskNumber}`);
                }

                // Пауза между задачами
                await sleep(2000);

            } catch (error) {
                console.log(`[ERROR] Task ${taskNumber} failed:`, error.message);
                continue;
            }
        }

    } catch (error) {
        console.log('[ERROR] Main error:', error);
    } finally {
        console.log('\n[INFO] Closing browser...');
        await browser.close();
    }
}

// Запускаем скрипт
submitGoSolutions(10, 1000);