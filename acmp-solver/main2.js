const axios = require('axios');
const puppeteer = require('puppeteer');
const fs = require('fs').promises;

// Config
const CONFIG = {
    // Technical ACMP datas
    ACMP: {
        URL: 'https://acmp.ru/',
        TASK_URL: 'https://acmp.ru/index.asp?main=task&id_task=',
        STATUS_URL: 'https://acmp.ru/index.asp?main=status',
        CREDENTIALS: {
            login: process.env.ACMP_LOGIN || 'watsonnlie',
            password: process.env.ACMP_PASSWORD || 'Qwerazsx7'
        }
    },
    // AI
    OPENROUTER: {
        API_URL: 'https://openrouter.ai/api/v1/chat/completions',
        API_KEY: process.env.OPENROUTER_API_KEY || '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',
        MODEL: 'deepseek/deepseek-chat',
        MAX_TOKENS: 4000
    },
    BROWSER: {
        HEADLESS: false,
        EXECUTABLE_PATH: '/usr/bin/chromium',
        VIEWPORT: null,
        ARGS: ['--start-maximized', '--no-sandbox', '--disable-setuid-sandbox']
    },
    TIMING: {
        PAGE_LOAD: 30000,
        SHORT_DELAY: 2000,
        MEDIUM_DELAY: 5000,
        LONG_DELAY: 8000,
        RESULT_CHECK_DELAY: 5000
    },
    RETRY: {
        MAX_ATTEMPTS: 3,
        MAX_RESULT_CHECKS: 10
    }
};



class ACMPSolver {
    constructor() {
        this.browser = null;
        this.page = null;
        this.completedTasks = new Set();
    }

    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async loadCompletedTasks() {
        try {
            const data = await fs.readFile('maked_tasks.txt', 'utf8');
            this.completedTasks = new Set(data.trim().split(' ').map(Number));
            console.log(`[OK] Loaded ${this.completedTasks.size} completed tasks`);
        } catch (error) {
            console.warn('[WARN] Could not load completed tasks file, starting fresh');
            this.completedTasks = new Set();
        }
    }

    async saveCompletedTask(taskId) {
        this.completedTasks.add(taskId);
        try {
            const tasksArray = Array.from(this.completedTasks).sort((a, b) => a - b);
            await fs.writeFile('maked_tasks.txt', tasksArray.join(' '));
            console.log(`[OK] Saved task ${taskId} to completed tasks`);
        } catch (error) {
            console.error('[ERROR] Failed to save completed task:', error.message);
        }
    }

    async launchBrowser() {
        console.log('[NOTE] Launching browser...');
        
        this.browser = await puppeteer.launch({
            headless: CONFIG.BROWSER.HEADLESS,
            executablePath: CONFIG.BROWSER.EXECUTABLE_PATH,
            defaultViewport: CONFIG.BROWSER.VIEWPORT,
            args: CONFIG.BROWSER.ARGS
        });

        this.page = await this.browser.newPage();
        this.page.setDefaultTimeout(CONFIG.TIMING.PAGE_LOAD);
        this.page.setDefaultNavigationTimeout(CONFIG.TIMING.PAGE_LOAD);
        
        console.log('[OK] Browser started');
    }

    async navigateTo(url) {
        try {
            await this.page.goto(url, {
                waitUntil: 'domcontentloaded',
                timeout: CONFIG.TIMING.PAGE_LOAD
            });
            console.log(`[OK] Navigated to ${url}`);
            return true;
        } catch (error) {
            console.error(`[ERROR] Navigation to ${url} failed:`, error.message);
            return false;
        }
    }

    async safeWaitForSelector(selector, timeout = 10000) {
        try {
            await this.page.waitForSelector(selector, { timeout });
            return true;
        } catch (error) {
            console.warn(`[WARN] Selector ${selector} not found within ${timeout}ms`);
            return false;
        }
    }

    async login() {
        try {
            if (!await this.navigateTo(CONFIG.ACMP.URL)) {
                throw new Error('Failed to navigate to ACMP');
            }

            await this.sleep(CONFIG.TIMING.SHORT_DELAY);

            if (!await this.safeWaitForSelector('input[name="lgn"]') || 
                !await this.safeWaitForSelector('input[name="password"]')) {
                throw new Error('Login form not found');
            }

            await this.page.type('input[name="lgn"]', CONFIG.ACMP.CREDENTIALS.login, { delay: 50 });
            await this.page.type('input[name="password"]', CONFIG.ACMP.CREDENTIALS.password, { delay: 50 });
            console.log('[OK] Credentials entered');

            await this.page.click('input[type="submit"]');
            console.log('[OK] Login submitted');

            await this.sleep(CONFIG.TIMING.MEDIUM_DELAY);

            // Проверяем успешность логина
            if (this.page.url().includes('main=user')) {
                console.log('[OK] Successfully logged in');
                return true;
            } else {
                throw new Error('Login may have failed - not redirected to user page');
            }

        } catch (error) {
            console.error('[ERROR] Login failed:', error.message);
            throw error;
        }
    }

    async getTaskDescription() {
        try {
            const taskContent = await this.page.evaluate(() => {
                const htmlContent = document.documentElement.outerHTML;
                const startMarker = '<!--–– google_ad_section_start ––-->';
                const endMarker = '<!--–– google_ad_section_end ––-->';
                
                const startIndex = htmlContent.indexOf(startMarker);
                const endIndex = htmlContent.indexOf(endMarker);
                
                if (startIndex !== -1 && endIndex !== -1) {
                    return htmlContent.substring(startIndex + startMarker.length, endIndex).trim();
                }
                return null;
            });
            
            if (taskContent) {
                console.log('[OK] Task content extracted');
                return taskContent;
            } else {
                console.log('[WARN] Task content not found');
                return null;
            }
        } catch (error) {
            console.log('[ERROR] Failed to extract task:', error.message);
            return null;
        }
    }

    async getTaskExamples() {
        try {
            if (await this.safeWaitForSelector('.table-example__data', 5000)) {
                const examples = await this.page.evaluate(() => {
                    const exampleElements = document.querySelectorAll('.table-example__data');
                    const examples = [];
                    
                    for (let i = 0; i < exampleElements.length; i += 2) {
                        if (i + 1 < exampleElements.length) {
                            const input = exampleElements[i].textContent.trim();
                            const output = exampleElements[i + 1].textContent.trim();
                            examples.push({ input, output });
                        }
                    }
                    return examples;
                });
                
                if (examples.length > 0) {
                    console.log(`[OK] Collected ${examples.length} examples`);
                    return examples;
                }
            }
            return null;
        } catch (error) {
            console.log('[WARN] Failed to get examples:', error.message);
            return null;
        }
    }

    async askAI(description, examples = null, previousCode = null, error = null) {
        const prompt = this.buildPrompt(description, examples, previousCode, error);
        
        try {
            console.log('[AI] Sending request to AI...');
            
            const response = await axios.post(
                CONFIG.OPENROUTER.API_URL,
                {
                    model: CONFIG.OPENROUTER.MODEL,
                    messages: [{ role: 'user', content: prompt }],
                    max_tokens: CONFIG.OPENROUTER.MAX_TOKENS
                },
                {
                    headers: {
                        'Authorization': `Bearer ${CONFIG.OPENROUTER.API_KEY}`,
                        'Content-Type': 'application/json',
                        'HTTP-Referer': 'https://acmp-solver.com',
                        'X-Title': 'ACMP Solver'
                    },
                    timeout: 30000
                }
            );

            const code = this.extractCode(response.data.choices[0].message.content);
            console.log('[OK] AI response received');
            return code;
            
        } catch (error) {
            await this.handleAPIError(error);
            return null;
        }
    }

    buildPrompt(description, examples, previousCode, error) {
        let prompt = `Напиши решение на Python для задачи: ${description}\n\n`;
        
        if (examples) {
            prompt += `Примеры ввода-вывода:\n${JSON.stringify(examples, null, 2)}\n\n`;
        }
        
        if (error && previousCode) {
            prompt += `Ошибка в предыдущем решении: ${error}\n`;
            prompt += `Предыдущий код:\n${previousCode}\n\n`;
            prompt += 'Исправь ошибку и предоставь исправленный код.';
        } else {
            prompt += 'Предоставь решение.';
        }
        
        prompt += '\n\nТребования:\n';
        prompt += '1. Только код без комментариев\n';
        prompt += '2. Используй стандартные библиотеки Python\n';
        prompt += '3. Читай данные через input()\n';
        prompt += '4. Выводи результат через print()\n';
        prompt += '5. Не используй markdown форматирование (никаких ```)\n';
        prompt += '6. Код должен быть полным и готовым к выполнению';
        
        return prompt;
    }

    extractCode(content) {
        // Удаляем markdown кодблоки если они есть
        return content.replace(/```python\n?/g, '').replace(/```\n?/g, '').trim();
    }

    async handleAPIError(error) {
        if (error.response?.status === 402) {
            console.log('[CRITICAL] OpenRouter credits exhausted');
            process.exit(1);
        } else if (error.code === 'ECONNABORTED') {
            console.error('[ERROR] API request timeout');
        } else if (error.response?.status === 429) {
            console.error('[ERROR] API rate limit exceeded');
            await this.sleep(10000); // Ждем 10 секунд при лимите
        } else {
            console.error('[ERROR] API request failed:', error.message);
        }
    }

    async submitSolution(code) {
        try {
            if (!await this.safeWaitForSelector('.CodeMirror')) {
                throw new Error('Code editor not found');
            }

            // Вставляем код в редактор
            await this.page.evaluate((code) => {
                const editor = document.querySelector('.CodeMirror').CodeMirror;
                if (editor) {
                    editor.setValue(code);
                }
            }, code);

            // Выбираем Python
            await this.page.select('select[name="lang"]', 'PY');
            console.log('[OK] Code inserted and language selected');

            await this.sleep(CONFIG.TIMING.SHORT_DELAY);

            const previousUrl = this.page.url();
            
            // Пытаемся отправить решение
            await this.page.click('input[value="Отправить"]');
            console.log('[OK] Submit button clicked');

            await this.sleep(CONFIG.TIMING.LONG_DELAY);

            // Проверяем успешность отправки
            if (this.page.url() !== previousUrl) {
                console.log('[OK] Solution submitted successfully');
                return true;
            } else {
                console.log('[WARN] No navigation detected, trying alternative submit');
                // Альтернативный способ отправки
                await this.page.evaluate(() => {
                    const form = document.querySelector('form');
                    if (form) form.submit();
                });
                
                await this.sleep(CONFIG.TIMING.LONG_DELAY);
                return this.page.url() !== previousUrl;
            }
            
        } catch (error) {
            console.error('[ERROR] Submission failed:', error.message);
            return false;
        }
    }

    async checkSolutionResult(taskId) {
        for (let attempt = 1; attempt <= CONFIG.RETRY.MAX_RESULT_CHECKS; attempt++) {
            await this.sleep(CONFIG.TIMING.RESULT_CHECK_DELAY);
            
            if (!await this.navigateTo(CONFIG.ACMP.STATUS_URL)) {
                console.log(`[WAIT] Failed to check status (attempt ${attempt})`);
                continue;
            }

            const result = await this.extractResultFromStatusPage(taskId);
            
            if (result.status === 'Accepted') {
                return { success: true, status: result.status, test: result.test, attempts: attempt };
            } else if (result.status && !['Waiting', 'Testing', 'In queue'].includes(result.status)) {
                return { 
                    success: false, 
                    status: result.status, 
                    test: result.test,
                    attempts: attempt 
                };
            } else if (result.status) {
                console.log(`[WAIT] Attempt ${attempt}/${CONFIG.RETRY.MAX_RESULT_CHECKS}: ${result.status}`);
            } else {
                console.log(`[WAIT] Attempt ${attempt}/${CONFIG.RETRY.MAX_RESULT_CHECKS}: Result not found`);
            }
        }
        
        return { success: false, status: 'Timeout', attempts: CONFIG.RETRY.MAX_RESULT_CHECKS };
    }

    async extractResultFromStatusPage(taskId) {
        return await this.page.evaluate((taskNum) => {
            const rows = document.querySelectorAll('.main.refresh tr');
            for (let i = 1; i < rows.length; i++) {
                const cells = rows[i].querySelectorAll('td');
                if (cells.length >= 7) {
                    const taskCell = cells[3].querySelector('a');
                    if (taskCell && taskCell.textContent.includes(taskNum.toString().padStart(4, '0'))) {
                        const resultCell = cells[5].querySelector('span');
                        const testCell = cells[6];
                        return {
                            status: resultCell?.textContent.trim() || 'Unknown',
                            test: testCell?.textContent.trim() || ''
                        };
                    }
                }
            }
            return { status: null, test: '' };
        }, taskId);
    }

    async processTask(taskId) {
        console.log(`\n[INFO] Processing task ${taskId}`);
        
        try {
            const taskUrl = `${CONFIG.ACMP.TASK_URL}${taskId}`;
            if (!await this.navigateTo(taskUrl)) {
                return { success: false, error: 'Navigation failed' };
            }

            await this.sleep(CONFIG.TIMING.SHORT_DELAY);

            const [description, examples] = await Promise.all([
                this.getTaskDescription(),
                this.getTaskExamples()
            ]);

            if (!description) {
                return { success: false, error: 'No description found' };
            }

            let code = await this.askAI(description, examples);
            if (!code) {
                return { success: false, error: 'No code generated' };
            }

            let lastError = null;
            
            for (let attempt = 1; attempt <= CONFIG.RETRY.MAX_ATTEMPTS; attempt++) {
                console.log(`[ATTEMPT] ${attempt}/${CONFIG.RETRY.MAX_ATTEMPTS} for task ${taskId}`);
                
                if (!await this.submitSolution(code)) {
                    return { success: false, error: 'Submission failed' };
                }

                const result = await this.checkSolutionResult(taskId);
                
                if (result.success) {
                    console.log(`\n🎉 [SUCCESS] Task ${taskId} solved! 🎉\n`);
                    await this.saveCompletedTask(taskId);
                    return { success: true, status: result.status, attempts: attempt };
                } else if (result.status === 'Timeout') {
                    return { success: false, error: 'Result check timeout' };
                } else {
                    console.log(`[RETRY] Attempt ${attempt} failed: ${result.status} (test ${result.test})`);
                    lastError = result.status;
                    
                    // Генерируем исправленный код
                    const newCode = await this.askAI(description, examples, code, result.status);
                    if (newCode) {
                        code = newCode;
                    } else {
                        return { success: false, error: 'Failed to generate improved code' };
                    }
                    
                    // Возвращаемся к задаче
                    if (!await this.navigateTo(taskUrl)) {
                        return { success: false, error: 'Failed to return to task' };
                    }
                    await this.sleep(CONFIG.TIMING.SHORT_DELAY);
                }
            }
            
            return { success: false, error: `All attempts failed. Last error: ${lastError}` };

        } catch (error) {
            console.error(`[ERROR] Task ${taskId} processing failed:`, error.message);
            return { success: false, error: error.message };
        }
    }

    async solveTasks(startTask, endTask) {
        if (startTask > endTask) {
            console.log('[INFO] Invalid task range');
            return;
        }

        await this.loadCompletedTasks();
        await this.launchBrowser();

        try {
            await this.login();
            
            const results = [];
            for (let taskId = startTask; taskId <= endTask; taskId++) {
                if (this.completedTasks.has(taskId)) {
                    console.log(`[SKIP] Task ${taskId} already completed`);
                    continue;
                }

                const result = await this.processTask(taskId);
                results.push({ taskId, ...result });
                
                // Задержка между задачами
                if (taskId < endTask) {
                    await this.sleep(CONFIG.TIMING.MEDIUM_DELAY);
                }
            }
            
            // Вывод итогов
            this.printSummary(results);
            
        } catch (error) {
            console.error('[CRITICAL] Solver failed:', error);
        } finally {
            if (this.browser) {
                await this.browser.close();
                console.log('[OK] Browser closed');
            }
        }
    }

    printSummary(results) {
        console.log('\n' + '='.repeat(50));
        console.log('SUMMARY');
        console.log('='.repeat(50));
        
        const successful = results.filter(r => r.success).length;
        const failed = results.filter(r => !r.success).length;
        const skipped = this.completedTasks.size - successful;
        
        console.log(`Total processed: ${results.length}`);
        console.log(`Successful: ${successful}`);
        console.log(`Failed: ${failed}`);
        console.log(`Skipped (previously completed): ${skipped}`);
        
        if (failed > 0) {
            console.log('\nFailed tasks:');
            results.filter(r => !r.success).forEach(r => {
                console.log(`  Task ${r.taskId}: ${r.error}`);
            });
        }
        
        console.log('='.repeat(50));
    }
}

// Запуск программы
async function main() {
    const solver = new ACMPSolver();
    
    try {
        await solver.solveTasks(1, 1000);
    } catch (error) {
        console.error('[FATAL] Application crashed:', error);
        process.exit(1);
    }
}

// Обработка graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n[INFO] Shutting down gracefully...');
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\n[INFO] Received SIGTERM, shutting down...');
    process.exit(0);
});

// Запуск приложения
if (require.main === module) {
    main().catch(console.error);
}

module.exports = ACMPSolver;