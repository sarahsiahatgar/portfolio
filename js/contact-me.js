let num1, num2;
let currentChallengeToken = null;

export async function initContactForm() {
    const captchaLabel = document.getElementById('captchaLabel');
    try {
        const response = await fetch('/api/contact');
        if (!response.ok) throw new Error(`Challenge request failed: ${response.status}`);
        const data = await response.json();

        num1 = data.num1;
        num2 = data.num2;
        currentChallengeToken = data.token;

        if (captchaLabel) {
            captchaLabel.textContent = `Security Check: What is ${num1} + ${num2}?`;
        }
    } catch (err) {
        console.error('Failed to load security check:', err);
        currentChallengeToken = null;
        if (captchaLabel) {
            captchaLabel.textContent = 'Security Check: having trouble loading — try refreshing?';
        }
    }
}

export function updateCharCount() {
    const textInput = document.getElementById('docText');
    const charCount = document.getElementById('charCount');
    if (textInput && charCount) {
        const currentLength = textInput.value.length;
        charCount.textContent = `${currentLength}/4000`;
        charCount.style.color = currentLength >= 3800 ? '#8a3b2b' : '#5c5f3f';
    }
}

export async function sendContactMessage() {
    const identifier = document.getElementById('senderEmail').value.trim();
    const subject = document.getElementById('docTitle').value.trim();
    const message = document.getElementById('docText').value.trim();
    const userAnswer = parseInt(document.getElementById('captchaAnswer').value, 10);
    const statusDiv = document.getElementById('formStatus');
    const sendBtn = document.getElementById('sendBtn');

    if (!identifier || !message || isNaN(userAnswer)) {
        statusDiv.style.color = '#8a3b2b';
        statusDiv.textContent = 'Please fill out your Name, Nickname, Fakename, any Name at all; and write a Message (that is the reason you are here!) and complete the security math check.';
        return;
    }

    if (userAnswer !== num1 + num2) {
        statusDiv.style.color = '#8a3b2b';
        statusDiv.textContent = "Almost — double check the math and try again.";
        return;
    }

    if (!currentChallengeToken) {
        statusDiv.style.color = '#8a3b2b';
        statusDiv.textContent = 'Security check not ready yet — please wait a moment and try again.';
        return;
    }

	sendBtn.disabled = true;
    sendBtn.textContent = 'Sending...';
    statusDiv.textContent = '';

    try {
        
        const minDelay = new Promise(resolve => setTimeout(resolve, 2000));
        
        const fetchPromise = fetch('/api/contact', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                identifier,
                subject,
                message,
                userAnswer,
                token: currentChallengeToken,
                website_url: document.getElementById('website_url').value
            })
        });

        
        const [response] = await Promise.all([fetchPromise, minDelay]);
        const data = await response.json();

        if (response.ok) {
            statusDiv.style.color = '#3d5c34';
            statusDiv.textContent = 'Message sent successfully! Thanks for reaching out.';
            
            document.getElementById('senderEmail').value = '';
            document.getElementById('docTitle').value = '';
            document.getElementById('docText').value = '';
            document.getElementById('captchaAnswer').value = '';
            document.getElementById('website_url').value = '';
            updateCharCount();
            await initContactForm();
        } else {
            statusDiv.style.color = '#8a3b2b';
            statusDiv.textContent = data.error || 'Oops! Failed to send message. Please try again.';
        }
    } catch (error) {
        statusDiv.style.color = '#8a3b2b';
        statusDiv.textContent = 'Oops! An error occurred. Please check your connection.';
        console.error(error);
    } finally {
        sendBtn.disabled = false;
        sendBtn.textContent = 'Send';
    }
}