    // Store quizzes and results
    let quizzes = {};
    let currentQuiz = null;
    let timer = null;
    let currentQuestionIndex = 0;

    // Screen Management
    function showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => screen.classList.add('hidden'));
        document.getElementById(screenId).classList.remove('hidden');
    }

    function showWelcomeScreen() {
        showScreen('welcome-screen');
    }

    function showTeacherPanel() {
        showScreen('teacher-panel');
    }

    function showStudentPanel() {
        showScreen('student-panel');
    }

    function showLeaderboard() {
        showScreen('leaderboard');
    }

    // Teacher Functions

    function addQuestion() {
        const questionsContainer = document.getElementById('questions-container');
        const createQuizBtn = document.getElementById("create-quiz-btn");
        const questionCount = questionsContainer.children.length + 1;
        
        const questionBlock = document.createElement('div');
        questionBlock.className = 'question-block';
        questionBlock.innerHTML = `
            <div class="form-group">
                <label>Question ${questionCount}:</label>
                <div class="question-input" contenteditable="true" required></div>
            </div>
            <div class="form-group">
                <label>Options:</label>
                <input type="text" placeholder="Option 1" class="option-input" required>
                <input type="text" placeholder="Option 2" class="option-input" required>
                <input type="text" placeholder="Option 3" class="option-input" required>
                <input type="text" placeholder="Option 4" class="option-input" required>
            </div>
            <div class="form-group">
                <label>Correct Answer (1-4):</label>
                <input type="number" class="correct-answer" min="1" max="4" required>
            </div>
            <button type="button" onclick="deleteQuestion(this)">Delete Question</button>
        `;
        
        questionsContainer.appendChild(questionBlock);
        createQuizBtn.style.display = "block";
    }
    
    function deleteQuestion(button) {
        button.parentElement.remove();
    }
    
    document.getElementById('quiz-form').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const quizId = generateQuizId();
        const questions = [];
        const questionBlocks = document.querySelectorAll('.question-block');
        
        questionBlocks.forEach(block => {
            const options = Array.from(block.querySelectorAll('.option-input')).map(input => input.value.trim());
            const questionText = block.querySelector('.question-input').textContent.trim();
            const correctAnswer = parseInt(block.querySelector('.correct-answer').value) - 1;
            
            if (questionText && options.every(opt => opt) && !isNaN(correctAnswer) && correctAnswer >= 0 && correctAnswer < 4) {
                questions.push({
                    question: questionText,
                    options: options,
                    correctAnswer: correctAnswer
                });
            }
        });
        
        if (questions.length === 0) {
            alert("Please add at least one valid question before submitting.");
            return;
        }
        
        const timeLimitInput = document.getElementById('time-limit');
        const timeLimit = parseInt(timeLimitInput.value) * 60 || 0;
        
        quizzes[quizId] = {
            questions: questions,
            timeLimit: timeLimit,
            results: []
        };
        
        const quizLink = `${window.location.origin}/quiz.html?quiz=${quizId}`;
        document.getElementById('quiz-link').textContent = quizLink;
        document.getElementById('quiz-code-display').textContent = quizId;
        document.getElementById('share-link').classList.remove('hidden');
    });
    
    function generateQuizId() {
        return Math.random().toString(36).substr(2, 6).toUpperCase();
    }
    
    // Student Functions
    function startQuiz() {
        const studentName = document.getElementById('student-name').value;
        const quizCode = document.getElementById('quiz-code').value;
        

        if (!studentName || !quizCode || !quizzes[quizCode]) {
            alert('Invalid quiz code or name missing!');
            return;
        }

        currentQuiz = {
            code: quizCode,
            studentName: studentName,
            startTime: new Date(),
            answers: new Array(quizzes[quizCode].questions.length).fill(null)
        };

        currentQuestionIndex = 0;
        document.getElementById('total-questions').textContent = quizzes[quizCode].questions.length;
        updateQuestionDisplay();
        startTimer(quizzes[quizCode].timeLimit);

        document.getElementById('quiz-entry').classList.add('hidden');
        document.getElementById('quiz-area').classList.remove('hidden');
    }

    function updateQuestionDisplay() {
        const quiz = quizzes[currentQuiz.code];
        if (!quiz || quiz.questions.length === 0) return; // Prevent errors
        const question = quiz.questions[currentQuestionIndex];
        
        document.getElementById('current-question').textContent = currentQuestionIndex + 1;
        document.getElementById('question-display').innerHTML = question.question; // Set HTML content
        
        const optionsDisplay = document.getElementById('options-display');
        optionsDisplay.innerHTML = '';

        question.options.forEach((option, index) => {
            const optionElement = document.createElement('div');
            optionElement.className = 'option';
            if (currentQuiz.answers[currentQuestionIndex] === index) {
                optionElement.classList.add('selected');
            }
            optionElement.textContent = option;
            optionElement.onclick = () => selectOption(index);
            optionsDisplay.appendChild(optionElement);
        });

        // Update navigation buttons
        document.getElementById('prev-button').disabled = currentQuestionIndex === 0;
        document.getElementById('next-button').classList.toggle('hidden', currentQuestionIndex === quiz.questions.length - 1);
        document.getElementById('submit-button').classList.toggle('hidden', currentQuestionIndex !== quiz.questions.length - 1);
    }

    function selectOption(index) {
        currentQuiz.answers[currentQuestionIndex] = index;
        document.querySelectorAll('.option').forEach(option => option.classList.remove('selected'));
        document.querySelectorAll('.option')[index].classList.add('selected');
    }

    function previousQuestion() {
        if (currentQuestionIndex > 0) {
            currentQuestionIndex--;
            updateQuestionDisplay();
        }
    }

    function nextQuestion() {
        const quiz = quizzes[currentQuiz.code];
        if (currentQuestionIndex < quiz.questions.length - 1) {
            currentQuestionIndex++;
            updateQuestionDisplay();
        }
    }

    function startTimer(seconds) {
        let timeLeft = seconds;
        const timerDisplay = document.getElementById('timer');

        timer = setInterval(() => {
            const minutes = Math.floor(timeLeft / 60);
            const secs = timeLeft % 60;
            timerDisplay.textContent = `${minutes}:${secs.toString().padStart(2, '0')}`; // Corrected line

            if (timeLeft === 0) {
                submitQuiz();
            }
            timeLeft--;
        }, 1000);
    }

    function submitQuiz() {
        clearInterval(timer);
        
        if (!currentQuiz) return;

        const quiz = quizzes[currentQuiz.code];
        const timeTaken = (new Date() - currentQuiz.startTime) / 1000;
        
        // Calculate score
        let correctAnswers = 0;
        quiz.questions.forEach((question, index) => {
            if (currentQuiz.answers[index] === question.correctAnswer) {
                correctAnswers++;
            }
        });
        
        const score = Math.round((correctAnswers / quiz.questions.length) * 100);

        // Calculate badges
        const badges = [];
        if (score === 100) badges.push({ icon: 'fa-crown', type: 'perfect', title: 'Perfect Score' });
        if (timeTaken < quiz.timeLimit / 2) badges.push({ icon: 'fa-bolt', type: 'speedster', title: 'Speed Demon' });
        if (correctAnswers >= quiz.questions.length - 1) badges.push({ icon: 'fa-star', type: 'consistent', title: 'Star Performer' });

        quiz.results.push({
            name: currentQuiz.studentName,
            score: score,
            timeTaken: timeTaken,
            badges: badges
        });

        updateLeaderboard(currentQuiz.code);
        showLeaderboard();
        currentQuiz = null;
    }

    function updateLeaderboard(quizCode) {
        const quiz = quizzes[quizCode];
        const rankingsBody = document.getElementById('rankings-body');
        rankingsBody.innerHTML = '';

        const sortedResults = quiz.results.sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
            return a.timeTaken - b.timeTaken;
        });

        sortedResults.forEach((result, index) => {
            const row = document.createElement('tr');
            const badgeHTML = result.badges.map(badge => 
                `<i class="fa-solid ${badge.icon} badge badge-${badge.type}" title="${badge.title}"></i>` // Corrected line
            ).join('');
            
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${result.name}</td>
                <td>${result.score}%</td>
                <td>${Math.round(result.timeTaken)}s</td>
                <td>${badgeHTML}</td>
            `;
            rankingsBody.appendChild(row);
        });
    }

    // Check for quiz parameter in URL
    function onloadfunction() {
        const urlParams = new URLSearchParams(window.location.search);
        const quizId = urlParams.get('quiz');
        
        if (quizId) {
            showStudentPanel();
            document.getElementById('quiz-code').value = quizId;
        }
    };

    // Function to paste image
    function pasteImage() {
        const questionInput = document.querySelector('.question-input[contenteditable="true"]');
        questionInput.focus();
        document.execCommand('paste');
    }
    const socket = io("http://localhost:5000"); // Adjust for production



