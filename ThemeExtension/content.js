// Listen for messages from the popup menu (监听来自弹出菜单的消息)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "setTheme") {
        injectTheme(request.theme);
    } else if (request.action === "setCustomColor") {
        applyCustomColor(request.color);
    }
});

// Function to apply custom font color to the whole page and volume button
// (将自定义字体颜色应用于整个页面和音量按钮的函数)
function applyCustomColor(color) {
    let style = document.getElementById('ext-custom-color');
    if (!style) {
        style = document.createElement('style');
        style.id = 'ext-custom-color';
        document.head.appendChild(style);
    }
    style.innerHTML = `
        body, html, main, div, section, article, p, span, li, td, th { color: ${color} !important; }
        h1, h2, h3, h4, h5, h6, a { color: ${color} !important; text-shadow: 0 0 8px ${color}40 !important; }
        #zzz-vol-btn { border-color: ${color} !important; color: ${color} !important; box-shadow: 0 0 10px ${color}30 !important; }
    `;
}

function injectTheme(theme) {
    // 1. Clean up ALL existing elements before applying a new theme
    // (1. 在应用新主题之前，清理所有现有的元素)
    let oldStyle = document.getElementById('ext-custom-styles');
    if (oldStyle) oldStyle.remove();
    
    let oldVideo = document.getElementById('ext-bg-video');
    if (oldVideo) oldVideo.remove();

    let oldCanvas = document.getElementById('matrix-canvas');
    if (oldCanvas) {
        cancelAnimationFrame(window.matrixAnimationId);
        oldCanvas.remove();
    }

    let oldVolBtn = document.getElementById('zzz-vol-btn');
    if (oldVolBtn) oldVolBtn.remove();
    
    let oldBrackets = document.getElementById('zzz-hud-brackets');
    if (oldBrackets) oldBrackets.remove();

    if (window.loopInterval) {
        clearInterval(window.loopInterval);
        window.loopInterval = null;
    }

    // 2. Apply new theme (2. 应用新主题)
    if (theme === 'default') return; // Do nothing for default (默认主题不执行任何操作)

    // Helper for YouTube (YouTube 助手函数 - 开启 jsapi)
    function injectYouTubeBackground(videoId, mute = 0, start = 0, end = 0) {
        let videoDiv = document.createElement('div');
        videoDiv.id = 'ext-bg-video';
        videoDiv.style.cssText = 'position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; z-index: -9999; pointer-events: none; overflow: hidden; background: #000;';
        
        let url = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=${mute}&controls=0&showinfo=0&rel=0&enablejsapi=1`;
        if (start > 0) url += `&start=${start}`;
        if (end > 0) url += `&end=${end}`;

        videoDiv.innerHTML = `
            <iframe id="yt-iframe" width="100%" height="100%" 
                src="${url}" 
                frameborder="0" 
                style="transform: scale(1.5); pointer-events: none; opacity: 0.85;" 
                allow="autoplay; encrypted-media" allowfullscreen>
            </iframe>`;
        document.body.appendChild(videoDiv);
    }

    // Custom Volume Button & Loop Controller (自定义音量按钮与循环控制器)
    // ADDED defaultColor parameter to match different themes (添加 defaultColor 参数以匹配不同主题)
    function createVolumeAndLoopControl(startSeconds, endSeconds, defaultColor = '#E6FF00') {
        let btn = document.createElement('div');
        btn.id = 'zzz-vol-btn';
        
        // Setup SVGs for Muted and Unmuted states
        btn.innerHTML = `
            <svg id="vol-muted" viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" style="display:none;"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>
            <svg id="vol-unmuted" viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" style="display:block;"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
        `;
        
        // Set initial state to Sound ON (将初始状态设置为开启声音)
        let isMuted = false;
        
        // Apply the specific theme color dynamically (动态应用特定的主题颜色)
        btn.style.cssText = `
            position: fixed; bottom: 40px; right: 40px; z-index: 99999;
            width: 40px; height: 40px; border-radius: 4px;
            background: rgba(10, 10, 15, 0.4); 
            border: 1px solid ${defaultColor}; 
            color: ${defaultColor}; 
            box-shadow: 0 0 10px ${defaultColor}30;
            display: flex; justify-content: center; align-items: center;
            cursor: pointer; backdrop-filter: blur(8px);
            transition: all 0.3s ease; clip-path: polygon(0 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%);
        `;
        
        btn.addEventListener('click', () => {
            const iframe = document.getElementById('yt-iframe');
            if(!iframe) return;
            
            isMuted = !isMuted;
            
            // YouTube API requires 'unMute' with a capital M!
            const command = isMuted ? 'mute' : 'unMute';
            iframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func: command, args: [] }), '*');
            
            // Toggle icons (切换图标)
            document.getElementById('vol-muted').style.display = isMuted ? 'block' : 'none';
            document.getElementById('vol-unmuted').style.display = isMuted ? 'none' : 'block';
            
            // Toggle opacity to show mute status, preserving custom colors
            // (切换透明度以显示静音状态，保留自定义颜色)
            btn.style.opacity = isMuted ? '0.4' : '1';
        });
        
        btn.addEventListener('mouseenter', () => btn.style.transform = 'scale(1.05)');
        btn.addEventListener('mouseleave', () => btn.style.transform = 'scale(1)');
        document.body.appendChild(btn);

        // Exact Segment Loop Hack (精确的片段循环控制)
        if (startSeconds > 0 && endSeconds > 0) {
            const durationMs = (endSeconds - startSeconds) * 1000;
            window.loopInterval = setInterval(() => {
                const iframe = document.getElementById('yt-iframe');
                if (iframe && iframe.contentWindow) {
                    iframe.contentWindow.postMessage(JSON.stringify({
                        event: 'command', func: 'seekTo', args: [startSeconds, true]
                    }), '*');
                }
            }, durationMs);
        }
    }

    if (theme === 'lofi') {
        // Sound is ON by default (mute = 0) (默认开启声音)
        injectYouTubeBackground('jfKfPfyJRdk', 0); 
        
        // Add volume button with Lofi Orange color, 0,0 means no loop segment
        // (添加带有低保真橙色的音量按钮，0,0 表示不循环特定片段)
        createVolumeAndLoopControl(0, 0, '#FB923C');
        
        let style = document.createElement('style');
        style.id = 'ext-custom-styles';
        style.innerHTML = `
            :not(img):not(video):not(canvas):not(svg):not(path) {
                background-color: transparent !important;
                border-color: rgba(255, 255, 255, 0.05) !important;
            }
            body, html { color: #f0f0f0 !important; }
            h1, h2, h3, a { color: #FB923C !important; text-shadow: 0 0 5px rgba(251, 146, 60, 0.2) !important; }
        `;
        document.head.appendChild(style);
    } 
    
    else if (theme === 'matrix') {
        const canvas = document.createElement('canvas');
        canvas.id = 'matrix-canvas';
        canvas.style.cssText = 'position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; z-index: -9999; pointer-events: none;';
        document.body.appendChild(canvas);
        
        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        
        const katakana = 'アァカサタナハマヤャラワガザダバパイィキシチニヒミリヰギジヂビピウゥクスツヌフムユュルグズブヅプエェケセテネヘメレゲゼデベペオォコソトノホモヨョロゴゾドボポヴッン';
        const latin = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const nums = '0123456789';
        const alphabet = katakana + latin + nums;
        
        const fontSize = 16;
        const columns = canvas.width / fontSize;
        const drops = Array.from({length: columns}).fill(1);
        
        function drawMatrix() {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#0F0';
            ctx.font = fontSize + 'px monospace';
            
            for(let i = 0; i < drops.length; i++) {
                const text = alphabet.charAt(Math.floor(Math.random() * alphabet.length));
                ctx.fillText(text, i * fontSize, drops[i] * fontSize);
                if(drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
                    drops[i] = 0;
                }
                drops[i]++;
            }
            window.matrixAnimationId = requestAnimationFrame(drawMatrix);
        }
        drawMatrix();
        
        let style = document.createElement('style');
        style.id = 'ext-custom-styles';
        style.innerHTML = `
            body, html, main, div, section, article { 
                background-color: rgba(0, 0, 0, 0.7) !important; 
                color: #00ff41 !important; 
                font-family: 'Courier New', Courier, monospace !important; 
                border-color: #008f11 !important;
            }
            h1, h2, h3, a { color: #ffffff !important; text-shadow: 0 0 5px #00ff41 !important; }
        `;
        document.head.appendChild(style);
    }
    
    else if (theme === 'zzz') {
        // Sound is ON by default (mute = 0)
        injectYouTubeBackground('_D7BcVRYONw', 0, 34, 168); 
        
        // Add Volume button with ZZZ Yellow color
        createVolumeAndLoopControl(34, 168, '#E6FF00');
        
        // Inject Thin Neon Brackets for Atmospheric UI
        let brackets = document.createElement('div');
        brackets.id = 'zzz-hud-brackets';
        brackets.innerHTML = `
            <div style="position: absolute; top: 0; left: 0; width: 30px; height: 30px; border-top: 1px solid rgba(230, 255, 0, 0.4); border-left: 1px solid rgba(230, 255, 0, 0.4); box-shadow: -2px -2px 6px rgba(230, 255, 0, 0.1);"></div>
            <div style="position: absolute; bottom: 0; right: 0; width: 30px; height: 30px; border-bottom: 1px solid rgba(255, 0, 85, 0.4); border-right: 1px solid rgba(255, 0, 85, 0.4); box-shadow: 2px 2px 6px rgba(255, 0, 85, 0.1);"></div>
        `;
        brackets.style.cssText = 'position: fixed; top: 20px; left: 20px; right: 20px; bottom: 20px; pointer-events: none; z-index: 9998;';
        document.body.appendChild(brackets);

        let style = document.createElement('style');
        style.id = 'ext-custom-styles';
        style.innerHTML = `
            body, html { background-color: transparent !important; }
            
            :not(img):not(video):not(canvas):not(svg):not(path) {
                background-color: transparent !important;
                border-color: rgba(255, 255, 255, 0.05) !important;
                box-shadow: none !important;
                backdrop-filter: none !important; 
            }

            body::after {
                content: ""; position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
                background-image: 
                    linear-gradient(rgba(230, 255, 0, 0.015) 1px, transparent 1px), 
                    linear-gradient(90deg, rgba(230, 255, 0, 0.015) 1px, transparent 1px);
                background-size: 50px 50px; 
                box-shadow: inset 0 15px 40px -20px rgba(230, 255, 0, 0.15); 
                pointer-events: none; z-index: 9997;
            }

            h1, h2, h3 { 
                color: #E6FF00 !important; 
                text-shadow: 0 0 5px rgba(230, 255, 0, 0.2) !important;
            }
            body, html, p, span, div {
                color: #E6FF00 !important;
            }
        `;
        document.head.appendChild(style);
    }
    
    // Global rule: Load custom color if saved for ANY theme
    // (全局规则：如果保存了自定义颜色，则为任何主题加载它)
    chrome.storage.local.get(['customFontColor'], (result) => {
        if (result.customFontColor) {
            applyCustomColor(result.customFontColor);
        }
    });
}