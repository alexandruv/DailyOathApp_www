const revealTargets = document.querySelectorAll(".reveal");
const notifyForm = document.querySelector(".notify-form");
const notifySuccessText = "You are on the list. I will email you when Daily Oath is available.";
const notifyErrorText = "I could not save that email right now. Please try again.";

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      }
    },
    { threshold: 0.18 }
  );

  for (const target of revealTargets) {
    observer.observe(target);
  }
} else {
  for (const target of revealTargets) {
    target.classList.add("is-visible");
  }
}

if (notifyForm) {
  notifyForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(notifyForm);
    const successMessage = notifyForm.querySelector(".notify-success");
    const button = notifyForm.querySelector("button");

    notifyForm.classList.remove("is-submitted");

    if (successMessage) {
      successMessage.hidden = true;
      successMessage.classList.remove("is-error");
      successMessage.textContent = notifySuccessText;
    }

    if (button) {
      button.disabled = true;
      button.textContent = "Saving...";
    }

    try {
      const response = await fetch(notifyForm.action, {
        method: "POST",
        body: new URLSearchParams(formData),
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });

      if (!response.ok) {
        throw new Error("Signup failed");
      }

      notifyForm.classList.add("is-submitted");

      if (successMessage) {
        successMessage.hidden = false;
        successMessage.classList.remove("is-error");
        successMessage.textContent = notifySuccessText;
      }

      notifyForm.reset();
    } catch {
      if (successMessage) {
        successMessage.hidden = false;
        successMessage.classList.add("is-error");
        successMessage.textContent = notifyErrorText;
      }
    } finally {
      if (button) {
        button.disabled = false;
        button.textContent = "Notify me";
      }
    }
  });
}
