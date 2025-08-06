const API_KEY = "Bearer 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";
		const MODEL_NAME = 'gpt-4o-mini';

		// --- DOM ELEMENTS ---
		const chatMessages = document.getElementById('chat-messages');
		const userInput = document.getElementById('user-input');
		const sendBtn = document.getElementById('send-btn');
		const settingsModal = document.getElementById('settings-modal');

		// --- STATE ---
		let currentLanguage = 'en';
		let currentTheme = 'dark';
		let autoMode = false;
		let messageCount = 0;
		let chatHistory = [{ role: "system", content: "You are a helpful assistant. Always respond in a friendly and informative manner." }];
		let isTyping = false;

		// --- TRANSLATIONS & GREETINGS ---
		const translations = {
			en: { 
				title: 'AI Chat Assistant', 
				settings: 'Settings', 
				language: 'Language', 
				theme: 'Theme', 
				auto: 'Auto Detect', 
				darkTheme: 'Dark', 
				lightTheme: 'Light', 
				inputPlaceholder: 'Type your message...', 
				errorMessage: 'Sorry, something went wrong. Please try again.',
				typing: 'AI is typing...'
			},
			uk: { 
				title: 'ШІ Чат Асистент', 
				settings: 'Налаштування', 
				language: 'Мова', 
				theme: 'Тема', 
				auto: 'Автовизначення', 
				darkTheme: 'Темна', 
				lightTheme: 'Світла', 
				inputPlaceholder: 'Введіть ваше повідомлення...', 
				errorMessage: 'Вибачте, щось пішло не так. Спробуйте ще раз.',
				typing: 'ШІ друкує...'
			},
			ru: { 
				title: 'ИИ Чат Ассистент', 
				settings: 'Настройки', 
				language: 'Язык', 
				theme: 'Тема', 
				auto: 'Автоопределение', 
				darkTheme: 'Тёмная', 
				lightTheme: 'Светлая', 
				inputPlaceholder: 'Введите ваше сообщение...', 
				errorMessage: 'Извините, что-то пошло не так. Попробуйте ещё раз.',
				typing: 'ИИ печатает...'
			},
			pt: { 
				title: 'Assistente de IA', 
				settings: 'Configurações', 
				language: 'Idioma', 
				theme: 'Tema', 
				auto: 'Detecção Automática', 
				darkTheme: 'Escuro', 
				lightTheme: 'Claro', 
				inputPlaceholder: 'Digite sua mensagem...', 
				errorMessage: 'Desculpe, algo deu errado. Tente novamente.',
				typing: 'IA está digitando...'
			}
		};
		
		const greetings = {
			en: [
				"Hello! I'm your AI assistant. How can I help you today? Often stops working API 😭",
				"Welcome! Feel free to ask me anything. Often stops working API 😢",
				"Hi there! Ready to chat? Often stops working API 😭"
			],
			uk: [
				"Привіт! Я ваш ШІ асистент. Чим можу допомогти? Часто перестає працювати API :(",
				"Вітаю! Не соромтеся запитувати що завгодно. Часто перестає працювати API :(",
				"Привіт! Готовий до спілкування? Часто перестає працювати API :("
			],
			ru: [
				"Привет! Я ваш ИИ ассистент. Чем могу помочь? Часто перестає працювати API :(",
				"Добро пожаловать! Не стесняйтесь спрашивать что угодно. Часто перестає працювати API :(",
				"Привет! Готов к общению? Часто перестає працювати API :("
			],
			pt: [
				"Olá! Sou seu assistente de IA. Como posso ajudar hoje?",
				"Bem-vindo! Fique à vontade para perguntar qualquer coisa.",
				"Oi! Pronto para conversar?"
			]
		};

		// --- CORE FUNCTIONS ---

		/** Adds a message to the chat interface. */
		function addMessage(text, type) {
			const messageDiv = document.createElement('div');
			messageDiv.className = `message ${type}`;
			messageDiv.style.animationDelay = `${messageCount * 0.05}s`;

			const avatar = document.createElement('div');
			avatar.className = 'message-avatar';
			avatar.innerHTML = type === 'user-message' ? '<i class="fas fa-user"></i>' : '<i class="fas fa-robot"></i>';
			
			const contentSpan = document.createElement('span');
			contentSpan.className = 'message-content';
			contentSpan.textContent = text;
			
			messageDiv.appendChild(avatar);
			messageDiv.appendChild(contentSpan);

			chatMessages.appendChild(messageDiv);
			chatMessages.scrollTop = chatMessages.scrollHeight;
			messageCount++;
			return messageDiv;
		}

		/** Shows typing indicator */
		function showTypingIndicator() {
			const typingDiv = document.createElement('div');
			typingDiv.className = 'message bot-message';
			typingDiv.id = 'typing-indicator';
			
			const avatar = document.createElement('div');
			avatar.className = 'message-avatar';
			avatar.innerHTML = '<i class="fas fa-robot"></i>';
			
			const typingContent = document.createElement('div');
			typingContent.className = 'typing-indicator';
			typingContent.innerHTML = '<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>';
			
			typingDiv.appendChild(avatar);
			typingDiv.appendChild(typingContent);
			
			chatMessages.appendChild(typingDiv);
			chatMessages.scrollTop = chatMessages.scrollHeight;
		}

		/** Removes typing indicator */
		function hideTypingIndicator() {
			const indicator = document.getElementById('typing-indicator');
			if (indicator) {
				indicator.remove();
			}
		}

		/** Handles sending user message and getting AI response. */
		async function sendMessage() {
			const messageText = userInput.value.trim();
			if (!messageText || isTyping) return;

			isTyping = true;
			sendBtn.disabled = true;
			sendBtn.classList.add('message-sent');
			sendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

			addMessage(messageText, 'user-message');
			userInput.value = '';

			// Reset send button state after animation
			setTimeout(() => {
				sendBtn.classList.remove('message-sent');
			}, 600);

			showTypingIndicator();
			await getGPTResponse(messageText);

			hideTypingIndicator();
			isTyping = false;
			sendBtn.disabled = false;
			sendBtn.innerHTML = '<i class="fas fa-paper-plane"></i>';
		}

		/** Fetches and streams the AI response from OpenAI API. */
		async function getGPTResponse(userMsg) {
			chatHistory.push({ role: "user", content: userMsg });

			if (autoMode) {
				const detectedLang = detectLanguage(userMsg);
				if (detectedLang !== currentLanguage) {
					currentLanguage = detectedLang;
					document.documentElement.lang = detectedLang;
					updateTranslations();
				}
			}

			const botMessageDiv = addMessage("", 'bot-message');
			const botTextSpan = botMessageDiv.querySelector('.message-content');
			botTextSpan.textContent = '▋';

			try {
				const response = await fetch("https://api.openai.com/v1/chat/completions", {
					method: "POST",
					headers: { 
						"Content-Type": "application/json", 
						"Authorization": API_KEY 
					},
					body: JSON.stringify({ 
						model: MODEL_NAME, 
						messages: chatHistory, 
						stream: true,
						max_tokens: 1000,
						temperature: 0.7
					})
				});

				if (!response.ok) {
					throw new Error(`HTTP error! status: ${response.status}`);
				}

				const reader = response.body.getReader();
				const decoder = new TextDecoder("utf-8");
				let fullText = "";

				while (true) {
					const { value, done } = await reader.read();
					if (done) break;

					const chunk = decoder.decode(value, { stream: true });
					const lines = chunk.split("\n").filter(line => line.trim().startsWith("data:"));

					for (const line of lines) {
						const data = line.replace(/^data: /, "").trim();
						if (data === "[DONE]") break;
						try {
							const parsed = JSON.parse(data);
							const deltaContent = parsed.choices?.[0]?.delta?.content;
							if (deltaContent) {
								fullText += deltaContent;
								botTextSpan.textContent = fullText + '▋';
								chatMessages.scrollTop = chatMessages.scrollHeight;
							}
						} catch (e) {
							console.warn("Error parsing stream data:", e);
						}
					}
				}
				botTextSpan.textContent = fullText;
				if (fullText.trim()) {
					chatHistory.push({ role: "assistant", content: fullText.trim() });
				}

			} catch (err) {
				console.error("Error calling OpenAI API:", err);
				botTextSpan.textContent = translations[currentLanguage].errorMessage;
			} finally {
				chatMessages.scrollTop = chatMessages.scrollHeight;
			}
		}

		// --- UI & SETTINGS FUNCTIONS ---

		function openSettings() { 
			settingsModal.classList.add('active'); 
		}
		
		function closeSettings() { 
			settingsModal.classList.remove('active'); 
		}

		/** Updates the entire UI to a new language. */
		function updateTranslations() {
			document.querySelectorAll('[data-translate]').forEach(el => {
				const key = el.getAttribute('data-translate');
				if (translations[currentLanguage]?.[key]) {
					el.textContent = translations[currentLanguage][key];
				}
			});
			document.querySelectorAll('[data-translate-placeholder]').forEach(el => {
				const key = el.getAttribute('data-translate-placeholder');
				if (translations[currentLanguage]?.[key]) {
					el.placeholder = translations[currentLanguage][key];
				}
			});
		}

		/** Changes the active language. */
		function changeLanguage(lang, element) {
			autoMode = (lang === 'auto');
			document.querySelectorAll('.language-option').forEach(opt => opt.classList.remove('active'));
			element.classList.add('active');

			if (!autoMode) {
				currentLanguage = lang;
				document.documentElement.lang = lang;
				updateTranslations();
			}
		}

		/** Changes the active theme. */
		function changeTheme(theme, element) {
			currentTheme = theme;
			document.documentElement.setAttribute('data-theme', theme);
			document.querySelectorAll('.theme-option').forEach(opt => opt.classList.remove('active'));
			element.classList.add('active');
		}

		/** Detects language from text. */
		function detectLanguage(text) {
			// Ukrainian specific letters
			if (/[іїєґ]/i.test(text)) return 'uk';
			// Russian letters (excluding Ukrainian ones)
			if (/[а-яё]/i.test(text) && !/[іїєґ]/i.test(text)) return 'ru';
			// Portuguese common words and letters
			if (/\b(de|a|o|que|e|do|da|em|um|para|com|não|mais|se)\b/i.test(text) || /[çãõ]/i.test(text)) return 'pt';
			// Default to English
			return 'en';
		}

		/** Clears the chat */
		function clearChat() {
			chatMessages.innerHTML = '';
			chatHistory = [{ role: "system", content: "You are a helpful assistant. Always respond in a friendly and informative manner." }];
			messageCount = 0;
			
			// Show welcome message again
			setTimeout(() => {
				const welcomeMessages = greetings[currentLanguage] || greetings.en;
				const welcomeMsg = welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)];
				addMessage(welcomeMsg, 'bot-message');
			}, 300);
		}

		// --- INITIALIZATION ---
		document.addEventListener('DOMContentLoaded', () => {
			// Set default theme and language UI state
			const darkThemeOption = document.querySelector('.theme-option[onclick*="dark"]');
			const englishOption = document.querySelector('.language-option[onclick*="en"]');
			
			if (darkThemeOption) changeTheme('dark', darkThemeOption);
			if (englishOption) changeLanguage('en', englishOption);

			// Display initial welcome message
			const welcomeMessages = greetings[currentLanguage] || greetings.en;
			const welcomeMsg = welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)];
			setTimeout(() => addMessage(welcomeMsg, 'bot-message'), 500);

			// Event Listeners
			sendBtn.addEventListener('click', sendMessage);
			userInput.addEventListener('keypress', e => { 
				if (e.key === 'Enter' && !e.shiftKey) {
					e.preventDefault();
					sendMessage(); 
				}
			});
			
			// Settings modal event listeners
			settingsModal.addEventListener('click', e => { 
				if (e.target === settingsModal) closeSettings(); 
			});
			
			document.addEventListener('keydown', e => { 
				if (e.key === 'Escape') closeSettings(); 
			});

			// Auto-resize input
			userInput.addEventListener('input', function() {
				this.style.height = 'auto';
				this.style.height = this.scrollHeight + 'px';
			});

			// Focus input on load
			userInput.focus();
		});
