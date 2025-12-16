const yearEl = document.getElementById("year");
if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
}

const contactForm = document.querySelector(".contact-form form");
const statusMessage = document.querySelector(".form-status");
if (contactForm) {
    contactForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const formData = {
            nombre: contactForm.nombre.value.trim(),
            apellidos: contactForm.apellido.value.trim(),
            correo: contactForm.correo.value.trim(),
            mensaje: contactForm.mensaje.value.trim(),
            recaptcha: grecaptcha.getResponse()
        };

        if (!formData.recaptcha) {
            if (statusMessage) {
                statusMessage.textContent = "Por favor confirma que no eres un robot.";
                statusMessage.classList.add("error");
            }
            return;
        }

        if (statusMessage) {
            statusMessage.textContent = "Enviando mensaje...";
            statusMessage.classList.remove("error");
        }

        try {
            const response = await fetch("/api/contact", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.message || "No se pudo enviar el mensaje.");
            }

            if (statusMessage) {
                statusMessage.textContent = result.message || "¡Mensaje enviado!";
            }
            contactForm.reset();
            grecaptcha.reset();
        } catch (error) {
            if (statusMessage) {
                statusMessage.textContent = error.message || "Ocurrió un error al enviar el mensaje.";
                statusMessage.classList.add("error");
            } else {
                alert(error.message);
            }
            grecaptcha.reset();
        }
    });
}
