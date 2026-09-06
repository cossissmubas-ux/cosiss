async function loadNews() {
  const newsContainer = document.getElementById("newsContainer");

  try {
    const response = await fetch("/api/news");

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    const news = await response.json();

    if (news.length === 0) {
      newsContainer.innerHTML = `
        <p class="no-news">No news available at the moment.</p>
      `;
      return;
    }

    newsContainer.innerHTML = news
      .map(
        (article) => `
          <article class="news-article">
            <img
              src="${article.image}"
              alt="${article.title}"
            />

            <p class="tag">News</p>

            <h3>${article.title}</h3>

            <p>
              ${article.description}
            </p>

            <a
              href="news.html?id=${article.id}"
              class="read-more"
            >
              Find out more →
            </a>
          </article>
        `
      )
      .join("");
  } catch (error) {
    console.error("Error loading news:", error);

    newsContainer.innerHTML = `
      <p class="error-message">
        Unable to load news at the moment.
      </p>
    `;
  }
}

document.addEventListener("DOMContentLoaded", loadNews);