const apiKey = 'AIzaSyBD8LXB-CEByc04G_hqO44uh1LmsDwjcOk';
const sheetId = '1fh9D28GDIZpG8p440zLKZgi8vo_DjAK4Xyb2PYfZBHw';
const range = 'Sheet1!A:G';


// Thời gian tối đa (1 giờ)
const maxTimeInSeconds = 60 * 60;
let timeRemaining = maxTimeInSeconds;
let timerInterval;
let questions;
const incorrectAnswers = [];
const correctAnswers = [];

window.onload = function() {

    const download = document.getElementById('download');
    const popup = document.getElementById('popup');
    const startButton = document.getElementById('startButton');
    const timeInput = document.getElementById('timeInput');
    const countInput = document.getElementById('countInput');
    // Hiển thị popup
    popup.style.display = 'block';
    download.style.display = 'none';
    // Bắt sự kiện khi nhấn nút "Start"
    startButton.addEventListener('click', function() {
        const selectedTime = parseInt(timeInput.value);
        const countQuestions = parseInt(countInput.value);
        const selectedOption = document.getElementById('options').value;

        // Kiểm tra nếu thời gian được chọn hợp lệ và lớn hơn 0
        if (!isNaN(selectedTime) && selectedTime > 0) {
            
            fetchQuizData(selectedOption,countQuestions).then(questionsresult => {
                if(questionsresult == null){
                    document.getElementById('notice').style.color = 'red';
                    document.getElementById('notice').textContent  = 'Lỗi câu hỏi. lh: 0364072379';
                }else{
                    document.getElementById('notice').style.color = '';
                    document.getElementById('notice').innerText = '';
                    // Ẩn popup
                    popup.style.display = 'none';

                    document.querySelector('footer').style = 'display: flex'
                    // Gán thời gian còn lại bằng thời gian được chọn (chuyển đổi thành giây)
                    timeRemaining = selectedTime * 60;
                    // Hiển thị thời gian ban đầu
                    displayTime();
                    marginQuizContainer();
                    // Gọi hàm giảm thời gian mỗi giây
                    timerInterval = setInterval(decreaseTime, 1000);

                    questions = questionsresult;
                    buildQuiz();
                }
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
            document.getElementById('submit').disabled  = true;
            showResults();
        }
    }
}



async function fetchQuizData(tag, number) {
    const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}?key=${apiKey}`);
    const data = await response.json();

    const allQuestions = data.values;

    if(tag != '')
    {
        let category1;
        const category2 = tag + '_Kiến thức chung';
        const category3 = tag + '_Kỹ năng Quản lý lãnh đạo';
        const category4 = tag + '_Tiêu chuẩn phong cách giao dịch';
        if (tag == 'TDKHCN') {
            category1 = tag + '_Tín dụng_Khách hàng cá nhân';
        }else if(tag == 'TDKHDN')
        {
            category1 = tag + '_Tín dụng khách hàng doanh nghiệp';
        }

        const questionsCategory1 = allQuestions.filter(row => row[6] == category1.toString());
        const questionsCategory2 = allQuestions.filter(row => row[6] === category2);
        const questionsCategory3 = allQuestions.filter(row => row[6] === category3);
        const questionsCategory4 = allQuestions.filter(row => row[6] === category4);

        const numCategory1 = Math.floor(number * 0.75);
        const numCategoryOthers = number - numCategory1;
        const numEachOtherCategory = Math.floor(numCategoryOthers / 3);
        const remainder = numCategoryOthers % 3;
        //console.log(numCategory1, numCategoryOthers,numEachOtherCategory);

        const selectedQuestions = [
            ...shuffle(questionsCategory1).slice(0, numCategory1),
            ...shuffle(questionsCategory2).slice(0, numEachOtherCategory + (remainder > 0 ? 1 : 0)),
            ...shuffle(questionsCategory3).slice(0, numEachOtherCategory + (remainder > 1 ? 1 : 0)),
            ...shuffle(questionsCategory4).slice(0, numEachOtherCategory)
        ];


        return shuffle(selectedQuestions.slice(0, number));
    }

    
    return null;
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
                <div class="question" id="question${index}">${index+1}. ${question[0]} - <label class="tagQuestion">${question[6]}</label></div>
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
    let numCheck = 0;

    questions.forEach((question, index) => {
        const answerContainer = answerContainers[index];
        const input = answerContainer.querySelector('input[type=radio]:checked');
        if (input) {
            numCheck++;
            if (input.value == question[5]) {
                numCorrect++;
                input.parentNode.style.color = 'green'; // Hiển thị màu xanh cho câu trả lời đúng

                correctAnswers.push({
                    question: question[0], 
                    selectedAnswer: question[input.value]
                });

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

                incorrectAnswers.push({
                    question: question[0], // giả sử question[0] chứa câu hỏi
                    selectedAnswer: question[input.value],
                    correctAnswer: question[question[5]]
                });
            }
        }
    });
    //console.log(incorrectAnswers);

    document.getElementById('submit').disabled = true;
    document.getElementById('download').style.display = 'block';


    document.getElementById('results').innerText = `${numCorrect} out of ${numCheck} correct`;
}


document.getElementById('download').addEventListener('click', () => {

    let txtContent = `Time: ${getFormattedCurrentTime()} - Điểm ${correctAnswers.length}/${correctAnswers.length + incorrectAnswers.length}\n\nCác câu trả lời đúng:\n\n`;
    correctAnswers.forEach((item, idx) => {
        txtContent += `${idx + 1}. ${item.question}\n`;
        txtContent += `   - Câu trả lời đã chọn: ${item.selectedAnswer}\n`;
    });

    txtContent += '\n\nCác câu trả lời sai:\n\n';
    incorrectAnswers.forEach((item, idx) => {
        txtContent += `${idx + 1}. ${item.question}\n`;
        txtContent += `   - Câu trả lời đã chọn: ${item.selectedAnswer}\n`;
        txtContent += `   - Câu trả lời đúng: ${item.correctAnswer}\n\n`;
    });

    const blob = new Blob([txtContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `incorrect-${getFormattedCurrentTime()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
});

function getFormattedCurrentTime() {
    const now = new Date();

    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0'); // Tháng bắt đầu từ 0
    const year = now.getFullYear();
    const hour = String(now.getHours()).padStart(2, '0');
    const minute = String(now.getMinutes()).padStart(2, '0');

    return `${day}/${month}/${year}-${hour}h${minute}`;
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
