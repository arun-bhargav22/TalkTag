 let questions = [];
        let currentMode = 'student';
        let questionCounter = 0;
        let lastSubmissionTime = 0;
        const rateLimit = 10000; // 10 seconds in milliseconds
        let isAuthenticated = false;
        let hasJoinedClass = false;
        let authMode = 'login';
        let teachers = [
            { name: 'John Doe', email: 'teacher1@example.com', password: 'pass123' }
        ];

        // Simple profanity filter
        const profanityList = ['badword', 'inappropriate', 'rude']; // Add more as needed
        function hasProfanity(text) {
            return profanityList.some(word => text.toLowerCase().includes(word));
        }

        // Display questions
        function displayQuestions(filteredQuestions = questions) {
            const feed = document.getElementById('question-feed');
            feed.innerHTML = '';
            if (currentMode === 'student' && !hasJoinedClass) {
                feed.innerHTML = `
                    <div class="empty-state">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                        </svg>
                        <p>Please join a class to view questions.</p>
                    </div>
                `;
                return;
            }
            if (currentMode === 'teacher' && !isAuthenticated) {
                feed.innerHTML = `
                    <div class="empty-state">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                        </svg>
                        <p>Please log in to view questions.</p>
                    </div>
                `;
                return;
            }
            if (filteredQuestions.length === 0) {
                feed.innerHTML = `
                    <div class="empty-state">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                        </svg>
                        <p>${questions.length === 0 ? "No questions yet. Be the first to ask!" : "No questions found for this filter."}</p>
                    </div>
                `;
                return;
            }

            const tagEmoji = {
                'doubt': '🤔',
                'feedback': '💬',
                'clarify': '❓',
                'suggestion': '💡',
                'technical': '⚙️'
            };

            filteredQuestions.forEach(q => {
                const questionCard = document.createElement('div');
                questionCard.classList.add('question-item');
                questionCard.innerHTML = `
                    <div class="question-meta">
                        <span class="question-tag">${tagEmoji[q.tag]} ${q.tag}</span>
                        <span class="question-time">${q.timestamp.toLocaleTimeString()}</span>
                    </div>
                    <div class="question-text">${q.text}</div>
                    <div class="question-actions">
                        <button class="upvote-btn ${q.upvoted ? 'upvoted' : ''}" onclick="upvoteQuestion(${q.id})">
                            👍 ${q.upvotes}
                        </button>
                        ${currentMode === 'teacher' && isAuthenticated ? `<button class="reply-btn" onclick="toggleReply(${q.id})">Reply</button>` : ''}
                    </div>
                    <div class="reply-section ${q.replies.length > 0 ? 'active' : ''}">
                        ${q.replies.map(reply => `<div class="reply-text"><strong>Teacher:</strong>📝 ${reply}</div>`).join('')}
                        ${currentMode === 'teacher' && isAuthenticated ? `
                            <div class="reply-form" id="reply-${q.id}" style="display: none;">
                                <input type="text" class="reply-input" placeholder="Type your reply..." id="replyInput-${q.id}">
                                <button class="reply-submit" onclick="submitReply(${q.id})">Send</button>
                            </div>
                        ` : ''}
                    </div>
                `;
                feed.appendChild(questionCard);
            });
        }

        // Submit question
        function submitQuestion() {
            if (!hasJoinedClass) {
                showNotification('Please join a class to submit questions.');
                return;
            }
            const questionInput = document.getElementById('question-input');
            const tagSelect = document.getElementById('question-tag');
            const errorMessage = document.getElementById('error-message');
            const now = Date.now();

            if (now - lastSubmissionTime < rateLimit) {
                errorMessage.textContent = 'Please wait a few seconds before submitting again.';
                errorMessage.style.display = 'block';
                return;
            }

            const questionText = questionInput.value.trim();
            if (!questionText || !tagSelect.value) {
                errorMessage.textContent = 'Please fill in both question and tag.';
                errorMessage.style.display = 'block';
                return;
            }

            if (questionText.length < 5) {
                errorMessage.textContent = 'Question must be at least 5 characters long.';
                errorMessage.style.display = 'block';
                return;
            }

            if (hasProfanity(questionText)) {
                errorMessage.textContent = 'Inappropriate content detected. Please rephrase.';
                errorMessage.style.display = 'block';
                return;
            }

            const newQuestion = {
                id: ++questionCounter,
                text: questionText,
                tag: tagSelect.value,
                upvotes: 0,
                timestamp: new Date(),
                upvoted: false,
                replies: []
            };

            questions.unshift(newQuestion);
            lastSubmissionTime = now;
            questionInput.value = '';
            tagSelect.value = '';
            errorMessage.style.display = 'none';
            displayQuestions();
            showNotification('Question posted successfully!');
            updateTeacherDashboard();
        }

        // Upvote question
        function upvoteQuestion(id) {
            if (currentMode === 'student' && !hasJoinedClass) {
                showNotification('Please join a class to upvote questions.');
                return;
            }
            if (currentMode === 'teacher' && !isAuthenticated) {
                showNotification('Please log in to upvote questions.');
                return;
            }
            const question = questions.find(q => q.id === id);
            if (question) {
                if (question.upvoted) {
                    question.upvotes--;
                    question.upvoted = false;
                } else {
                    question.upvotes++;
                    question.upvoted = true;
                }
                displayQuestions();
            }
        }

        // Toggle reply section
        function toggleReply(id) {
            if (!isAuthenticated) {
                showNotification('Please log in to reply to questions.');
                return;
            }
            const replySection = document.getElementById(`reply-${id}`);
            replySection.style.display = replySection.style.display === 'none' ? 'block' : 'none';
        }

        // Submit reply
        function submitReply(id) {
            if (!isAuthenticated) {
                showNotification('Please log in to reply to questions.');
                return;
            }
            const replyInput = document.getElementById(`replyInput-${id}`);
            const replyText = replyInput.value.trim();
            if (replyText) {
                const question = questions.find(q => q.id === id);
                if (question) {
                    question.replies.push(replyText);
                    replyInput.value = '';
                    displayQuestions();
                    showNotification('Reply posted successfully!');
                }
            }
        }

        // Toggle authentication mode (login/signup)
        function toggleAuthMode(mode) {
            authMode = mode;
            const authTitle = document.getElementById('auth-title');
            const nameInput = document.getElementById('teacher-name');
            const signupBtn = document.getElementById('signup-btn');
            const authToggle = document.querySelector('.auth-toggle');
            const emailInput = document.getElementById('teacher-email');
            const passwordInput = document.getElementById('teacher-password');
            const errorMessage = document.getElementById('auth-error-message');

            authTitle.textContent = mode === 'login' ? 'Teacher Login' : 'Teacher Sign Up';
            nameInput.style.display = mode === 'signup' ? 'block' : 'none';
            signupBtn.onclick = () => authenticate(mode);
            authToggle.textContent = mode === 'login' ? 'Need to Sign Up? Click here.' : 'Already have an account? Login here.';
            authToggle.onclick = () => toggleAuthMode(mode === 'login' ? 'signup' : 'login');
            emailInput.value = '';
            passwordInput.value = '';
            nameInput.value = '';
            errorMessage.style.display = 'none';
        }

        // Authenticate teacher
        function authenticate(mode) {
            const emailInput = document.getElementById('teacher-email');
            const passwordInput = document.getElementById('teacher-password');
            const nameInput = document.getElementById('teacher-name');
            const errorMessage = document.getElementById('auth-error-message');
            const email = emailInput.value.trim();
            const password = passwordInput.value.trim();
            const name = nameInput.value.trim();

            // Reset error message
            errorMessage.style.display = 'none';

            // Validate inputs
            if (mode === 'signup' && !name) {
                errorMessage.textContent = 'Please enter your full name.';
                errorMessage.style.display = 'block';
                return;
            }
            if (mode === 'signup' && !/^[a-zA-Z\s]+$/.test(name)) {
                errorMessage.textContent = 'Name should contain only letters and spaces.';
                errorMessage.style.display = 'block';
                return;
            }
            if (!email) {
                errorMessage.textContent = 'Please enter an email address.';
                errorMessage.style.display = 'block';
                return;
            }
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                errorMessage.textContent = 'Please enter a valid email address.';
                errorMessage.style.display = 'block';
                return;
            }
            if (!password) {
                errorMessage.textContent = 'Please enter a password.';
                errorMessage.style.display = 'block';
                return;
            }
            if (password.length < 6) {
                errorMessage.textContent = 'Password must be at least 6 characters long.';
                errorMessage.style.display = 'block';
                return;
            }

            if (mode === 'signup') {
                if (teachers.some(t => t.email === email)) {
                    errorMessage.textContent = 'Email already registered. Please use a different email.';
                    errorMessage.style.display = 'block';
                    return;
                }
                teachers.push({ name, email, password });
                isAuthenticated = true;
                showNotification('Sign up successful! You are now logged in.');
                showTeacherDashboard();
            } else {
                const teacher = teachers.find(t => t.email === email && t.password === password);
                if (!teacher) {
                    errorMessage.textContent = 'Invalid email or password.';
                    errorMessage.style.display = 'block';
                    return;
                }
                isAuthenticated = true;
                showNotification('Login successful!');
                showTeacherDashboard();
            }
        }

        // Show teacher dashboard and link section
        function showTeacherDashboard() {
            document.getElementById('teacher-auth-section').classList.remove('active');
            document.getElementById('teacher-link-section').classList.add('active');
            document.getElementById('teacher-mode').classList.add('active');
            updateTeacherDashboard();
            displayQuestions();
        }

        // Switch between student and teacher modes
        function switchMode(mode) {
            currentMode = mode;
            document.querySelectorAll('.mode-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            document.querySelector(`button[onclick="switchMode('${mode}')"]`).classList.add('active');
            document.getElementById('student-mode').classList.toggle('active', mode === 'student');
            document.getElementById('student-mode').classList.toggle('disabled', mode === 'student' && !hasJoinedClass);
            document.getElementById('join-message').style.display = mode === 'student' && !hasJoinedClass ? 'block' : 'none';
            document.getElementById('student-link-section').classList.toggle('active', mode === 'student');
            document.getElementById('teacher-auth-section').classList.toggle('active', mode === 'teacher' && !isAuthenticated);
            document.getElementById('teacher-link-section').classList.toggle('active', mode === 'teacher' && isAuthenticated);
            document.getElementById('teacher-mode').classList.toggle('active', mode === 'teacher' && isAuthenticated);
            if (mode === 'teacher' && isAuthenticated) {
                updateTeacherDashboard();
            }
            displayQuestions();
        }

        // Apply filters and sorting
        function applyFilters() {
            if (currentMode === 'student' && !hasJoinedClass) {
                showNotification('Please join a class to filter questions.');
                return;
            }
            if (currentMode === 'teacher' && !isAuthenticated) {
                showNotification('Please log in to filter questions.');
                return;
            }
            const filterTag = document.getElementById('filter-tag').value;
            const sortMethod = document.getElementById('sort-method').value;

            let filteredQuestions = questions;
            if (filterTag !== 'all') {
                filteredQuestions = questions.filter(q => q.tag === filterTag);
            }

            if (sortMethod === 'upvotes') {
                filteredQuestions = [...filteredQuestions].sort((a, b) => b.upvotes - a.upvotes);
            } else {
                filteredQuestions = [...filteredQuestions].sort((a, b) => b.id - a.id);
            }

            displayQuestions(filteredQuestions);
        }

        // Update teacher dashboard
        function updateTeacherDashboard() {
            if (!isAuthenticated) return;
            document.getElementById('totalQuestions').textContent = questions.length;
            const tagCounts = {};
            questions.forEach(q => {
                tagCounts[q.tag] = (tagCounts[q.tag] || 0) + 1;
            });
            const popularTag = Object.keys(tagCounts).reduce((a, b) =>
                tagCounts[a] > tagCounts[b] ? a : b, 'None'
            );
            document.getElementById('popularTag').textContent = popularTag;
        }

        // Clear all questions
        function clearAllQuestions() {
            if (!isAuthenticated) {
                showNotification('Please log in to clear questions.');
                return;
            }
            if (confirm('Are you sure you want to clear all questions?')) {
                questions = [];
                questionCounter = 0;
                displayQuestions();
                updateTeacherDashboard();
                showNotification('All questions cleared!');
            }
        }
        // ...existing code...
    function joinClass() {
        const linkInput = document.getElementById('class-link-input');
        const linkErrorMessage = document.getElementById('link-error-message');
        const link = linkInput.value.trim();
    
        if (!link) {
            linkErrorMessage.textContent = 'Please paste a valid class link.';
            linkErrorMessage.style.display = 'block';
            return;
        }
    
        // Use fallback base URL for local files
        const baseUrl = window.location.origin.startsWith('file://') ? 'https://talktag.example.com' : window.location.origin;
        const classLinkPattern = new RegExp(`^${baseUrl}/class/[a-zA-Z0-9]{8}$`);
        const externalLinkPattern = /^(https?:\/\/)?(([\w-]+\.)*(zoom\.us|meet\.google\.com|teams\.microsoft\.com)(\/[\w-./?%&=]*)?)$/i;
    
        if (classLinkPattern.test(link) || externalLinkPattern.test(link)) {
            linkErrorMessage.style.display = 'none';
            hasJoinedClass = true;
            document.getElementById('student-mode').classList.remove('disabled');
            document.getElementById('join-message').style.display = 'none';
            showNotification('Successfully joined class! You can now ask questions.');
            ///window.open(link.startsWith('http') ? link : `https://${link}`, '_blank');
            linkInput.value = '';
            displayQuestions();
        } else {
            linkErrorMessage.textContent = 'Invalid URL format. Please use a TalkTag class link or a valid Zoom/Google Meet/Teams link.';
            linkErrorMessage.style.display = 'block';
        }
    }
    // ...existing code...


        // Generate class link (teacher mode)
        function generateClassLink() {
            if (!isAuthenticated) {
                showNotification('Please log in to generate a class link.');
                return;
            }
            const generatedLinkDiv = document.getElementById('generated-link');
            // Use a fallback base URL if window.location.origin is not suitable (e.g., file://)
            const baseUrl = window.location.origin.startsWith('file://') ? 'https://talktag.example.com' : window.location.origin;
            const classId = Math.random().toString(36).substring(2, 10);
            const classLink = `${baseUrl}/class/${classId}`;
            generatedLinkDiv.textContent = classLink;
            showNotification('Class link generated! Copied to clipboard.');
            navigator.clipboard.writeText(classLink).catch(err => {
                console.error('Failed to copy link:', err);
                showNotification('Failed to copy link. Please copy manually.');
            });
        }

        // Show notification
        function showNotification(message) {
            const notification = document.createElement('div');
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: #10b981;
                color: white;
                padding: 15px 20px;
                border-radius: 10px;
                font-weight: 500;
                z-index: 1000;
                animation: slideIn 0.3s ease;
            `;
            notification.textContent = message;
            document.body.appendChild(notification);
            setTimeout(() => {
                notification.remove();
            }, 3000);
        }

        // Initialize
        displayQuestions();