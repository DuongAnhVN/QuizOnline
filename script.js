const apiKey = 'AIzaSyBD8LXB-CEByc04G_hqO44uh1LmsDwjcOk';
const sheetId = '1fh9D28GDIZpG8p440zLKZgi8vo_DjAK4Xyb2PYfZBHw';
const range = 'Sheet1!A:F';


// Thời gian tối đa (1 giờ)
const maxTimeInSeconds = 60 * 60;
let timeRemaining = maxTimeInSeconds;
let timerInterval;
let questions;

window.onload = function() {

    const popup = document.getElementById('popup');
    const startButton = document.getElementById('startButton');
    const timeInput = document.getElementById('timeInput');
    const countInput = document.getElementById('countInput');

    // Hiển thị popup
    popup.style.display = 'block';
    // Bắt sự kiện khi nhấn nút "Start"
    startButton.addEventListener('click', function() {
        const selectedTime = parseInt(timeInput.value);
        const countQuestions = parseInt(countInput.value);

        // Kiểm tra nếu thời gian được chọn hợp lệ và lớn hơn 0
        if (!isNaN(selectedTime) && selectedTime > 0) {
            // Ẩn popup
            document.querySelector('footer').style = 'display: flex'

            popup.style.display = 'none';
            // Gán thời gian còn lại bằng thời gian được chọn (chuyển đổi thành giây)
            timeRemaining = selectedTime * 60;
            // Hiển thị thời gian ban đầu
            displayTime();
            marginQuizContainer();
            // Gọi hàm giảm thời gian mỗi giây
            timerInterval = setInterval(decreaseTime, 1000);
            // Bắt đầu quiz
            fetchQuizData().then(questionsresult => {
                if (questionsresult.length >= countQuestions) {
                    questions = shuffle(questionsresult).slice(0, countQuestions);
                } else {
                    questions = shuffle(questionsresult);
                }
                buildQuiz();
            });
        } else {
            alert('Please enter a valid time.');
        }
    });

};

function marginQuizContainer(){
    // Lấy chiều cao của footer
    const footerHeight = document.querySelector('footer').offsetHeight;
    // Lấy phần tử quiz-container
    const quizContainer = document.querySelector('.quiz-container');
    // Áp dụng margin-bottom cho quiz-container bằng chiều cao của footer
    quizContainer.style.marginBottom = footerHeight + 'px';
}

// Hàm hiển thị thời gian
function displayTime() {
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    document.getElementById('time').textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// Hàm giảm thời gian
function decreaseTime() {
    if (timeRemaining > 0) {
        timeRemaining--;
        displayTime();
        if (timeRemaining === 0) {
            submitQuiz();
        }
    }
}



async function fetchQuizData() {
    const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}?key=${apiKey}`);
    const data = await response.json();
    return data.values;
}

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function buildQuiz() {
    const quizContainer = document.getElementById('quiz');
    const output = [];

    questions.forEach((question, index) => {
        let answers = [];
        for (let i = 1; i <= 4; i++) {
            if (question[i]) {
                answers.push(
                    `<label>
                        <input type="radio" name="answer${index}" value="${i}">
                        ${question[i]}
                    </label>`
                );
            }
        }
        output.push(
            `<div class="question-container">
                <div class="question" id="question${index}">${index+1}. ${question[0]}</div>
                <div class="answers">${answers.join('')}</div>
            </div>`
        );
    });
    quizContainer.innerHTML = output.join('');
}

function showResults() {
    const quizContainer = document.getElementById('quiz');
    const answerContainers = quizContainer.querySelectorAll('.answers');
    let numCorrect = 0;

    questions.forEach((question, index) => {
        const answerContainer = answerContainers[index];
        const input = answerContainer.querySelector('input[type=radio]:checked');
        if (input) {
            if (input.value == question[5]) {
                numCorrect++;
                input.parentNode.style.color = 'green'; // Hiển thị màu xanh cho câu trả lời đúng
            } else {
                const faIcon = document.createElement('i');
                faIcon.classList.add('fas', 'fa-times-circle');
                faIcon.style.color = 'red';
                faIcon.style.marginRight = '5px';
                const questionContainer = document.getElementById(`question${index}`);
                questionContainer.insertBefore(faIcon, questionContainer.firstChild);
                const correctInput = answerContainer.querySelector(`input[type=radio][value="${question[5]}"]`);
                if (correctInput) {
                    correctInput.parentNode.style.color = 'green';
                }
                input.parentNode.style.color = 'red'; // Hiển thị màu đỏ cho câu trả lời sai
            }
        }
    });


    document.getElementById('results').innerText = `${numCorrect} out of ${questions.length} correct`;
}

document.getElementById('submit').addEventListener('click', () => {
        const quizContainer = document.getElementById('quiz');
        const answerContainers = quizContainer.querySelectorAll('.answers');
        let allAnswered = true;

        answerContainers.forEach((answerContainer, index) => {
            const selector = `input[name=answer${index}]:checked`;
            const userAnswer = answerContainer.querySelector(selector);
            const questionContainer = answerContainer.closest('.question-container');

            if (!userAnswer) {
                questionContainer.style.backgroundColor = 'yellow';
                allAnswered = false;
            } else {
                questionContainer.style.backgroundColor = ''; // Reset background color if answered
            }
        });

        if (allAnswered) {
            clearInterval(timerInterval);
            showResults();
            document.getElementById('results').style.color = ''; // Reset result message color
        } else {
            document.getElementById('results').style.color = 'red';
            document.getElementById('results').innerText = 'Please answer all questions.';
        }
});

