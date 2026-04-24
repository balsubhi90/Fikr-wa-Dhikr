let p1, p2, s1=0, s2=0, dr=0, cur=1, lastLoser=1, board=[], active=true, idx=null, currentCat = 'أسئلة دينية';
let questionsBank = null;
let availableQs = {}; // مصفوفة لتتبع الأسئلة المتبقية لكل فئة

async function loadQuestions() {
    try {
        const response = await fetch('questions.json');
        questionsBank = await response.json();
        // تهيئة قائمة الأسئلة المتاحة لكل فئة
        resetAvailableQs();
    } catch (error) {
        console.error("خطأ في جلب الأسئلة:", error);
        questionsBank = { "أسئلة دينية": [{q:"من هو خاتم الأنبياء؟", a:["موسى","عيسى","محمد ﷺ"], c:2}] };
        resetAvailableQs();
    }
}

function resetAvailableQs() {
    for (let cat in questionsBank) {
        availableQs[cat] = [...questionsBank[cat]];
    }
}

loadQuestions();

function selectCategory(c) {
    currentCat = c;
    document.querySelectorAll('.category-btn').forEach(b => {
        b.classList.toggle('active', b.innerText === c);
    });
}

function startGame() {
    p1 = document.getElementById('p1-input').value || "لاعب 1";
    p2 = document.getElementById('p2-input').value || "لاعب 2";
    document.getElementById('p1-display').innerText = p1;
    document.getElementById('p2-display').innerText = p2;
    document.getElementById('body-tag').classList.add('in-game-mode');
    document.getElementById('setup-screen').classList.add('hidden');
    document.getElementById('game-screen').classList.remove('hidden');
    document.getElementById('footer-btn').style.display = "block";
    cur = 1; initBoard();
}

function initBoard() {
    const grid = document.getElementById('board'); grid.innerHTML = ""; board = Array(25).fill(0); active = true;
    for(let i=0; i<25; i++) {
        let d = document.createElement('div'); d.className = 'cell';
        d.onclick = () => { if(active && board[i]===0) { idx=i; showQ(); } };
        grid.appendChild(d);
    }
    document.getElementById('win-svg').classList.add('hidden');
    document.getElementById('post-round-controls').classList.add('hidden');
    updateTurn();
}

function showQ() {
    if (!questionsBank) return;

    // إذا نفدت الأسئلة في الفئة الحالية، أعد تعبئتها
    if (availableQs[currentCat].length === 0) {
        availableQs[currentCat] = [...questionsBank[currentCat]];
    }

    // اختيار سؤال عشوائي من المتاح وحذفه من القائمة لضمان عدم التكرار
    const randomIndex = Math.floor(Math.random() * availableQs[currentCat].length);
    const q = availableQs[currentCat].splice(randomIndex, 1)[0];

    document.getElementById('question-text').innerText = q.q;
    const cont = document.getElementById('options-container'); cont.innerHTML = "";
    q.a.forEach((opt, i) => {
        let b = document.createElement('button'); b.className = "main-btn"; b.innerText = opt;
        b.onclick = () => handleAnswer(i, q.c);
        cont.appendChild(b);
    });
    document.getElementById('question-modal').classList.remove('hidden');
}

function handleAnswer(selected, correct) {
    const buttons = document.querySelectorAll('#options-container button');
    buttons.forEach(btn => btn.disabled = true);

    if (selected === correct) {
        // تنسيق الإجابة الصحيحة عند اختيارها
        buttons[selected].style.background = "#2ecc71";
        buttons[selected].style.border = "4px solid #145a32"; // إطار غامق للتأكيد
        buttons[selected].innerText = "✅ إجابة صحيحة!";
        
        setTimeout(() => {
            document.getElementById('question-modal').classList.add('hidden');
            board[idx] = cur;
            let cells = document.querySelectorAll('.cell');
            let piece = document.createElement('div'); piece.className = 'piece';
            cells[idx].appendChild(piece);
            cells[idx].classList.add(cur === 1 ? 'p1' : 'p2');
            let winCombo = checkWin();
            if(winCombo){ drawWinLine(winCombo); end(cur); return; }
            if(!board.includes(0)){ end(0); return; }
            cur = cur === 1 ? 2 : 1; updateTurn();
        }, 1200);
    } else {
        // في حالة الإجابة الخاطئة:
        // 1. تلوين الخيار الذي اختاره اللاعب بالأحمر
        buttons[selected].style.background = "#e74c3c";
        buttons[selected].innerText = "❌ إجابة خاطئة";

        // 2. وضع إطار أخضر سميك حول الخيار الصحيح دون تغيير نصه
        buttons[correct].style.background = "#fff"; // خلفية بيضاء لبروز الإطار
        buttons[correct].style.color = "#27ae60"; // تغيير لون الخط للأخضر
        buttons[correct].style.border = "6px solid #2ecc71"; // إطار أخضر واضح جداً
        buttons[correct].style.boxShadow = "0 0 15px rgba(46, 204, 113, 0.5)"; // وهج بسيط
        
        setTimeout(() => {
            document.getElementById('question-modal').classList.add('hidden');
            cur = cur === 1 ? 2 : 1; updateTurn();
        }, 2500); // وقت كافٍ لرؤية الخيار الصحيح المميّز بالإطار
    }
}

function checkWin() {
    const size=5, target=4, dirs=[[0,1],[1,0],[1,1],[1,-1]];
    for(let r=0; r<size; r++) for(let c=0; c<size; c++) {
        let i=r*size+c; if(board[i]===0) continue;
        for(let [dr,dc] of dirs) {
            let combo=[i]; 
            for(let s=1; s<target; s++) { 
                let nr=r+dr*s, nc=c+dc*s; 
                if(nr>=0 && nr<size && nc>=0 && nc<size && board[nr*size+nc]===board[i]) combo.push(nr*size+nc); 
                else break; 
            }
            if(combo.length===target) return combo;
        }
    } return null;
}

function drawWinLine(combo) {
    const cells = document.querySelectorAll('.cell');
    const boardRect = document.getElementById('board').getBoundingClientRect();
    const startRect = cells[combo[0]].getBoundingClientRect();
    const endRect = cells[combo[3]].getBoundingClientRect();
    const line = document.getElementById('win-line');
    line.setAttribute('x1', (startRect.left + startRect.width/2) - boardRect.left);
    line.setAttribute('y1', (startRect.top + startRect.height/2) - boardRect.top);
    line.setAttribute('x2', (endRect.left + endRect.width/2) - boardRect.left);
    line.setAttribute('y2', (endRect.top + endRect.height/2) - boardRect.top);
    document.getElementById('win-svg').classList.remove('hidden');
}

function end(winner) { 
    active=false; 
    if(winner !== 0){ if(winner===1) { s1++; lastLoser = 2; } else { s2++; lastLoser = 1; } } 
    else { dr++; }
    document.getElementById('p1-score').innerText=s1; document.getElementById('p2-score').innerText=s2; document.getElementById('draw-score').innerText=dr; 
    document.getElementById('post-round-controls').classList.remove('hidden'); 
}

function resetRound() { cur = lastLoser; initBoard(); }

function announceFinalWinner() {
    let winText = s1 > s2 ? `البطل هو: ${p1} 🏆` : (s2 > s1 ? `البطل هو: ${p2} 🏆` : "تعادل نهائي! 🤝");
    document.getElementById('winner-name').innerText = winText;
    document.getElementById('final-stats').innerText = `${p1}: ${s1} | ${p2}: ${s2}`;
    document.getElementById('final-modal').classList.remove('hidden');
}

function updateTurn() { 
    const name = cur===1 ? p1 : p2;
    const color = cur===1 ? '#2ecc71' : '#e67e22';
    document.getElementById('turn-display').innerHTML = `دور: <span style="color:${color}">${name}</span>`; 
}