const yearEl = document.getElementById("year");
if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
}

const navToggle = document.querySelector(".nav-toggle");
const navLinks = document.querySelectorAll(".site-nav a");
if (navToggle) {
    navToggle.addEventListener("click", () => {
        const isOpen = document.body.classList.toggle("nav-open");
        navToggle.setAttribute("aria-expanded", String(isOpen));
    });
}

navLinks.forEach((link) => {
    link.addEventListener("click", () => {
        if (document.body.classList.contains("nav-open")) {
            document.body.classList.remove("nav-open");
            navToggle?.setAttribute("aria-expanded", "false");
        }
    });
});

document.querySelectorAll(".contact-form form").forEach((form) => {
    const statusMessage = form.closest(".contact-form")?.querySelector(".form-status");
    const messageField = form.querySelector("textarea[name='mensaje'], textarea[id='mensaje-hero']");
    const serviceInputs = form.querySelectorAll("input[name='servicio']");

    const applyServicePrefix = () => {
        if (!messageField) return;
        const selected = Array.from(serviceInputs)
            .filter((i) => i.checked)
            .map((i) => i.value)
            .join(" + ");
        const cleaned = messageField.value.replace(/^\[Servicio: [^\]]+\]\s*/i, "");
        if (selected) {
            messageField.value = `[Servicio: ${selected}] ${cleaned}`.trimStart();
        } else {
            messageField.value = cleaned.trimStart();
        }
    };

    serviceInputs.forEach((input) => {
        input.addEventListener("change", applyServicePrefix);
    });

    if (serviceInputs.length) {
        applyServicePrefix();
    }
    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const formData = {
            nombre: form.nombre?.value?.trim(),
            apellidos: form.apellido?.value?.trim(),
            correo: form.correo?.value?.trim() || form["correo-hero"]?.value?.trim(),
            telefono: form["telefono-hero"]?.value?.trim(),
            empresa: form.empresa?.value?.trim(),
            mensaje: form.mensaje?.value?.trim() || form["mensaje-hero"]?.value?.trim(),
            servicio: Array.from(serviceInputs || [])
                .filter((i) => i.checked)
                .map((i) => i.value),
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
            form.reset();
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
});
