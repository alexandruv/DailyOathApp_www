const PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=com.dailyoath.daily_oath_app";

function trackPlayStoreClick(location) {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: "play_store_click",
    click_location: location,
    link_url: PLAY_STORE_URL,
  });
}

for (const link of document.querySelectorAll(".js-play-store-link")) {
  link.addEventListener("click", () => {
    const location = link.dataset.analyticsLocation;
    if (location) {
      trackPlayStoreClick(location);
    }
  });
}

const revealTargets = document.querySelectorAll(".reveal");

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
