const modal = document.getElementById("selection-modal");
const problemIdInput = document.getElementById("modal-problem-id");
const modalTitle = document.getElementById("modal-title");
const modalDomain = document.getElementById("modal-domain");
const modalCount = document.getElementById("modal-count");
const searchInput = document.getElementById("problem-search");
const availabilityFilter = document.getElementById("availability-filter");
const chips = Array.from(document.querySelectorAll("[data-domain-filter]"));
const cards = Array.from(document.querySelectorAll("[data-problem-card]"));
const groups = Array.from(document.querySelectorAll("[data-domain-group]"));
const emptyState = document.getElementById("empty-state");
const selectionSearchInput = document.getElementById("selection-search");
const selectionDomainFilter = document.getElementById("selection-domain-filter");
const selectionRows = Array.from(document.querySelectorAll("[data-selection-row]"));
const selectionEmptyState = document.getElementById("selection-empty-state");
const signupModal = document.getElementById("signup-modal");
const loginModal = document.getElementById("login-modal");
// poster modal removed
const authModalKey = "codequest_auth_modal";
const countdown = document.querySelector("[data-countdown]");

let activeDomain = "All";


document.querySelectorAll("[data-open-selection]").forEach((button) => {
  button.addEventListener("click", () => {
    if (!modal || !problemIdInput || !modalTitle || !modalDomain || !modalCount) {
      return;
    }

    problemIdInput.value = button.dataset.problemId;
    modalTitle.textContent = button.dataset.problemTitle;
    modalDomain.textContent = button.dataset.problemDomain;
    modalCount.textContent = `${button.dataset.problemCount}/${button.dataset.problemLimit || 40} teams selected`;
    modal.showModal();
  });
});

document.querySelectorAll("[data-close-modal]").forEach((button) => {
  button.addEventListener("click", () => {
    if (modal?.open) {
      modal.close();
    }
  });
});


document.querySelectorAll("[data-open-signup]").forEach((button) => {
  button.addEventListener("click", () => {
    openSignupModal();
  });
});

document.querySelectorAll("[data-open-login]").forEach((button) => {
  button.addEventListener("click", () => {
    openLoginModal();
  });
});

document.querySelectorAll("[data-close-signup]").forEach((button) => {
  button.addEventListener("click", () => {
    closeSignupModal();
  });
});

document.querySelectorAll("[data-close-login]").forEach((button) => {
  button.addEventListener("click", () => {
    closeLoginModal();
  });
});

modal?.addEventListener("click", (event) => {
  if (event.target === modal) {
    modal.close();
  }
});

signupModal?.addEventListener("click", (event) => {
  if (event.target === signupModal) {
    closeSignupModal();
  }
});

loginModal?.addEventListener("click", (event) => {
  if (event.target === loginModal) {
    closeLoginModal();
  }
});


if (signupModal?.dataset.authAutoOpen === "true" || loginModal?.dataset.loginAutoOpen === "true") {
  window.requestAnimationFrame(() => {
    const savedModal = sessionStorage.getItem(authModalKey);
    if (savedModal === "login") {
      openLoginModal();
      return;
    }

    openSignupModal();
  });
}

initializeCountdown();

chips.forEach((chip) => {
  chip.addEventListener("click", () => {
    activeDomain = chip.dataset.domainFilter;
    chips.forEach((item) => item.classList.toggle("active", item === chip));
    applyFilters();
  });
});

searchInput?.addEventListener("input", applyFilters);
availabilityFilter?.addEventListener("change", applyFilters);
selectionSearchInput?.addEventListener("input", applySelectionFilters);
selectionDomainFilter?.addEventListener("change", applySelectionFilters);

function applyFilters() {
  const searchValue = (searchInput?.value || "").trim().toLowerCase();
  const availabilityValue = availabilityFilter?.value || "all";

  let visibleCount = 0;

  cards.forEach((card) => {
    const matchesDomain =
      activeDomain === "All" || card.dataset.domain === activeDomain.toLowerCase();
    const matchesSearch = !searchValue || card.dataset.search.includes(searchValue);
    const matchesAvailability =
      availabilityValue === "all" || card.dataset.status === availabilityValue;

    const matchesAll = matchesDomain && matchesSearch && matchesAvailability;
    card.hidden = !matchesAll;
    if (matchesAll) {
      visibleCount += 1;
    }
  });

  if (emptyState) {
    emptyState.hidden = visibleCount !== 0;
  }
}

function applySelectionFilters() {
  const searchValue = (selectionSearchInput?.value || "").trim().toLowerCase();
  const domainValue = (selectionDomainFilter?.value || "all").toLowerCase();
  let visibleCount = 0;

  selectionRows.forEach((row) => {
    const matchesSearch = !searchValue || row.dataset.selectionSearch.includes(searchValue);
    const matchesDomain = domainValue === "all" || row.dataset.selectionDomain === domainValue;
    row.hidden = !(matchesSearch && matchesDomain);
    if (!row.hidden) {
      visibleCount += 1;
    }
  });

  if (selectionEmptyState) {
    selectionEmptyState.hidden = visibleCount !== 0;
  }
}

// poster modal functions removed

function openSignupModal() {
  if (!signupModal) {
    return;
  }

  sessionStorage.setItem(authModalKey, "signup");
  if (loginModal?.open) {
    loginModal.close();
  }
  signupModal.showModal();
}

function closeSignupModal() {
  if (signupModal?.open) {
    signupModal.close();
  }
}

function openLoginModal() {
  if (!loginModal) {
    return;
  }

  sessionStorage.setItem(authModalKey, "login");
  if (signupModal?.open) {
    signupModal.close();
  }
  loginModal.showModal();
}

function closeLoginModal() {
  if (loginModal?.open) {
    loginModal.close();
  }
}

function initializeCountdown() {
  if (!countdown) {
    return;
  }

  const targetValue = countdown.dataset.countdownTarget;
  const status = countdown.querySelector("[data-countdown-status]");
  const valueNodes = {
    days: countdown.querySelector('[data-countdown-value="days"]'),
    hours: countdown.querySelector('[data-countdown-value="hours"]'),
    minutes: countdown.querySelector('[data-countdown-value="minutes"]'),
    seconds: countdown.querySelector('[data-countdown-value="seconds"]'),
  };

  const targetTime = new Date(targetValue).getTime();
  if (Number.isNaN(targetTime)) {
    if (status) {
      status.textContent = "Countdown unavailable right now.";
    }
    return;
  }

  function renderCountdown() {
    const now = Date.now();
    const diff = targetTime - now;

    if (diff <= 0) {
      setCountdownValues(valueNodes, {
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
      });

      if (status) {
        status.textContent = "Summership Challenge is here. Best of luck to all participants.";
      }
      return true;
    }

    const totalSeconds = Math.floor(diff / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    setCountdownValues(valueNodes, { days, hours, minutes, seconds });

    if (status) {
      status.textContent = "Timer running for Summership Challenge on 24 May 2026.";
    }

    return false;
  }

  const finished = renderCountdown();
  if (finished) {
    return;
  }

  const intervalId = window.setInterval(() => {
    const isFinished = renderCountdown();
    if (isFinished) {
      window.clearInterval(intervalId);
    }
  }, 1000);
}

function setCountdownValues(nodes, values) {
  Object.entries(values).forEach(([key, value]) => {
    if (nodes[key]) {
      nodes[key].textContent = String(value).padStart(2, "0");
    }
  });
}

// Back-to-top button: show on scroll, indicate 'full' when at document bottom
(() => {
  const btn = document.getElementById("back-to-top");
  // Ensure the button is a direct child of <body> so fixed positioning behaves consistently
  if (btn && btn.parentElement !== document.body) {
    document.body.appendChild(btn);
  }
  if (!btn) return;

  function updateButton() {
    const scrolly = window.scrollY || window.pageYOffset;
    const show = scrolly > 200;
    if (show) {
      btn.classList.add("visible");
    } else {
      btn.classList.remove("visible");
    }

    const atBottom = window.innerHeight + scrolly >= document.documentElement.scrollHeight - 8;
    if (atBottom) {
      btn.classList.add("full");
      btn.innerHTML = "&#8593; Full";
    } else {
      btn.classList.remove("full");
      btn.innerHTML = "&#8593; Top";
    }
  }

  window.addEventListener("scroll", updateButton, { passive: true });
  window.addEventListener("resize", updateButton);
  updateButton();

  btn.addEventListener("click", (e) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
})();
