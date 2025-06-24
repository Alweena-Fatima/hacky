let currentStep = 1;
        let extractedData = {};
        let stream = null;

        // Initialize magical effects
        function initMagicalEffects() {
            createStars();
            createFloatingElements();
        }

        function createStars() {
            const starsContainer = document.getElementById('stars');
            for (let i = 0; i < 100; i++) {
                const star = document.createElement('div');
                star.className = 'star';
                star.style.left = Math.random() * 100 + '%';
                star.style.top = Math.random() * 100 + '%';
                star.style.animationDelay = Math.random() * 3 + 's';
                starsContainer.appendChild(star);
            }
        }

        function createFloatingElements() {
            const container = document.getElementById('floating-elements');
            const magicalElements = ['✨', '⭐', '🌟', '💫', '🔮', '🪄', '⚡'];
            const hogwartsElements = ['🏰', '📜', '🦉', '🕯️', '⚗️', '🎓', '📚', '🗝️', '🏉'];
            const phasesElements = [
                'Wingardium Leviosa', 'Expecto Patronum',
                'Alohomora', 'Dobby is free', 'After all this time?',
                'Avada Kedavra', 'Sectumsempra',
                'Riddikulus', 'I solemnly swear', 'Always...', 'Muggles', 'Quidditch',
                'Hogwarts Express', 'Gryffindor!'
            ];

            // Create regular floating magical elements
            for (let i = 0; i < 10; i++) {
                const element = document.createElement('div');
                element.className = 'floating-element';
                element.textContent = magicalElements[Math.floor(Math.random() * magicalElements.length)];
                element.style.left = Math.random() * 100 + '%';
                element.style.top = Math.random() * 100 + '%';
                element.style.animationDelay = Math.random() * 6 + 's';
                element.style.animationDuration = (4 + Math.random() * 4) + 's';
                container.appendChild(element);
            }

            // Create Hogwarts-themed floating elements
            for (let i = 0; i < hogwartsElements.length; i++) {
                const element = document.createElement('div');
                element.className = 'hogwarts-element';
                element.textContent = hogwartsElements[Math.floor(Math.random() * hogwartsElements.length)];
                element.style.left = Math.random() * 100 + '%';
                element.style.top = Math.random() * 100 + '%';
                element.style.animationDelay = Math.random() * 8 + 's';
                element.style.animationDuration = (6 + Math.random() * 4) + 's';
                container.appendChild(element);
            }

            // Create flying broomsticks
            for (let i = 0; i < 3; i++) {
                const broomstick = document.createElement('div');
                broomstick.className = 'broomstick';
                broomstick.innerHTML = '🧙🧹'; // Wizard on broomstick
                broomstick.style.animationDelay = (i * 4) + 's';
                broomstick.style.animationDuration = (10 + Math.random() * 4) + 's';
                broomstick.style.top = (10 + Math.random() * 60) + '%';
                container.appendChild(broomstick);
            }
            // Create flying broomsticks
            for (let i = 0; i < 3; i++) {
                const broomstick = document.createElement('div');
                broomstick.className = 'broomstick';
                broomstick.innerHTML = '🧙‍♂️🧹'; // Wizard on broomstick
                broomstick.style.animationDelay = (i * 4) + 's';
                broomstick.style.animationDuration = (10 + Math.random() * 4) + 's';
                broomstick.style.top = (10 + Math.random() * 60) + '%';
                container.appendChild(broomstick);
            }

            // Create magical particles
            for (let i = 0; i < 20; i++) {
                const particle = document.createElement('div');
                particle.className = 'magical-particle';
                particle.style.left = Math.random() * 100 + '%';
                particle.style.top = Math.random() * 100 + '%';
                particle.style.animationDelay = Math.random() * 3 + 's';
                particle.style.animationDuration = (2 + Math.random() * 2) + 's';
                container.appendChild(particle);
            }
            // Create floating Hogwarts phrases
            for (let i = 0; i < 6; i++) {
                const phrase = document.createElement('div');
                phrase.className = 'floating-phrase';
                phrase.textContent = phasesElements[Math.floor(Math.random() * phasesElements.length)];
                phrase.style.left = Math.random() * 100 + '%';
                phrase.style.top = Math.random() * 100 + '%';
                phrase.style.animationDelay = Math.random() * 10 + 's';
                phrase.style.animationDuration = (8 + Math.random() * 6) + 's';
                container.appendChild(phrase);
            }
        }

        function nextStep(step) {
            // Hide current step
            document.getElementById(`step${currentStep}`).classList.add('hidden');

            // Update progress
            document.getElementById(`progress${currentStep}`).classList.remove('active');
            document.getElementById(`progress${currentStep}`).classList.add('completed');

            if (currentStep < 4) {
                document.getElementById(`line${currentStep}`).classList.add('completed');
            }

            currentStep = step;

            // Show next step
            document.getElementById(`step${currentStep}`).classList.remove('hidden');
            document.getElementById(`progress${currentStep}`).classList.add('active');
        }

        function triggerFileUpload() {
            document.getElementById('documentUpload').click();
        }

        function handleFileUpload(event) {
            const file = event.target.files[0];
            if (file) {
                console.log('File selected:', file.name);
                nextStep(3); // show step 3 (loading spinner)

                const formData = new FormData();
                formData.append("file", file);

                fetch("http://127.0.0.1:5000/extract", {
                    method: "POST",
                    body: formData,
                })
                    .then(response => response.json())
                    .then(data => {
                        document.getElementById("loading").classList.add("hidden");
                        document.getElementById("extractedData").classList.remove("hidden");

                        // Set DOB first
                        const dob = data.dob || "Not found";
                        document.getElementById("extractedDOB").textContent = dob;

                        // Then calculate age
                        if (dob && dob !== "Not found") {
                            try {
                                const age = calculateAgeFromDOB(dob);
                                console.log("Final age result:", age); // Debug log
                                document.getElementById("extractedAge").textContent =
                                    (typeof age === 'number') ? `${age} years` : age;
                            } catch (error) {
                                console.error("Age calculation error:", error);
                                document.getElementById("extractedAge").textContent = "Error calculating age";
                            }
                        } else {
                            document.getElementById("extractedAge").textContent = "Not found";
                        }

                        // Handle extracted photo
                        const photoPlaceholder = document.getElementById("photoPlaceholder");
                        const extractedPhoto = document.getElementById("extractedPhoto");

                        if (data.photo && data.photo !== null) {
                            // If photo is base64 encoded string
                            if (typeof data.photo === 'string') {
                                // Check if it already has data URL prefix
                                const photoSrc = data.photo.startsWith('data:image/')
                                    ? data.photo
                                    : `data:image/jpeg;base64,${data.photo}`;

                                extractedPhoto.src = photoSrc;
                                extractedPhoto.classList.remove("hidden");
                                photoPlaceholder.classList.add("hidden");
                            }
                            // If photo is returned as a URL/path
                            else if (data.photo_url) {
                                extractedPhoto.src = `http://127.0.0.1:5000${data.photo_url}`;
                                extractedPhoto.classList.remove("hidden");
                                photoPlaceholder.classList.add("hidden");
                            }
                        } else {
                            // No photo found, keep placeholder visible
                            photoPlaceholder.textContent = "📷 No photo detected";
                            extractedPhoto.classList.add("hidden");
                        }

                        // Rest of your existing code for other extracted data...
                        // Add your other data extraction code here (name, gender, aadhaar, etc.)
                    })
                    .catch(error => {
                        console.error("Error during OCR:", error);
                        document.getElementById("loading").classList.add("hidden");

                        // Show error state
                        const photoPlaceholder = document.getElementById("photoPlaceholder");
                        photoPlaceholder.textContent = "📷 Error extracting photo";

                        // You might want to show an error message to the user
                        alert("Error processing the document. Please try again.");
                    });
            }
        }
        function calculateAgeFromDOB(dobString) {
            console.log("Received DOB string:", dobString); // Debug log

            // Return if no DOB provided
            if (!dobString || dobString === "Not found") {
                console.log("No DOB provided");
                return "Not found";
            }

            // First try parsing as ISO format (YYYY-MM-DD)
            let dob = new Date(dobString);
            console.log("First parse attempt:", dob); // Debug log

            // If that fails, try DD/MM/YYYY format
            if (isNaN(dob.getTime())) {
                console.log("Trying DD/MM/YYYY format"); // Debug log
                const parts = dobString.split("/").map(Number);

                if (parts.length === 3) {
                    // Validate date components
                    if (parts[1] < 1 || parts[1] > 12) {
                        console.log("Invalid month");
                        return "Invalid date";
                    }

                    // Note: months are 0-indexed in JavaScript Date
                    dob = new Date(parts[2], parts[1] - 1, parts[0]);
                    console.log("Second parse attempt:", dob); // Debug log
                } else if (parts.length === 1 && !isNaN(parts[0])) {
                    // Only year provided
                    const age = new Date().getFullYear() - parts[0];
                    console.log("Year-only age:", age); // Debug log
                    return age;
                } else {
                    console.log("Unexpected date format");
                    return "Invalid date format";
                }
            }

            // Check if date is valid
            if (isNaN(dob.getTime())) {
                console.log("Final date validation failed");
                return "Invalid date";
            }

            const today = new Date();
            let age = today.getFullYear() - dob.getFullYear();
            const monthDiff = today.getMonth() - dob.getMonth();

            console.log("Initial age calculation:", age); // Debug log
            console.log("Month difference:", monthDiff); // Debug log
            console.log("Day comparison:", today.getDate(), "<", dob.getDate()); // Debug log

            // Adjust age if birthday hasn't occurred yet this year
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
                age--;
                console.log("Adjusted age:", age); // Debug log
            }

            return age;
        }



        async function startCamera() {
            try {
                console.log('Requesting camera access...');

                // Check if navigator.mediaDevices is available
                if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                    throw new Error('Camera API not supported in this browser');
                }

                // Request camera with specific constraints for better compatibility
                const constraints = {
                    video: {
                        width: { ideal: 640 },
                        height: { ideal: 480 },
                        facingMode: 'user' // Front camera preferred
                    }
                };

                stream = await navigator.mediaDevices.getUserMedia(constraints);
                const video = document.getElementById('video');

                video.srcObject = stream;
                video.style.display = 'block';

                // Wait for video to be ready
                video.onloadedmetadata = () => {
                    console.log('Camera activated successfully!');
                    video.play();
                };

                document.getElementById('cameraOverlay').style.display = 'block';
                document.getElementById('startCameraBtn').classList.add('hidden');
                document.getElementById('captureBtn').classList.remove('hidden');
                document.getElementById('cameraInstructions').style.display = 'none';

            } catch (error) {
                console.error('Camera error:', error);
                let errorMessage = '';
                let solutions = '';

                if (error.name === 'NotAllowedError') {
                    errorMessage = '🚫 Camera Access Denied';
                    solutions = `
                        <div style="margin-top: 10px; text-align: left;">
                        <strong>How to fix:</strong><br>
                        1. Look for 🎥 icon in your browser address bar<br>
                        2. Click it and select "Allow"<br>
                        3. Or go to browser Settings → Privacy → Camera<br>
                        4. Refresh the page and try again
                        </div>
                    `;
                } else if (error.name === 'NotFoundError') {
                    errorMessage = '📹 No Camera Found';
                    solutions = 'Please connect a camera to your device and try again.';
                } else if (error.name === 'NotSupportedError') {
                    errorMessage = '🌐 Browser Not Supported';
                    solutions = 'Please use Chrome, Firefox, Safari, or Edge browser.';
                } else if (error.name === 'NotReadableError') {
                    errorMessage = '🔒 Camera In Use';
                    solutions = 'Another app might be using your camera. Close other apps and try again.';
                } else {
                    errorMessage = '⚠️ Camera Error';
                    solutions = 'Please check your camera settings and try again.';
                }

                // Show error in a magical way
                const resultDiv = document.getElementById('verificationResult');
                resultDiv.className = 'result failure';
                resultDiv.innerHTML = `
                    <div style="font-size: 1.5rem; margin-bottom: 10px;">❌</div>
                    <div style="font-size: 1.1rem; margin-bottom: 10px;">${errorMessage}</div>
                    <div style="font-size: 0.9rem;">${solutions}</div>
                `;
                resultDiv.classList.remove('hidden');
            }
        }

        function skipCamera() {
            // Hide instructions and show demo result
            document.getElementById('cameraInstructions').style.display = 'none';
            document.getElementById('startCameraBtn').classList.add('hidden');

            // Show demo verification result
            setTimeout(() => {
                const resultDiv = document.getElementById('verificationResult');
                resultDiv.className = 'result success';
                resultDiv.innerHTML = `
                    <div style="font-size: 2rem; margin-bottom: 10px;">✅</div>
                    <div>Demo Mode - Verification Simulated!</div>
                    <div style="font-size: 0.9rem; margin-top: 10px;">
                        Age: ${extractedData.age} years (✓ 18+)<br>
                        Face Match: 95% (✓ Demo Verified)<br>
                        Status: Access Granted to Magical Realm<br>
                        <em>Note: This is a demo simulation</em>
                    </div>
                `;
                resultDiv.classList.remove('hidden');
                document.getElementById('restartBtn').classList.remove('hidden');
            }, 1000);
        }

        function capturePhoto() {
            const video = document.getElementById('video');
            const canvas = document.getElementById('canvas');
            const ctx = canvas.getContext('2d');

            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            ctx.drawImage(video, 0, 0);

            // Stop camera
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }

            video.style.display = 'none';
            document.getElementById('cameraOverlay').style.display = 'none';
            document.getElementById('captureBtn').classList.add('hidden');

            // Simulate verification process
            setTimeout(() => {
                showVerificationResult();
            }, 2000);
        }

        function showVerificationResult() {
            const resultDiv = document.getElementById('verificationResult');
            const isSuccess = Math.random() > 0.3; // 70% success rate for demo

            if (isSuccess) {
                resultDiv.className = 'result success';
                resultDiv.innerHTML = `
                    <div style="font-size: 2rem; margin-bottom: 10px;">✅</div>
                    <div>Verification Successful!</div>
                    <div style="font-size: 0.9rem; margin-top: 10px;">
                        Age: ${extractedData.age} years (✓ 18+)<br>
                        Face Match: 94% (✓ Verified)<br>
                        Status: Access Granted to Magical Realm
                    </div>
                `;
            } else {
                resultDiv.className = 'result failure';
                resultDiv.innerHTML = `
                    <div style="font-size: 2rem; margin-bottom: 10px;">❌</div>
                    <div>Verification Failed</div>
                    <div style="font-size: 0.9rem; margin-top: 10px;">
                        Face Match: 45% (✗ Below threshold)<br>
                        Please try again with better lighting
                    </div>
                `;
            }

            resultDiv.classList.remove('hidden');
            document.getElementById('restartBtn').classList.remove('hidden');
        }

        function restart() {
            // Reset everything
            currentStep = 1;
            extractedData = {};

            // Hide all steps
            for (let i = 1; i <= 4; i++) {
                document.getElementById(`step${i}`).classList.add('hidden');
                document.getElementById(`progress${i}`).classList.remove('active', 'completed');
                if (i < 4) {
                    document.getElementById(`line${i}`).classList.remove('completed');
                }
            }

            // Show first step
            document.getElementById('step1').classList.remove('hidden');
            document.getElementById('progress1').classList.add('active');

            // Reset file input
            document.getElementById('documentUpload').value = '';

            // Reset step 3
            document.getElementById('loading').classList.remove('hidden');
            document.getElementById('extractedData').classList.add('hidden');

            // Reset step 4
            document.getElementById('video').style.display = 'none';
            document.getElementById('cameraOverlay').style.display = 'none';
            document.getElementById('startCameraBtn').classList.remove('hidden');
            document.getElementById('captureBtn').classList.add('hidden');
            document.getElementById('verificationResult').classList.add('hidden');
            document.getElementById('restartBtn').classList.add('hidden');
        }

        // Initialize on page load
        window.addEventListener('load', initMagicalEffects);