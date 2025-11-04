document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

  // Clear loading message
  activitiesList.innerHTML = "";

  // Reset activity select (keep the default placeholder option)
  activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Build participants HTML. We'll include a delete button next to each participant.
        let participantsHtml = "";
        if (Array.isArray(details.participants) && details.participants.length > 0) {
          participantsHtml = `
            <div class="participants">
              <strong>Participants:</strong>
              <ul class="participants-list">
                ${details.participants
                  .map(
                    (p) =>
                      `<li class="participant-item"><span class="participant-email">${p}</span><button class="delete-btn" data-activity="${name}" data-email="${p}" title="Unregister">✖</button></li>`
                  )
                  .join("")}
              </ul>
            </div>
          `;
        } else {
          participantsHtml = `
            <div class="participants">
              <strong>Participants:</strong>
              <p class="no-participants">No participants yet</p>
            </div>
          `;
        }

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p class="availability"><strong>Availability:</strong> <span class="spots-left">${spotsLeft}</span> spots left</p>
          ${participantsHtml}
        `;

        activitiesList.appendChild(activityCard);

        // Attach delete handlers for each delete button inside this card
        const deleteButtons = activityCard.querySelectorAll(".delete-btn");
        deleteButtons.forEach((btn) => {
          btn.addEventListener("click", async (e) => {
            const activityName = btn.getAttribute("data-activity");
            const email = btn.getAttribute("data-email");

            if (!confirm(`Unregister ${email} from ${activityName}?`)) return;

            try {
              const res = await fetch(
                `/activities/${encodeURIComponent(activityName)}/participants?email=${encodeURIComponent(email)}`,
                { method: "DELETE" }
              );

              const payload = await res.json();

              if (res.ok) {
                // Remove the participant element from the DOM
                const li = btn.closest(".participant-item");
                if (li) li.remove();

                // If there are no more participants, show a friendly message
                const participantsContainer = activityCard.querySelector(".participants");
                const participantsUL = activityCard.querySelector(".participants-list");
                if (participantsUL && participantsUL.children.length === 0 && participantsContainer) {
                  participantsContainer.innerHTML = `<strong>Participants:</strong><p class="no-participants">No participants yet</p>`;
                }

                // Update spots left number
                const spotsSpan = activityCard.querySelector(".spots-left");
                if (spotsSpan) {
                  const current = parseInt(spotsSpan.textContent, 10);
                  // increment availability since someone was removed
                  spotsSpan.textContent = isNaN(current) ? "" : current + 1;
                }

                // Optionally show a success message briefly
                messageDiv.textContent = payload.message || "Participant removed";
                messageDiv.className = "message success";
                messageDiv.classList.remove("hidden");
                setTimeout(() => messageDiv.classList.add("hidden"), 4000);
              } else {
                messageDiv.textContent = payload.detail || "Failed to remove participant";
                messageDiv.className = "message error";
                messageDiv.classList.remove("hidden");
                setTimeout(() => messageDiv.classList.add("hidden"), 5000);
              }
            } catch (err) {
              console.error("Error unregistering participant:", err);
              messageDiv.textContent = "Network error while removing participant.";
              messageDiv.className = "message error";
              messageDiv.classList.remove("hidden");
              setTimeout(() => messageDiv.classList.add("hidden"), 5000);
            }
          });
        });

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "message success";
        signupForm.reset();

        // Refresh activities to show the newly registered participant immediately
        await fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "message error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
