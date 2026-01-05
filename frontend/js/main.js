// API基础URL
const API_BASE_URL = 'http://localhost:3000/api';

// 当前用户ID（模拟）
const CURRENT_USER_ID = 'user1';

// DOM加载完成后执行
document.addEventListener('DOMContentLoaded', () => {
    // 初始化页面
    initPage();
    
    // 加载新闻列表
    loadNews();
    
    // 加载主题列表
    loadTopics();
    
    // 加载用户订阅
    loadSubscriptions();
    
    // 设置事件监听器
    setupEventListeners();
});

// 初始化页面
function initPage() {
    // 设置默认活跃的导航项
    const navLinks = document.querySelectorAll('nav a');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href').substring(1);
            switchSection(targetId);
            
            // 更新活跃状态
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
        });
    });
}

// 切换页面 section
function switchSection(sectionId) {
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(sectionId).classList.add('active');
    
    // 如果切换到订阅页面，重新加载订阅
    if (sectionId === 'subscriptions') {
        loadSubscriptions();
    }
}

// 设置事件监听器
function setupEventListeners() {
    // 新闻表单提交
    const newsForm = document.getElementById('news-form');
    newsForm.addEventListener('submit', (e) => {
        e.preventDefault();
        addNews();
    });
    
    // 搜索功能
    const searchInput = document.getElementById('search-input');
    searchInput.addEventListener('input', debounce(searchNews, 300));
    
    // 主题过滤
    const topicFilter = document.getElementById('topic-filter');
    topicFilter.addEventListener('change', filterNewsByTopic);
    
    // 订阅按钮
    const subscribeBtn = document.getElementById('subscribe-btn');
    subscribeBtn.addEventListener('click', subscribeToTopic);
}

// 加载新闻列表
async function loadNews() {
    try {
        const response = await fetch(`${API_BASE_URL}/news`);
        const news = await response.json();
        displayNews(news);
    } catch (error) {
        console.error('加载新闻失败:', error);
    }
}

// 显示新闻列表
function displayNews(news) {
    const newsContainer = document.getElementById('news-container');
    newsContainer.innerHTML = '';
    
    if (news.length === 0) {
        newsContainer.innerHTML = '<p>暂无新闻</p>';
        return;
    }
    
    news.forEach(item => {
        const newsItem = document.createElement('div');
        newsItem.className = 'news-item';
        
        // 处理主题
        const topics = item.topics ? item.topics.split(',') : [];
        
        newsItem.innerHTML = `
            <h3><a href="${item.link}" target="_blank">${item.title}</a></h3>
            <div class="news-meta">
                <span>${new Date(item.created_at).toLocaleString()}</span>
                <span class="hotness">热度: ${item.hotness}</span>
            </div>
            ${item.summary ? `<div class="news-summary">${item.summary}</div>` : ''}
            <div class="news-topics">
                ${topics.map(topic => `<span class="topic-tag">${topic}</span>`).join('')}
            </div>
        `;
        
        newsContainer.appendChild(newsItem);
    });
}

// 加载主题列表
async function loadTopics() {
    try {
        const response = await fetch(`${API_BASE_URL}/topics`);
        const topics = await response.json();
        
        // 更新主题过滤器
        const topicFilter = document.getElementById('topic-filter');
        topicFilter.innerHTML = '<option value="">所有主题</option>';
        
        // 更新可用订阅主题
        const availableTopics = document.getElementById('available-topics');
        availableTopics.innerHTML = '<option value="">选择主题</option>';
        
        topics.forEach(topic => {
            // 添加到主题过滤器
            const filterOption = document.createElement('option');
            filterOption.value = topic.name;
            filterOption.textContent = topic.name;
            topicFilter.appendChild(filterOption);
            
            // 添加到可用订阅主题
            const subscribeOption = document.createElement('option');
            subscribeOption.value = topic.id;
            subscribeOption.textContent = topic.name;
            availableTopics.appendChild(subscribeOption);
        });
    } catch (error) {
        console.error('加载主题失败:', error);
    }
}

// 加载用户订阅
async function loadSubscriptions() {
    try {
        const response = await fetch(`${API_BASE_URL}/subscriptions/${CURRENT_USER_ID}`);
        const subscriptions = await response.json();
        displaySubscriptions(subscriptions);
    } catch (error) {
        console.error('加载订阅失败:', error);
    }
}

// 显示用户订阅
function displaySubscriptions(subscriptions) {
    const subscriptionsList = document.getElementById('user-subscriptions');
    subscriptionsList.innerHTML = '';
    
    if (subscriptions.length === 0) {
        subscriptionsList.innerHTML = '<p>暂无订阅</p>';
        return;
    }
    
    subscriptions.forEach(subscription => {
        const subscriptionItem = document.createElement('div');
        subscriptionItem.className = 'subscription-item';
        
        subscriptionItem.innerHTML = `
            <span class="topic-name">${subscription.topic_name}</span>
            <button class="unsubscribe-btn" onclick="unsubscribe(${subscription.id})">取消订阅</button>
        `;
        
        subscriptionsList.appendChild(subscriptionItem);
    });
}

// 添加新闻
async function addNews() {
    const formData = new FormData(document.getElementById('news-form'));
    const newsData = {
        title: formData.get('title'),
        link: formData.get('link'),
        hotness: parseInt(formData.get('hotness') || 0),
        summary: formData.get('summary'),
        topics: formData.get('topics').split(',').map(t => t.trim()).filter(t => t)
    };
    
    try {
        const response = await fetch(`${API_BASE_URL}/news`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newsData)
        });
        
        if (response.ok) {
            // 清空表单
            document.getElementById('news-form').reset();
            
            // 重新加载新闻和主题
            loadNews();
            loadTopics();
            
            alert('新闻添加成功！');
        } else {
            const error = await response.json();
            alert('添加失败: ' + error.error);
        }
    } catch (error) {
        console.error('添加新闻失败:', error);
        alert('添加失败: ' + error.message);
    }
}

// 订阅主题
async function subscribeToTopic() {
    const topicId = document.getElementById('available-topics').value;
    
    if (!topicId) {
        alert('请选择一个主题');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/subscriptions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userId: CURRENT_USER_ID,
                topicId: topicId
            })
        });
        
        if (response.ok) {
            // 重新加载订阅
            loadSubscriptions();
            alert('订阅成功！');
        } else {
            const error = await response.json();
            alert('订阅失败: ' + error.error);
        }
    } catch (error) {
        console.error('订阅失败:', error);
        alert('订阅失败: ' + error.message);
    }
}

// 取消订阅
async function unsubscribe(subscriptionId) {
    if (!confirm('确定要取消订阅吗？')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/subscriptions/${subscriptionId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            // 重新加载订阅
            loadSubscriptions();
            alert('取消订阅成功！');
        } else {
            const error = await response.json();
            alert('取消订阅失败: ' + error.error);
        }
    } catch (error) {
        console.error('取消订阅失败:', error);
        alert('取消订阅失败: ' + error.message);
    }
}

// 搜索新闻
async function searchNews() {
    const searchTerm = document.getElementById('search-input').value;
    let news = [];
    
    if (searchTerm.trim() === '') {
        // 搜索词为空，加载所有新闻
        const response = await fetch(`${API_BASE_URL}/news`);
        news = await response.json();
    } else {
        // 搜索新闻（前端过滤）
        const response = await fetch(`${API_BASE_URL}/news`);
        const allNews = await response.json();
        news = allNews.filter(item => 
            item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (item.summary && item.summary.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }
    
    displayNews(news);
}

// 按主题过滤新闻
async function filterNewsByTopic() {
    const topicName = document.getElementById('topic-filter').value;
    
    if (topicName === '') {
        // 显示所有新闻
        loadNews();
    } else {
        // 按主题过滤
        try {
            const response = await fetch(`${API_BASE_URL}/news/topic/${topicName}`);
            const news = await response.json();
            displayNews(news);
        } catch (error) {
            console.error('过滤新闻失败:', error);
        }
    }
}

// 防抖函数
function debounce(func, delay) {
    let timeoutId;
    return function(...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}