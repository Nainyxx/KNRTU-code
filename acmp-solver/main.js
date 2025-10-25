const axios = require('axios');
const puppeteer = require('puppeteer');
const fs = require('fs').promises;

// Конфигурация (вынесены чувствительные данные)
const CONFIG = {
    ACMP: {
        URL: 'https://acmp.ru/',
        TASK_URL: 'https://acmp.ru/index.asp?main=task&id_task=',
        STATUS_URL: 'https://acmp.ru/index.asp?main=status',
        LOGIN: process.env.ACMP_LOGIN || 'watsonnlie',
        PASSWORD: process.env.ACMP_PASSWORD || 'Qwerazsx7'
    },
    OPENROUTER: {
        API_URL: 'https://openrouter.ai/api/v1/chat/completions',
        API_KEY: process.env.OPENROUTER_API_KEY || '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',
        MODEL: 'deepseek/deepseek-chat',
        MAX_TOKENS: 4000
    },
    TIMING: {
        SHORT_DELAY: 2000,
        MEDIUM_DELAY: 5000,
        LONG_DELAY: 8000
    }
};

const _ = '```'

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}


async function loadTasks() {
    try {
        const data = await fs.readFile('maked_tasks.txt', 'utf8');
        const maked_tasks = data.trim().split(' ').map(Number).filter(n => !isNaN(n));
        console.log('[OK]     Tasks loaded:', maked_tasks.length);
        return maked_tasks;
    } catch (err) {
        console.warn('[WARN]   Reading file failed, starting fresh:', err.message);
        return [];
    }
}


async function saveCompletedTask(taskId, maked_tasks) {
    try {
        const updatedTasks = [...new Set([...maked_tasks, taskId])].sort((a, b) => a - b);
        await fs.writeFile('maked_tasks.txt', updatedTasks.join(' '));
        console.log(`[OK]     Task ${taskId} saved to completed tasks`);
        return updatedTasks;
    } catch (err) {
        console.error('[ERROR]  Saving task failed:', err.message);
        return maked_tasks;
    }
}


async function askDeepSeek(question) {
    try {
        const requestData = {
            model: CONFIG.OPENROUTER.MODEL,
            messages: [{ role: 'user', content: question }],
            max_tokens: CONFIG.OPENROUTER.MAX_TOKENS
        };

        const response = await axios.post(
            CONFIG.OPENROUTER.API_URL,
            requestData,
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

        let content = response.data.choices[0].message.content;
        
        content = content.replace(/```python\n?/g, '').replace(/```\n?/g, '').trim();
        return content;
        
    } catch (error) {
        if (error.response?.status === 402) {
            console.log('[CRITICAL] OpenRouter credits exhausted. Stopping.');
            process.exit(1);
        } else if (error.response?.status === 429) {
            console.log('[WARN]    Rate limit exceeded, waiting...');
            await sleep(10000);
            return null;
        } else if (error.code === 'ECONNABORTED') {
            console.error('[ERROR]  API timeout');
            return null;
        }
        console.error('DeepSeek API Error:', error.response?.data || error.message);
        return null;
    }
}

async function main(question) {
    const answer = await askDeepSeek(question);
    return answer;
}


async function launchChrome(url) {
  console.log('[NOTE]   Launching browser...');
  
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

  console.log('[OK]     Browser started');
  
  const page = await browser.newPage();
  page.setDefaultTimeout(30000);
  page.setDefaultNavigationTimeout(30000);
  
  await page.goto(url, {
    waitUntil: 'domcontentloaded',
    timeout: 30000
  });
  
  console.log('[OK]     Page loaded');
  await sleep(3000);
  return { browser, page };
}


async function AccountEntering(page, login, password) {
    try {
        await page.waitForSelector('input[name="lgn"]', { timeout: 10000 });
        await page.waitForSelector('input[name="password"]', { timeout: 10000 });
        console.log('[OK]     Login form loaded');

        await page.type('input[name="lgn"]', login, { delay: 50 });
        await page.type('input[name="password"]', password, { delay: 50 });
        console.log('[OK]     Credentials entered');

        await page.click('input[type="submit"]');
        console.log('[OK]     Login submitted');
        
        await sleep(3000);
        
        
        if (page.url().includes('main=user')) {
            console.log('[OK]     Successfully logged in');
        } else {
            console.log('[WARN]   Login may have failed - check manually');
        }
    } catch (error) {
        console.log('[ERROR]  Login failed:', error.message);
        throw error;
    }
}


async function getTaskDescription(page) {
    try {
        const taskContent = await page.evaluate(() => {
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
            console.log('[OK]     Task content extracted');
            return taskContent;
        } else {
            console.log('[ERROR]  Task content not found');
            return null;
        }
    } catch (error) {
        console.log('[ERROR]  Failed to extract task:', error.message);
        return null;
    }
}

async function getTaskExamples(page) {
    try {
        await page.waitForSelector('.table-example__data', { timeout: 10000 });
        
        const examples = await page.evaluate(() => {
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
            console.log('[OK]     Examples collected');
            return examples;
        }
        return null;
    } catch (error) {
        console.log('[ERROR]  Failed to get examples:', error.message);
        return null;
    }
}

// Solution Add
async function submitSolutionPython(page, code) {
    try {
        await page.waitForSelector('.CodeMirror', { timeout: 10000 });
        
        await page.evaluate((code) => {
            const editor = document.querySelector('.CodeMirror').CodeMirror;
            if (editor) {
                editor.setValue(code);
            }
        }, code);
        
        await page.select('select[name="lang"]', 'PY');
        
        console.log('[OK]     Code inserted');
        await sleep(1000);
        
        const previousUrl = page.url();
        
        await page.click('input[value="Отправить"]');
        console.log('[OK]     Submit button clicked');
        
        await sleep(CONFIG.TIMING.LONG_DELAY);
        
        if (page.url() !== previousUrl) {
            console.log('[OK]     Navigation detected - solution submitted');
            return true;
        } else {
            console.log('[WARNING] No navigation, trying form submit');
            await page.evaluate(() => {
                const form = document.querySelector('form');
                if (form) {
                    form.submit();
                }
            });
            await sleep(CONFIG.TIMING.LONG_DELAY);
            
            return page.url() !== previousUrl;
        }
        
    } catch (error) {
        console.log('[ERROR]  Submission failed:', error.message);
        return false;
    }
}

// Solution Checkin
async function getSolutionResult(page, taskNumber) {
    try {
        await page.goto(CONFIG.ACMP.STATUS_URL, {
            waitUntil: 'domcontentloaded',
            timeout: 30000
        });
        await sleep(3000);
        
        const result = await page.evaluate((taskNum) => {
            const rows = document.querySelectorAll('.main.refresh tr');
            for (let i = 1; i < rows.length; i++) {
                const cells = rows[i].querySelectorAll('td');
                if (cells.length >= 7) {
                    const taskCell = cells[3].querySelector('a');
                    if (taskCell && taskCell.textContent.includes(taskNum.toString().padStart(4, '0'))) {
                        const resultCell = cells[5].querySelector('span');
                        const testCell = cells[6];
                        return {
                            status: resultCell ? resultCell.textContent.trim() : 'Unknown',
                            test: testCell.textContent.trim(),
                            fullText: resultCell ? resultCell.textContent.trim() + (testCell.textContent.trim() ? ` (test ${testCell.textContent.trim()})` : '') : 'Unknown'
                        };
                    }
                }
            }
            return null;
        }, taskNumber);
        
        if (result) {
            console.log(`[RESULT] Task ${taskNumber}: ${result.fullText}`);
            return result.status;
        }
        
        return 'Result not found';
        
    } catch (error) {
        console.log('[ERROR]  Check failed:', error.message);
        return 'Check error';
    }
}

async function ACMPsolver(start_task_number, last_task_number) {
    // loading tasks
    let maked_tasks = await loadTasks();
    console.log('[INFO]   Completed tasks:', maked_tasks);

    if (start_task_number > last_task_number) {
        console.log('[INFO]   Invalid task range');
        return null;
    }

    const { browser, page } = await launchChrome(CONFIG.ACMP.URL);
    try {
        await AccountEntering(page, CONFIG.ACMP.LOGIN, CONFIG.ACMP.PASSWORD);
        
        let successfulTasks = 0;
        let failedTasks = 0;
        
        for (let i = start_task_number; i <= last_task_number; i++) {
            if (maked_tasks.includes(i)) {
                console.log(`[SKIP]   Task ${i} already completed`);
                continue;
            }
            
            try {
                console.log(`\n[PROCESS] Starting task ${i}`);
                await page.goto(`${CONFIG.ACMP.TASK_URL}${i}`, {
                    waitUntil: 'domcontentloaded',
                    timeout: 30000
                });
                await sleep(CONFIG.TIMING.SHORT_DELAY);

                let description = await getTaskDescription(page);
                let task_example = await getTaskExamples(page);
                
                if (!description) {
                    console.log(`[SKIP]   No description for task ${i}`);
                    failedTasks++;
                    continue;
                }
                
                console.log(`[OK]     Task ${i} description collected`);
                
                let code = await main(`Напиши решение на Python для задачи: ${description}. ${task_example ? `Примеры: ${JSON.stringify(task_example)}` : ''}. Требования: 1) только код без комментариев 2) используй стандартные библиотеки Python 3) учти все ограничения из условия 4) ВАЖНО: не используй ${_} 5) тебе надо принять значение или значения с помощью input() и работать с этими значениями. 6) тебе надо вывести результат алгоритмов с помощью print(). даже если ты написал функцию 7) код должен быть валидным Python кодом`);
                
                if (!code) {
                    console.log(`[SKIP]   No code generated for task ${i}`);
                    failedTasks++;
                    continue;
                }
                
                const submitted = await submitSolutionPython(page, code);
                if (!submitted) {
                    console.log('[SKIP]   Submission failed, skipping task');
                    failedTasks++;
                    continue;
                }
                
                await sleep(7000);

                let maxWaitAttempts = 5;
                let waitCount = 0;
                let taskSuccess = false;
                
                for (let k = 0; k < 3; k++) {
                    let res = await getSolutionResult(page, i);
                    
                    if (res === 'Accepted') {
                        console.log("\n🎉 [SUCCESS] Task solved! 🎉\n");
                        maked_tasks = await saveCompletedTask(i, maked_tasks);
                        successfulTasks++;
                        taskSuccess = true;
                        break;
                    } else if (res === 'Result not found') {
                        waitCount++;
                        if (waitCount >= maxWaitAttempts) {
                            console.log(`[SKIP]   Result not found after ${maxWaitAttempts} attempts`);
                            break;
                        }
                        console.log(`[WAIT]   Checking result... (${waitCount}/${maxWaitAttempts})`);
                        await sleep(5000);
                        k--;
                        continue;
                    } else if (res === 'Check error') {
                        console.log(`[ERROR]  Check failed, skipping task`);
                        break;
                    } else {
                        console.log(`[RETRY]  Attempt ${k + 1}, Error: ${res}`);
                        waitCount = 0;
                        
                        
                        await page.goto(`${CONFIG.ACMP.TASK_URL}${i}`, {
                            waitUntil: 'domcontentloaded',
                            timeout: 30000
                        });
                        await sleep(CONFIG.TIMING.SHORT_DELAY);
                        
                        let new_code = await main(`Улучши решение на Python для задачи: ${description}. ${task_example ? `Примеры: ${JSON.stringify(task_example)}` : ''}. Ошибка: ${res}. Предыдущий код: ${code}. Исправь ошибку и предоставь только исправленный ВАЛИДНЫЙ Python код без комментариев. Убедись что синтаксис корректен. Не используй ${_}. (тебе надо вывести результат с помощью print(). даже если ты написал функцию).`);
                        
                        if (new_code) {
                            code = new_code;
                            const resubmitted = await submitSolutionPython(page, code);
                            if (!resubmitted) {
                                console.log('[SKIP]   Resubmission failed, stopping retries');
                                break;
                            }
                            await sleep(8000);
                        } else {
                            console.log('[SKIP]   No improved code generated, stopping retries');
                            break;
                        }
                    }
                }
                
                if (!taskSuccess) {
                    failedTasks++;
                }
                
            } catch (error) {
                console.log(`[ERROR]  Task ${i} failed:`, error.message);
                failedTasks++;
                continue;
            }
        }


        console.log('\n' + '='.repeat(50));
        console.log('FINAL STATISTICS:');
        console.log(`Successful: ${successfulTasks}`);
        console.log(`Failed: ${failedTasks}`);
        console.log(`Previously completed: ${maked_tasks.length - successfulTasks}`);
        console.log('='.repeat(50));

    } catch(error) {
        console.log('[ERROR] ', error);
    } finally {
        await browser.close();
        console.log('[OK]     Browser closed');
    }
}


async function start() {
    try {
        await ACMPsolver(1, 1000);
    } catch (error) {
        console.error('[FATAL] Application crashed:', error);
        process.exit(1);
    }
}


process.on('SIGINT', async () => {
    console.log('\n[INFO] Shutting down gracefully...');
    process.exit(0);
});

start().catch(console.error);