// Bootstrap validation script
(function () {
    'use strict';

    // Fetch all forms needing validation
    var forms = document.querySelectorAll('.needs-validation');

    // Loop over forms and prevent submission if invalid
    Array.prototype.slice.call(forms)
        .forEach(function (form) {
            form.addEventListener('submit', function (event) {
                if (!form.checkValidity()) {
                    event.preventDefault();
                    event.stopPropagation();
                }

                form.classList.add('was-validated');
            }, false);
        });
})();

const form = document.querySelector('form');
const password = document.getElementById('password');
const confirmPassword = document.getElementById('confirmPassword');
const dob = document.getElementById('dob');



// Custom Validation

function customValidation() {
    let isValid = true;

    const phoneInput = document.getElementById('phone');
    const phoneError = document.getElementById('phoneError');
    const phoneValue = phoneInput.value.trim(); 
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(phoneValue)) {
        phoneInput.setCustomValidity("Invalid phone number");
        phoneError.textContent = "Phone number must be exactly 10 digits.";
        isValid = false;
    } else {
        phoneInput.setCustomValidity("");
        phoneError.textContent = "";
    }

    const passwordInput = document.getElementById('password');
    const passwordError = document.getElementById('passwordError');
    const passwordValue = passwordInput.value.trim();
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;
    if (!passwordRegex.test(passwordValue)) {
        passwordInput.setCustomValidity("Weak password");
        passwordError.textContent = "Password must be 8+ chars with uppercase, lowercase, number, and special char.";
        isValid = false;
    } else {
        passwordInput.setCustomValidity("");
        passwordError.textContent = "";
    }

    const emailInput = document.getElementById('email');
    const emailError = document.getElementById('emailError');
    const emailValue = emailInput.value.trim();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(emailValue)) {
        emailInput.setCustomValidity("Invalid email format");
        emailError.textContent = "Enter a valid email address.";
        isValid = false;
    } else {
        emailInput.setCustomValidity("");
        emailError.textContent = "";
    }

    return isValid;
}

form.addEventListener('submit', function (event) {
    let isValid = true;

    // Check if passwords match
    if (password.value !== confirmPassword.value) {
        confirmPassword.setCustomValidity('Passwords do not match');
        confirmPassword.classList.add('is-invalid');
        isValid = false;
    } else {
        confirmPassword.setCustomValidity('');
        confirmPassword.classList.remove('is-invalid');
    }

    // Check if user is at least 18 years old
    const dobValue = new Date(dob.value);
    const today = new Date();
    let age = today.getFullYear() - dobValue.getFullYear();
    const monthDiff = today.getMonth() - dobValue.getMonth();
    const dayDiff = today.getDate() - dobValue.getDate();

    if (age < 18 || (age === 18 && (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)))) {
        dob.setCustomValidity('You must be at least 18 years old');
        dob.classList.add('is-invalid');
        isValid = false;
    } else {
        dob.setCustomValidity('');
        dob.classList.remove('is-invalid');
    }

    if (!isValid) {
        event.preventDefault();
        event.stopPropagation();
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const phoneInput = document.getElementById('phone');
    const phoneError = document.getElementById('phoneError');

    phoneInput.addEventListener('input', () => {
        const phoneValue = phoneInput.value.trim();
        const phoneRegex = /^\d{10}$/;

        if (!phoneRegex.test(phoneValue)) {
            phoneInput.classList.add('is-invalid');
            phoneInput.classList.remove('is-valid');
            phoneError.textContent = "Phone number must be exactly 10 digits.";
        } else {
            phoneInput.classList.remove('is-invalid');
            phoneInput.classList.add('is-valid');
            phoneError.textContent = "";
        }
    });
});



document.addEventListener('DOMContentLoaded', () => {
    const passwordInput = document.getElementById('password');
    const passwordStrength = document.getElementById('passwordStrength');
    const passwordError = document.getElementById('passwordError');

    passwordInput.addEventListener('input', () => {
        const value = passwordInput.value;
        let strength = 0;

        // Check different password conditions
        if (value.length >= 8) strength++;              // Minimum 8 characters
        if (/[A-Z]/.test(value)) strength++;             // Uppercase letter
        if (/[a-z]/.test(value)) strength++;             // Lowercase letter
        if (/[0-9]/.test(value)) strength++;             // Number
        if (/[^A-Za-z0-9]/.test(value)) strength++;      // Special character

        // Update the strength meter
        updateStrengthMeter(strength);

        // Basic validation for form
        if (strength < 3) {
            passwordInput.classList.add('is-invalid');
            passwordInput.classList.remove('is-valid');
            passwordError.textContent = "Password must be stronger (at least 8 characters, mix of letters, numbers, symbols).";
        } else {
            passwordInput.classList.remove('is-invalid');
            passwordInput.classList.add('is-valid');
            passwordError.textContent = "";
        }
    });

    function updateStrengthMeter(strength) {
        let strengthText = '';
        let color = '';

        switch (strength) {
            case 0:
            case 1:
                strengthText = 'Very Weak';
                color = 'red';
                break;
            case 2:
                strengthText = 'Weak';
                color = 'orange';
                break;
            case 3:
                strengthText = 'Moderate';
                color = 'gold';
                break;
            case 4:
                strengthText = 'Strong';
                color = 'blue';
                break;
            case 5:
                strengthText = 'Very Strong';
                color = 'green';
                break;
        }

        passwordStrength.innerHTML = `<div style="height: 8px; width: 100%; background-color: lightgray; border-radius: 4px; overflow: hidden;">
            <div style="height: 8px; width: ${(strength / 5) * 100}%; background-color: ${color};"></div>
        </div>
        <small style="color: ${color};">${strengthText}</small>`;
    }
});

