const API = 'http://127.0.0.1:5000';

let history             = [];
let audioBlob           = null;
let audioUrl            = null;
let audioEl             = null;
let isPlaying           = false;
let isRecording         = false;
let shouldKeepRecording = false;

// ── Speech Recognition Setup ──
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;

if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.continuous     = true;
    recognition.interimResults = false;

    recognition.onstart = () => {
        isRecording = true;
        document.getElementById('rec-btn').classList.add('recording');
        document.getElementById('rec-label').textContent  = 'Stop';
        document.getElementById('rec-status').textContent = '🔴 Recording... Speak now';
    };

    recognition.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
                transcript += event.results[i][0].transcript + ' ';
            }
        }
        if (transcript.trim()) {
            const current = document.getElementById('input-text').value;
            const updated = (current + ' ' + transcript).trim();
            document.getElementById('input-text').value       = updated;
            document.getElementById('char-count').textContent = updated.length + ' / 2000';
            document.getElementById('rec-status').textContent = '🔴 Recording... Keep speaking';
        }
    };

    recognition.onerror = (event) => {
        if (event.error === 'no-speech') {
            if (shouldKeepRecording) {
                try { recognition.start(); } catch(e) {}
            }
            return;
        }
        let msg = 'Voice error.';
        if (event.error === 'not-allowed') msg = '❌ Microphone access denied.';
        if (event.error === 'network')     msg = '❌ Network error. Check internet.';
        document.getElementById('rec-status').textContent = msg;
        shouldKeepRecording = false;
        stopRecognition();
    };

    recognition.onend = () => {
        if (shouldKeepRecording) {
            try { recognition.start(); } catch(e) {}
        } else {
            stopRecognition();
        }
    };
}

function stopRecognition() {
    isRecording         = false;
    shouldKeepRecording = false;
    document.getElementById('rec-btn').classList.remove('recording');
    document.getElementById('rec-label').textContent  = 'Record';
    const status = document.getElementById('rec-status').textContent;
    if (status.includes('Recording')) {
        document.getElementById('rec-status').textContent = '✅ Done! Click Translate.';
    }
}

// ── Record Button ──
document.getElementById('rec-btn').addEventListener('click', () => {
    if (!SpeechRecognition) {
        showToast('Voice input not supported. Please use Chrome browser.');
        return;
    }
    if (isRecording) {
        shouldKeepRecording = false;
        recognition.stop();
        document.getElementById('rec-status').textContent = '✅ Done! Click Translate.';
    } else {
        shouldKeepRecording = true;
        const srcLang = document.getElementById('src-lang').value;
        const langMap = {
            'English': 'en-US', 'Urdu': 'ur-PK', 'Arabic': 'ar-SA',
            'Hindi': 'hi-IN', 'French': 'fr-FR', 'German': 'de-DE',
            'Spanish': 'es-ES', 'Italian': 'it-IT', 'Portuguese': 'pt-PT',
            'Russian': 'ru-RU', 'Chinese (Simplified)': 'zh-CN',
            'Japanese': 'ja-JP', 'Korean': 'ko-KR', 'Turkish': 'tr-TR',
            'Dutch': 'nl-NL', 'Bengali': 'bn-BD', 'Punjabi': 'pa-IN',
            'Indonesian': 'id-ID', 'Farsi': 'fa-IR', 'Swahili': 'sw-KE',
        };
        recognition.lang = langMap[srcLang] || 'en-US';
        try {
            recognition.start();
        } catch(e) {
            document.getElementById('rec-status').textContent = 'Click again to retry.';
        }
    }
});

// ── Load Languages ──
async function loadLanguages() {
    try {
        const r    = await fetch(`${API}/languages`);
        const data = await r.json();
        const srcSel = document.getElementById('src-lang');
        const tgtSel = document.getElementById('tgt-lang');
        data.languages.forEach(lang => {
            srcSel.innerHTML += `<option value="${lang}">${lang}</option>`;
            tgtSel.innerHTML += `<option value="${lang}">${lang}</option>`;
        });
        srcSel.value = 'English';
        tgtSel.value = 'Urdu';
    } catch (e) {
        showToast('Backend connect nahi hua. py -3.10 app.py chalao!');
    }
}

// ── Sidebar Toggle ──
let sideOpen = false;
document.getElementById('menu-btn').addEventListener('click', () => {
    sideOpen = !sideOpen;
    const sb = document.getElementById('sidebar');
    if (sideOpen) sb.classList.remove('closed');
    else          sb.classList.add('closed');
});

// ── Swap Languages ──
document.getElementById('swap-btn').addEventListener('click', () => {
    const src = document.getElementById('src-lang');
    const tgt = document.getElementById('tgt-lang');
    const tmp = src.value;
    src.value = tgt.value;
    tgt.value = tmp;
});

// ── Char Count ──
document.getElementById('input-text').addEventListener('input', function () {
    document.getElementById('char-count').textContent = this.value.length + ' / 2000';
});

// ── TRANSLATE & SPEAK ──
document.getElementById('translate-btn').addEventListener('click', async () => {
    const text = document.getElementById('input-text').value.trim();
    if (!text) { showToast('Please enter text first!'); return; }

    const srcLang = document.getElementById('src-lang').value;
    const tgtLang = document.getElementById('tgt-lang').value;
    const btn     = document.getElementById('translate-btn');

    btn.disabled    = true;
    btn.textContent = '⏳ Translating...';
    document.getElementById('output-text').value = '';
    resetAudio();

    try {
        const r = await fetch(`${API}/speak`, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ text, source_lang: srcLang, target_lang: tgtLang })
        });

        const rawHeader  = r.headers.get('X-Translated-Text');
        const translated = rawHeader
            ? decodeURIComponent(escape(rawHeader)).replace(/\|/g, '\n')
            : '';

        if (translated) {
            document.getElementById('output-text').value = translated;
        }

        const blob = await r.blob();
        audioBlob  = blob;
        audioUrl   = URL.createObjectURL(blob);
        audioEl    = new Audio(audioUrl);
        audioEl.onended = () => stopPlayback();

        document.getElementById('play-btn').disabled       = false;
        document.getElementById('play-status').textContent = 'Ready to play';

        if (translated) addHistory(text, translated, srcLang, tgtLang);

    } catch (e) {
        showToast('Error! Make sure py -3.10 app.py is running.');
        document.getElementById('output-text').value = 'Error: Could not connect to server.';
    } finally {
        btn.disabled    = false;
        btn.textContent = '⚡ TRANSLATE & SPEAK';
    }
});

// ── Play / Stop ──
document.getElementById('play-btn').addEventListener('click', () => {
    if (!audioEl) return;
    if (isPlaying) {
        audioEl.pause();
        audioEl.currentTime = 0;
        stopPlayback();
    } else {
        audioEl.play();
        setPlayState(true);
        document.getElementById('play-status').textContent = 'Playing...';
    }
});

function setPlayState(playing) {
    isPlaying = playing;
    const btn   = document.getElementById('play-btn');
    const icon  = document.getElementById('play-icon');
    const label = document.getElementById('play-label');
    if (playing) {
        btn.classList.add('playing');
        icon.textContent  = '⏹';
        label.textContent = 'Stop';
    } else {
        btn.classList.remove('playing');
        icon.textContent  = '▶';
        label.textContent = 'Play';
        document.getElementById('play-status').textContent = 'Ready to play';
    }
}

function stopPlayback() { setPlayState(false); }

function resetAudio() {
    if (audioEl)  { audioEl.pause(); audioEl = null; }
    if (audioUrl) { URL.revokeObjectURL(audioUrl); audioUrl = null; }
    audioBlob = null;
    isPlaying = false;
    const btn = document.getElementById('play-btn');
    btn.disabled = true;
    btn.classList.remove('playing');
    document.getElementById('play-icon').textContent   = '▶';
    document.getElementById('play-label').textContent  = 'Play';
    document.getElementById('play-status').textContent = 'Translate first';
}

// ── RESET ──
document.getElementById('reset-btn').addEventListener('click', () => {
    document.getElementById('input-text').value            = '';
    document.getElementById('output-text').value           = '';
    document.getElementById('char-count').textContent      = '0 / 2000';
    document.getElementById('rec-status').textContent      = 'Click to speak';
    resetAudio();
    if (isRecording && recognition) {
        shouldKeepRecording = false;
        recognition.stop();
    }
});

// ── History ──
function addHistory(src, tgt, srcLang, tgtLang) {
    history.unshift({ src, tgt, srcLang, tgtLang });
    renderHistory();
}

function renderHistory() {
    const list  = document.getElementById('history-list');
    const empty = document.getElementById('hist-empty');
    list.querySelectorAll('.hist-item').forEach(i => i.remove());
    if (!history.length) { empty.style.display = 'block'; return; }
    empty.style.display = 'none';
    history.forEach((item, idx) => {
        const div     = document.createElement('div');
        div.className = 'hist-item';
        div.innerHTML = `
            <div class="hist-num">#${idx+1} <span class="hist-langs">${item.srcLang} → ${item.tgtLang}</span></div>
            <div class="hist-src">${escHtml(item.src)}</div>
            <div class="hist-tgt">${escHtml(item.tgt)}</div>
            <div class="hist-btns">
                <button class="hist-copy-btn">📋 Copy</button>
                <button class="hist-del-btn">🗑 Delete</button>
            </div>`;
        div.querySelector('.hist-copy-btn').addEventListener('click', e => {
            e.stopPropagation();
            navigator.clipboard.writeText(item.tgt);
            showToast('Copied!');
        });
        div.querySelector('.hist-del-btn').addEventListener('click', e => {
            e.stopPropagation();
            history.splice(idx, 1);
            renderHistory();
        });
        div.addEventListener('click', () => {
            document.getElementById('input-text').value       = item.src;
            document.getElementById('output-text').value      = item.tgt;
            document.getElementById('char-count').textContent = item.src.length + ' / 2000';
        });
        list.appendChild(div);
    });
}

// ── Clear History ──
document.getElementById('clear-history-btn').addEventListener('click', () => {
    history = [];
    renderHistory();
});

// ── Helpers ──
function escHtml(s) {
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function showToast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2500);
}

// ── Init ──
loadLanguages();