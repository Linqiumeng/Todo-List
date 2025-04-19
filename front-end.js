waitlist = [];

showlist();

function showlist(){
    let html = ``;
    for (let index = 0; index < waitlist.length; index++) {
        const block = waitlist[index];
        const todo = block.item;
        const duetime = block.dueday;
        const show = `
        <p class="css-item">${todo} ${duetime}
        <button class="css-delete"
        onclick="
        deleteitem(${index})
        "
        >Delete</button>
        </p>
        `
        html += show;
    }
    document.querySelector('.js-show').innerHTML = html;
}

function adding(){
    const event = document.querySelector('.js-input');
    const eventvalue = event.value;

    const due = document.querySelector('.js-date')
    const duevalue = due.value;

    waitlist.push({
        item: eventvalue,
        dueday: duevalue
    });
    console.log(waitlist);
    showlist();
}

function deleteitem(index){
    waitlist.splice(index,1);
    showlist();
}

// 配置信息
const CONFIG = {
    clientId: '',
    apiKey: '',
    scope: 'https://www.googleapis.com/auth/calendar',
    discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest']
};

// 添加配置验证
function validateConfig() {
    const origin = window.location.origin;
    console.log('Current origin:', origin);
    
    if (!CONFIG.clientId) {
        throw new Error('Client ID is missing in configuration');
    }
    if (!CONFIG.apiKey) {
        throw new Error('API Key is missing in configuration');
    }
}

// 修改 initializeGoogleAPI 函数
function initializeGoogleAPI() {
    return new Promise((resolve, reject) => {
        try {
            // 首先验证配置
            validateConfig();
            
            gapi.load('client:auth2', async () => {
                try {
                    await gapi.client.init({
                        apiKey: CONFIG.apiKey,
                        clientId: CONFIG.clientId,
                        scope: CONFIG.scope,
                        discoveryDocs: CONFIG.discoveryDocs,
                    });
                    
                    // 检查是否已登录
                    if (!gapi.auth2.getAuthInstance().isSignedIn.get()) {
                        await gapi.auth2.getAuthInstance().signIn();
                    }
                    resolve();
                } catch (error) {
                    console.error('Error during API initialization:', error);
                    reject(error);
                }
            });
        } catch (error) {
            console.error('Error in initialization setup:', error);
            reject(error);
        }
    });
}

// 添加测试函数来检查 Google API 状态
async function testGoogleAPI() {
    console.log('=== Starting Google API Test ===');
    try {
        console.log('1. Testing GAPI availability...');
        if (typeof gapi === 'undefined') {
            throw new Error('GAPI not loaded');
        }
        console.log('✓ GAPI is available');

        console.log('2. Testing configuration...');
        console.log('Client ID:', CONFIG.clientId ? 'Present' : 'Missing');
        console.log('API Key:', CONFIG.apiKey ? 'Present' : 'Missing');
        
        console.log('3. Attempting to initialize...');
        await initializeGoogleAPI();
        console.log('✓ Initialization successful');

        console.log('4. Checking auth status...');
        const authInstance = gapi.auth2.getAuthInstance();
        const isSignedIn = authInstance.isSignedIn.get();
        console.log('Is signed in:', isSignedIn);

        console.log('5. Testing calendar API access...');
        await gapi.client.calendar.calendarList.list();
        console.log('✓ Calendar API accessible');

        console.log('=== Test Complete: All Passed ===');
        return true;
    } catch (error) {
        console.error('=== Test Failed ===');
        console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            details: error.details || 'No additional details'
        });
        return false;
    }
}

// 修改 syncToGoogle 函数，添加更多错误检查
async function syncToGoogle() {
    try {
        console.log('Starting sync process...');
        const syncButton = document.querySelector('.css-sync');
        syncButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Syncing...';
        syncButton.disabled = true;

        // 运行测试
        console.log('Running API test...');
        const testResult = await testGoogleAPI();
        if (!testResult) {
            throw new Error('API test failed');
        }

        // 检查待办事项列表
        console.log('Checking todo list...', waitlist);
        if (!waitlist.length) {
            throw new Error('No todos to sync');
        }

        // 同步待办事项
        console.log('Starting todo sync...');
        for (const todo of waitlist) {
            console.log('Processing todo:', todo);
            
            // 验证待办事项数据
            if (!todo.item || !todo.dueday) {
                console.error('Invalid todo data:', todo);
                continue;
            }

            const event = {
                'summary': todo.item,
                'start': {
                    'date': todo.dueday,
                    'timeZone': Intl.DateTimeFormat().resolvedOptions().timeZone
                },
                'end': {
                    'date': todo.dueday,
                    'timeZone': Intl.DateTimeFormat().resolvedOptions().timeZone
                }
            };

            console.log('Creating calendar event:', event);
            const response = await gapi.client.calendar.events.insert({
                'calendarId': 'primary',
                'resource': event
            });
            console.log('Event created successfully:', response.result);
        }

        console.log('Sync completed successfully');
        syncButton.innerHTML = '<i class="fas fa-check"></i> Synced!';
        showNotification('Successfully synced with Google Calendar!', 'success');

        setTimeout(() => {
            syncButton.innerHTML = '<i class="fas fa-sync"></i> Sync to Calendar';
            syncButton.disabled = false;
        }, 3000);

    } catch (error) {
        console.error('Sync failed with error:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            details: error.details || 'No additional details'
        });
        
        showNotification(`Sync failed: ${error.message}`, 'error');
        
        const syncButton = document.querySelector('.css-sync');
        syncButton.innerHTML = '<i class="fas fa-sync"></i> Sync to Calendar';
        syncButton.disabled = false;
    }
}

// 添加一个测试按钮到HTML（可选）
function addTestButton() {
    const button = document.createElement('button');
    button.className = 'css-sync';
    button.innerHTML = '<i class="fas fa-bug"></i> Test API';
    button.onclick = testGoogleAPI;
    button.style.marginLeft = '8px';
    document.querySelector('.todo-container').appendChild(button);
}

// 页面加载时添加测试按钮
document.addEventListener('DOMContentLoaded', addTestButton);

// 添加通知功能（如果还没有的话）
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

